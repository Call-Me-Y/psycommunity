package org.psycommunity.api.service;

import jakarta.annotation.PostConstruct;
import org.psycommunity.api.domain.UserAccount;
import org.psycommunity.api.repository.UserAccountRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

/** Creates real, reciprocal default contacts while preserving existing remarks. */
@Service
public class AdminFriendService {
    private final JdbcTemplate db;
    private final UserAccountRepository users;
    private final TransactionTemplate transactions;

    public AdminFriendService(JdbcTemplate db, UserAccountRepository users, TransactionTemplate transactions) {
        this.db=db; this.users=users; this.transactions=transactions;
    }

    @PostConstruct
    void initialize() {
        db.execute("CREATE TABLE IF NOT EXISTS psy_admin_friend_setup (id INTEGER PRIMARY KEY, migrated BOOLEAN NOT NULL)");
        db.execute("INSERT INTO psy_admin_friend_setup(id,migrated) VALUES (1,FALSE) ON CONFLICT DO NOTHING");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void migrateExistingUsers() { transactions.executeWithoutResult(status->lockAndMigrate()); }

    // Call inside the account-creation or role-change transaction. The row lock also
    // serializes concurrent registrations and administrator creation until commit.
    public void lockAndMigrate() {
        Boolean migrated=db.queryForObject("SELECT migrated FROM psy_admin_friend_setup WHERE id=1 FOR UPDATE",Boolean.class);
        if(Boolean.TRUE.equals(migrated)) return;
        List<UserAccount> admins=users.findByTypeOrderByUidAsc(0);
        if(admins.isEmpty()) return;
        for(UserAccount admin:admins) insertAdminLinks(admin.getUid());
        db.update("UPDATE psy_admin_friend_setup SET migrated=TRUE WHERE id=1");
    }

    public void linkNewUser(String uid) {
        lockAndMigrate();
        for(UserAccount admin:users.findByTypeOrderByUidAsc(0)) {
            if(uid.equals(admin.getUid())) continue;
            insertLink(uid,admin.getUid());
            insertLink(admin.getUid(),uid);
        }
    }

    public void linkNewAdministrator(String uid) {
        lockAndMigrate();
        insertAdminLinks(uid);
    }

    public void removeUserLinks(String uid) {
        lockAndMigrate();
        db.update("DELETE FROM psy_contacts WHERE uid=? OR contact_uid=?",uid,uid);
    }

    private void insertLink(String uid,String other) {
        db.update("INSERT INTO psy_contacts(uid,contact_uid,remark) VALUES (?,?,?) ON CONFLICT DO NOTHING",uid,other,"");
    }

    private void insertAdminLinks(String admin) {
        db.update("INSERT INTO psy_contacts(uid,contact_uid,remark) SELECT ?,u.uid,'' FROM users u WHERE u.uid<>? ON CONFLICT DO NOTHING",admin,admin);
        db.update("INSERT INTO psy_contacts(uid,contact_uid,remark) SELECT u.uid,?,'' FROM users u WHERE u.uid<>? ON CONFLICT DO NOTHING",admin,admin);
    }
}
