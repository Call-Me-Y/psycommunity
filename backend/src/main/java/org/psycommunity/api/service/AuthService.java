package org.psycommunity.api.service;

import org.psycommunity.api.domain.UserAccount;
import org.psycommunity.api.domain.UserProfile;
import org.psycommunity.api.repository.UserAccountRepository;
import org.psycommunity.api.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final UserProfileRepository profiles;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AdminFriendService adminFriends;

    public AuthService(UserAccountRepository users, UserProfileRepository profiles,
                       PasswordEncoder passwordEncoder, JwtService jwtService, AdminFriendService adminFriends) {
        this.users = users;
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.adminFriends = adminFriends;
    }

    @Transactional
    public Map<String, Object> register(Map<String, Object> input) {
        String uid = text(input.getOrDefault("uid", input.get("username"))).trim();
        String password = text(input.get("password"));
        if (!uid.matches("[\\p{L}\\p{N}_.@-]{1,50}") || password.length() < 8 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "账号格式不正确，密码需至少 8 位且不超过 72 字节");
        }
        adminFriends.lockAndMigrate();
        if (users.existsById(uid)) throw new ApiException(HttpStatus.CONFLICT, "账号已存在");
        UserAccount account = users.saveAndFlush(new UserAccount(uid, passwordEncoder.encode(password), 2));
        String name = text(input.getOrDefault("name", uid)).trim();
        profiles.save(new UserProfile(uid, name.isBlank() ? uid : name, "/static/avatar.png"));
        adminFriends.linkNewUser(uid);
        return loginResult(account, "注册成功");
    }

    public Map<String, Object> login(Map<String, Object> input) {
        String uid = text(input.get("uid")).trim();
        String password = text(input.get("password"));
        UserAccount user = users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "账号或密码错误"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
        }
        return loginResult(user, "登录成功");
    }

    public Map<String, Object> verifyToken(String token) {
        Map<String, Object> claims = jwtService.read(token == null ? "" : token);
        String uid = (String) claims.get("uid");
        UserAccount user = users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "账号不存在"));
        return Map.of("success", true, "user", userSummary(user));
    }

    public UserAccount require(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "请先登录");
        }
        Map<String, Object> claims = jwtService.read(authorization.substring(7).trim());
        String uid = (String) claims.get("uid");
        return users.findById(uid).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "账号不存在"));
    }

    @Transactional
    public void changePassword(UserAccount user, Map<String, Object> input) {
        String oldPassword = text(input.get("old_password"));
        String newPassword = text(input.get("new_password"));
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "当前密码不正确");
        }
        if (newPassword.length() < 8 || newPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) throw new ApiException(HttpStatus.BAD_REQUEST, "新密码需至少 8 位且不超过 72 字节");
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        users.save(user);
    }

    public Map<String, Object> userSummary(UserAccount user) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("uid", user.getUid());
        result.put("type", user.getType());
        return result;
    }

    private Map<String, Object> loginResult(UserAccount user, String message) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("message", message);
        result.put("token", jwtService.create(user.getUid(), user.getType()));
        result.put("user", userSummary(user));
        return result;
    }

    private static String text(Object value) { return value == null ? "" : String.valueOf(value); }
}
