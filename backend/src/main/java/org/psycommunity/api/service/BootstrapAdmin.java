package org.psycommunity.api.service;

import org.psycommunity.api.domain.UserAccount;
import org.psycommunity.api.domain.UserProfile;
import org.psycommunity.api.repository.UserAccountRepository;
import org.psycommunity.api.repository.UserProfileRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapAdmin implements ApplicationRunner {
    private final UserAccountRepository users;
    private final UserProfileRepository profiles;
    private final PasswordEncoder passwordEncoder;
    private final AdminFriendService adminFriends;

    public BootstrapAdmin(UserAccountRepository users, UserProfileRepository profiles, PasswordEncoder passwordEncoder, AdminFriendService adminFriends) {
        this.users = users;
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.adminFriends = adminFriends;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String uid = System.getenv("BOOTSTRAP_ADMIN_UID");
        String password = System.getenv("BOOTSTRAP_ADMIN_PASSWORD");
        if ((uid == null || uid.isBlank()) && (password == null || password.isBlank())) return;
        if (uid == null || !uid.matches("[\\p{L}\\p{N}_.@-]{1,50}") || password == null || password.length() < 12
                || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("初始管理员账号格式无效，或密码少于12位、超过72字节");
        }
        adminFriends.lockAndMigrate();
        if (users.existsById(uid)) return;
        users.saveAndFlush(new UserAccount(uid, passwordEncoder.encode(password), 0));
        profiles.save(new UserProfile(uid, uid, AdminAvatarService.ADMIN_AVATAR));
        adminFriends.linkNewAdministrator(uid);
    }
}
