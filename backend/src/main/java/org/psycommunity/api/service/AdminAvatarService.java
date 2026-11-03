package org.psycommunity.api.service;

import jakarta.annotation.PostConstruct;
import org.psycommunity.api.domain.UserAccount;
import org.psycommunity.api.repository.UserProfileRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AdminAvatarService {
    public static final String ADMIN_AVATAR = "/static/admin.jpg";
    public static final String USER_AVATAR = "/static/avatar.png";
    private final JdbcTemplate db;
    private final UserProfileRepository profiles;
    private final TransactionTemplate transactions;

    public AdminAvatarService(JdbcTemplate db, UserProfileRepository profiles, TransactionTemplate transactions) {
        this.db=db; this.profiles=profiles; this.transactions=transactions;
    }

    @PostConstruct
    void initialize() {
        db.execute("CREATE TABLE IF NOT EXISTS psy_admin_avatar_migration (id INTEGER PRIMARY KEY)");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void migrateExistingDefaults() {
        transactions.executeWithoutResult(status -> {
            if(db.update("INSERT INTO psy_admin_avatar_migration(id) VALUES (1) ON CONFLICT DO NOTHING")==0) return;
            db.update("UPDATE user_profiles SET avatar=? WHERE uid IN (SELECT uid FROM users WHERE user_type=0) AND (avatar IS NULL OR avatar='' OR avatar=?)",ADMIN_AVATAR,USER_AVATAR);
        });
    }

    // Called when a user becomes an administrator; preserve any chosen custom avatar.
    public void applyDefaultIfNeeded(String uid) {
        profiles.findById(uid).ifPresent(profile -> {
            String avatar=profile.getAvatar();
            if(avatar==null || avatar.isBlank() || USER_AVATAR.equals(avatar)) {
                profile.setAvatar(ADMIN_AVATAR);
                profiles.save(profile);
            }
        });
    }

    public static String defaultFor(UserAccount user) { return user.getType()==0 ? ADMIN_AVATAR : USER_AVATAR; }

    public static String avatarOrDefault(UserAccount user,String avatar) {
        return avatar==null || avatar.isBlank() ? defaultFor(user) : avatar;
    }
}
