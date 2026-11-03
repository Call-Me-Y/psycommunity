package org.psycommunity.api.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.psycommunity.api.domain.CommunityPost;
import org.psycommunity.api.domain.PostComment;
import org.psycommunity.api.domain.PostLike;
import org.psycommunity.api.domain.UserAccount;
import org.psycommunity.api.domain.UserProfile;
import org.psycommunity.api.repository.CommunityPostRepository;
import org.psycommunity.api.repository.PostCommentRepository;
import org.psycommunity.api.repository.PostLikeRepository;
import org.psycommunity.api.repository.UserAccountRepository;
import org.psycommunity.api.repository.UserProfileRepository;
import org.psycommunity.api.service.ApiException;
import org.psycommunity.api.service.AuthService;
import org.psycommunity.api.service.EmotionService;
import org.psycommunity.api.service.AdminFriendService;
import org.psycommunity.api.service.AdminAvatarService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class CommunityController {
    private final AuthService auth;
    private final UserAccountRepository users;
    private final UserProfileRepository profiles;
    private final CommunityPostRepository posts;
    private final PostLikeRepository likes;
    private final PostCommentRepository comments;
    private final ObjectMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final EmotionService emotion;
    private final AdminFriendService adminFriends;
    private final AdminAvatarService adminAvatars;
    private final Path uploadRoot;

    public CommunityController(AuthService auth, UserAccountRepository users, UserProfileRepository profiles,
                               CommunityPostRepository posts, PostLikeRepository likes,
                               PostCommentRepository comments, ObjectMapper mapper, PasswordEncoder passwordEncoder, EmotionService emotion, AdminFriendService adminFriends, AdminAvatarService adminAvatars,
                               @Value("${app.upload-dir}") String uploadDir) {
        this.auth = auth;
        this.users = users;
        this.profiles = profiles;
        this.posts = posts;
        this.likes = likes;
        this.comments = comments;
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
        this.emotion = emotion;
        this.adminFriends = adminFriends;
        this.adminAvatars = adminAvatars;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @GetMapping("/health")
    public Map<String, Object> health() { return body("success", true, "status", "ok"); }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, Object> input) { return auth.register(input); }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> input) { return auth.login(input); }

    @PostMapping("/verify-token")
    public Map<String, Object> verifyToken(@RequestBody Map<String, Object> input) {
        return auth.verifyToken(string(input.get("token")));
    }

    @PostMapping("/user/change-password")
    public Map<String, Object> changePassword(@RequestHeader(value = "Authorization", required = false) String authorization,
                                              @RequestBody Map<String, Object> input) {
        auth.changePassword(auth.require(authorization), input);
        return body("success", true, "message", "密码已更新");
    }

    @GetMapping("/admin/users")
    public Map<String, Object> allUsers(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(auth.require(authorization));
        List<Map<String, Object>> result = users.findAll().stream().map(this::userWithProfile).toList();
        return body("success", true, "users", result);
    }

    @PostMapping("/admin/users")
    @Transactional
    public Map<String, Object> addUser(@RequestHeader(value = "Authorization", required = false) String authorization,
                                       @RequestBody Map<String, Object> input) {
        requireAdmin(auth.require(authorization));
        int type = integer(input.get("type"), 2);
        if (type < 0 || type > 2) throw new ApiException(HttpStatus.BAD_REQUEST, "用户类型无效");
        Map<String, Object> result = auth.register(input);
        String uid = string(input.getOrDefault("uid", input.get("username"))).trim();
        UserAccount created = users.findById(uid).orElseThrow();
        created.setType(type);
        users.saveAndFlush(created);
        if (type == 0) { adminAvatars.applyDefaultIfNeeded(uid); adminFriends.linkNewAdministrator(uid); }
        return body("success", true, "message", "用户已创建");
    }

    @PutMapping("/admin/users/{uid}")
    @Transactional
    public Map<String, Object> updateUser(@RequestHeader(value = "Authorization", required = false) String authorization,
                                          @PathVariable String uid,
                                          @RequestBody Map<String, Object> input) {
        requireAdmin(auth.require(authorization));
        adminFriends.lockAndMigrate();
        UserAccount user = users.findById(uid).orElseThrow(() -> notFound("用户不存在"));
        boolean wasAdmin = user.getType() == 0;
        String password = string(input.get("password"));
        if (!password.isBlank()) {
            if (password.length() < 8 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) throw new ApiException(HttpStatus.BAD_REQUEST, "密码需至少 8 位且不超过 72 字节");
            user.setPasswordHash(passwordEncoder.encode(password));
        }
        if (input.containsKey("type")) {
            int type = integer(input.get("type"), -1);
            if (type < 0 || type > 2) throw new ApiException(HttpStatus.BAD_REQUEST, "用户类型无效");
            user.setType(type);
        }
        users.saveAndFlush(user);
        if (!wasAdmin && user.getType() == 0) { adminAvatars.applyDefaultIfNeeded(uid); adminFriends.linkNewAdministrator(uid); }
        return body("success", true, "message", "用户信息已更新");
    }

    @DeleteMapping("/admin/users/{uid}")
    @Transactional
    public Map<String, Object> deleteUser(@RequestHeader(value = "Authorization", required = false) String authorization,
                                          @PathVariable String uid) {
        requireAdmin(auth.require(authorization));
        if (!users.existsById(uid)) throw notFound("用户不存在");
        adminFriends.removeUserLinks(uid);
        profiles.deleteById(uid);
        users.deleteById(uid);
        return body("success", true, "message", "用户已删除");
    }

    @GetMapping("/user/{uid}")
    public Map<String, Object> getUser(@RequestHeader(value = "Authorization", required = false) String authorization,
                                       @PathVariable String uid) {
        auth.require(authorization);
        UserAccount account = users.findById(uid).orElseThrow(() -> notFound("用户不存在"));
        return body("success", true, "user", userWithProfile(account));
    }

    @PostMapping("/user/{uid}")
    @Transactional
    public Map<String, Object> createProfile(@RequestHeader(value = "Authorization", required = false) String authorization,
                                             @PathVariable String uid,
                                             @RequestBody(required = false) Map<String, Object> input) {
        UserAccount current = auth.require(authorization);
        if (!current.getUid().equals(uid)) throw forbidden();
        if (!users.existsById(uid)) throw notFound("用户不存在");
        Map<String, Object> data = input == null ? Map.of() : input;
        UserProfile profile = profiles.findById(uid).orElseGet(() -> new UserProfile(uid, uid, AdminAvatarService.defaultFor(current)));
        if (data.containsKey("name")) profile.setName(string(data.get("name")));
        if (data.containsKey("avatar")) profile.setAvatar(string(data.get("avatar")));
        profiles.save(profile);
        return body("success", true, "message", "用户资料已保存", "user", profileMap(current, profile));
    }

    @PutMapping("/user/{uid}")
    @Transactional
    public Map<String, Object> updateProfile(@RequestHeader(value = "Authorization", required = false) String authorization,
                                             @PathVariable String uid,
                                             @RequestBody Map<String, Object> input) {
        UserAccount current = auth.require(authorization);
        if (!current.getUid().equals(uid)) throw forbidden();
        UserProfile profile = profiles.findById(uid).orElseGet(() -> new UserProfile(uid, uid, AdminAvatarService.defaultFor(current)));
        if (input.containsKey("name")) profile.setName(string(input.get("name")));
        if (input.containsKey("avatar")) profile.setAvatar(string(input.get("avatar")));
        profiles.save(profile);
        return body("success", true, "message", "用户资料已更新", "user", profileMap(current, profile));
    }

    @GetMapping("/consultation/search/users")
    public Map<String, Object> searchUsers(@RequestHeader(value = "Authorization", required = false) String authorization,
                                           @RequestParam(defaultValue = "") String keyword) {
        UserAccount current = auth.require(authorization);
        String query = keyword.trim().toLowerCase(Locale.ROOT);
        List<Map<String, Object>> result = users.findAll().stream()
                .filter(user -> !user.getUid().equals(current.getUid()))
                .filter(user -> query.isBlank() || user.getUid().toLowerCase(Locale.ROOT).contains(query)
                        || profiles.findById(user.getUid()).map(p -> p.getName().toLowerCase(Locale.ROOT).contains(query)).orElse(false))
                .map(this::userWithProfile).toList();
        return body("success", true, "users", result);
    }

    @RequestMapping(path = {"/upload/avatar", "/upload/groupavatar", "/upload/postimage", "/upload/post-file",
            "/upload/message-image", "/upload/message-file", "/upload/surveyimage"}, method = RequestMethod.POST)
    public Map<String, Object> upload(@RequestHeader(value = "Authorization", required = false) String authorization,
                                      @RequestParam("file") MultipartFile file,
                                      jakarta.servlet.http.HttpServletRequest request) {
        UserAccount current = auth.require(authorization);
        if (file.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "请选择要上传的文件");
        String route = request.getRequestURI();
        String category = route.endsWith("/avatar") || route.endsWith("/groupavatar") ? "avatars"
                : route.endsWith("postimage") ? "postimages"
                : route.endsWith("message-image") ? "messageimages"
                : route.endsWith("message-file") || route.endsWith("post-file") ? "files" : "surveyimages";
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = extension(original);
        boolean imageRoute = category.equals("avatars") || category.equals("postimages")
                || category.equals("messageimages") || category.equals("surveyimages");
        List<String> allowed = imageRoute ? List.of("png", "jpg", "jpeg", "gif", "webp")
                : List.of("png", "jpg", "jpeg", "gif", "webp", "pdf", "txt", "doc", "docx", "xls", "xlsx", "zip");
        if (!allowed.contains(extension)) throw new ApiException(HttpStatus.BAD_REQUEST, "不支持此文件类型");
        String filename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        try {
            Path directory = uploadRoot.resolve(category).normalize();
            Files.createDirectories(directory);
            Path destination = directory.resolve(filename).normalize();
            if (!destination.startsWith(directory)) throw new ApiException(HttpStatus.BAD_REQUEST, "文件名无效");
            file.transferTo(destination);
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "文件保存失败");
        }
        String path = "/uploads/" + category + "/" + filename;
        if (route.endsWith("/avatar")) {
            UserProfile profile = profiles.findById(current.getUid()).orElseGet(() -> new UserProfile(current.getUid(), current.getUid(), path));
            profile.setAvatar(path);
            profiles.save(profile);
        }
        return body("success", true, "message", "上传成功", "url", path);
    }

    @PostMapping("/posts")
    public Map<String, Object> createPost(@RequestHeader(value = "Authorization", required = false) String authorization,
                                          @RequestBody Map<String, Object> input) {
        UserAccount current = auth.require(authorization);
        String text = string(input.get("text_content")).trim();
        List<String> imageUrls = stringList(input.get("image_urls"));
        List<String> fileUrls = stringList(input.get("file_urls"));
        if (text.isBlank() && imageUrls.isEmpty() && fileUrls.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "动态内容不能为空");
        CommunityPost post = new CommunityPost(current.getUid(), text, encode(imageUrls), bool(input.get("is_public"), true));
        post.setFileUrls(encode(fileUrls));
        post = posts.save(post);
        emotion.submit(current.getUid(),"post",post.getPid(),text);
        return body("success", true, "message", "动态已发布", "post_id", post.getPid());
    }

    @GetMapping("/posts")
    public Map<String, Object> listPosts(@RequestHeader(value = "Authorization", required = false) String authorization,
                                         @RequestParam(defaultValue = "time") String order_by,
                                         @RequestParam(defaultValue = "20") int limit,
                                         @RequestParam(defaultValue = "0") int offset,
                                         @RequestParam(defaultValue = "true") boolean is_public_only) {
        UserAccount current = auth.require(authorization);
        List<CommunityPost> found = new ArrayList<>(posts.findAllByPublicPostTrueOrderByCreatedTimeDesc());
        if (!is_public_only) {
            found = new ArrayList<>(posts.findAll().stream()
                    .filter(post -> post.isPublicPost() || post.getUid().equals(current.getUid()) || current.getType() == 0)
                    .toList());
            found.sort(Comparator.comparing(CommunityPost::getCreatedTime, Comparator.reverseOrder()));
        }
        if ("likes".equalsIgnoreCase(order_by)) found.sort(Comparator.comparingLong(CommunityPost::getLikes).reversed()
                .thenComparing(CommunityPost::getCreatedTime, Comparator.reverseOrder()));
        List<CommunityPost> page = slice(found, limit, offset);
        return body("success", true, "posts", page.stream().map(post -> postMap(post, current)).toList(), "has_more", (long) offset + page.size() < found.size());
    }

    @GetMapping("/posts/search")
    public Map<String, Object> searchPosts(@RequestHeader(value = "Authorization", required = false) String authorization,
                                           @RequestParam String keyword,
                                           @RequestParam(defaultValue = "time") String order_by,
                                           @RequestParam(defaultValue = "20") int limit,
                                           @RequestParam(defaultValue = "0") int offset) {
        UserAccount current = auth.require(authorization);
        if (keyword.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "请输入搜索关键词");
        List<CommunityPost> found = new ArrayList<>(posts.findAllByPublicPostTrueAndTextContentContainingIgnoreCaseOrderByCreatedTimeDesc(keyword.trim()));
        if ("likes".equalsIgnoreCase(order_by)) found.sort(Comparator.comparingLong(CommunityPost::getLikes).reversed());
        List<CommunityPost> page = slice(found, limit, offset);
        return body("success", true, "posts", page.stream().map(post -> postMap(post, current)).toList(),
                "total", found.size(), "has_more", (long) offset + page.size() < found.size());
    }

    @GetMapping("/posts/user/{uid}")
    public Map<String, Object> userPosts(@RequestHeader(value = "Authorization", required = false) String authorization,
                                         @PathVariable String uid,
                                         @RequestParam(defaultValue = "time") String order_by,
                                         @RequestParam(defaultValue = "20") int limit,
                                         @RequestParam(defaultValue = "0") int offset) {
        UserAccount current = auth.require(authorization);
        List<CommunityPost> found = new ArrayList<>(posts.findAllByUidOrderByCreatedTimeDesc(uid).stream()
                .filter(post -> post.isPublicPost() || current.getUid().equals(uid) || current.getType() == 0).toList());
        if ("likes".equalsIgnoreCase(order_by)) found.sort(Comparator.comparingLong(CommunityPost::getLikes).reversed());
        List<CommunityPost> page = slice(found, limit, offset);
        return body("success", true, "posts", page.stream().map(post -> postMap(post, current)).toList(), "has_more", (long) offset + page.size() < found.size());
    }

    @GetMapping("/posts/{pid}")
    public Map<String, Object> getPost(@RequestHeader(value = "Authorization", required = false) String authorization,
                                       @PathVariable Long pid) {
        UserAccount current = auth.require(authorization);
        CommunityPost post = posts.findById(pid).orElseThrow(() -> notFound("动态不存在"));
        ensurePostVisible(post, current);
        return body("success", true, "post", postMap(post, current));
    }

    @DeleteMapping("/posts/{pid}")
    @Transactional
    public Map<String, Object> deletePost(@RequestHeader(value = "Authorization", required = false) String authorization,
                                          @PathVariable Long pid) {
        UserAccount current = auth.require(authorization);
        CommunityPost post = posts.findById(pid).orElseThrow(() -> notFound("动态不存在"));
        if (!post.getUid().equals(current.getUid()) && current.getType() != 0) throw forbidden();
        comments.deleteAll(comments.findAllByPidOrderByCreatedTimeAsc(pid));
        likes.deleteAll(likes.findAll().stream().filter(like -> like.getPid().equals(pid)).toList());
        posts.delete(post);
        return body("success", true, "message", "动态已删除");
    }

    @PostMapping("/posts/{pid}/like")
    @Transactional
    public Map<String, Object> toggleLike(@RequestHeader(value = "Authorization", required = false) String authorization,
                                          @PathVariable Long pid) {
        UserAccount current = auth.require(authorization);
        CommunityPost post = posts.findById(pid).orElseThrow(() -> notFound("动态不存在"));
        ensurePostVisible(post, current);
        boolean isLiked;
        var existing = likes.findByPidAndUid(pid, current.getUid());
        if (existing.isPresent()) {
            likes.delete(existing.get());
            isLiked = false;
        } else {
            likes.save(new PostLike(pid, current.getUid()));
            isLiked = true;
        }
        post.setLikes(likes.countByPid(pid));
        posts.save(post);
        return body("success", true, "is_liked", isLiked, "likes_count", post.getLikes());
    }

    @PutMapping("/posts/{pid}/privacy")
    @Transactional
    public Map<String, Object> updatePrivacy(@RequestHeader(value = "Authorization", required = false) String authorization,
                                             @PathVariable Long pid, @RequestBody Map<String, Object> input) {
        UserAccount current = auth.require(authorization);
        CommunityPost post = posts.findById(pid).orElseThrow(() -> notFound("动态不存在"));
        if (!post.getUid().equals(current.getUid()) && current.getType() != 0) throw forbidden();
        post.setPublicPost(bool(input.get("is_public"), true));
        posts.save(post);
        return body("success", true, "message", "可见范围已更新");
    }

    @GetMapping("/posts/{pid}/comments")
    public Map<String, Object> listComments(@RequestHeader(value = "Authorization", required = false) String authorization,
                                            @PathVariable Long pid) {
        UserAccount current = auth.require(authorization);
        CommunityPost post = posts.findById(pid).orElseThrow(() -> notFound("动态不存在"));
        ensurePostVisible(post, current);
        List<Map<String, Object>> result = comments.findAllByPidOrderByCreatedTimeAsc(pid).stream().map(this::commentMap).toList();
        return body("success", true, "comments", result);
    }

    @PostMapping("/posts/{pid}/comments")
    @Transactional
    public Map<String, Object> createComment(@RequestHeader(value = "Authorization", required = false) String authorization,
                                             @PathVariable Long pid, @RequestBody Map<String, Object> input) {
        UserAccount current = auth.require(authorization);
        CommunityPost post = posts.findById(pid).orElseThrow(() -> notFound("动态不存在"));
        ensurePostVisible(post, current);
        String text = string(input.get("text_content")).trim();
        List<String> images = stringList(input.get("image_urls"));
        if (text.isBlank() && images.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "评论内容不能为空");
        PostComment comment = comments.save(new PostComment(pid, current.getUid(), text, encode(images)));
        post.setComments(comments.countByPid(pid));
        posts.save(post);
        return body("success", true, "message", "评论已发布", "comment", commentMap(comment));
    }

    @DeleteMapping("/comments/{cid}")
    @Transactional
    public Map<String, Object> deleteComment(@RequestHeader(value = "Authorization", required = false) String authorization,
                                             @PathVariable Long cid) {
        UserAccount current = auth.require(authorization);
        PostComment comment = comments.findById(cid).orElseThrow(() -> notFound("评论不存在"));
        if (!comment.getUid().equals(current.getUid()) && current.getType() != 0) throw forbidden();
        Long pid = comment.getPid();
        comments.delete(comment);
        posts.findById(pid).ifPresent(post -> { post.setComments(comments.countByPid(pid)); posts.save(post); });
        return body("success", true, "message", "评论已删除");
    }

    @GetMapping("/posts/stats/all")
    public Map<String, Object> postStats(@RequestHeader(value = "Authorization", required = false) String authorization) {
        requireAdmin(auth.require(authorization));
        List<CommunityPost> all = posts.findAll();
        long totalLikes = all.stream().mapToLong(CommunityPost::getLikes).sum();
        long totalComments = all.stream().mapToLong(CommunityPost::getComments).sum();
        return body("success", true, "total_posts", all.size(), "total_likes", totalLikes,
                "total_comments", totalComments, "totalPosts", all.size(), "totalLikes", totalLikes, "totalComments", totalComments);
    }

    @PostMapping("/user/{uid}/addPost")
    public Map<String, Object> legacyPostLink(@RequestHeader(value = "Authorization", required = false) String authorization,
                                              @PathVariable String uid, @RequestBody Map<String, Object> input) {
        UserAccount current = auth.require(authorization);
        if (!current.getUid().equals(uid)) throw forbidden();
        Long pid = longValue(input.get("postId"));
        CommunityPost post = posts.findById(pid).orElseThrow(() -> notFound("动态不存在"));
        if (!post.getUid().equals(uid)) throw forbidden();
        return body("success", true, "message", "动态已关联");
    }

    private Map<String, Object> postMap(CommunityPost post, UserAccount current) {
        UserProfile profile = profiles.findById(post.getUid()).orElse(new UserProfile(post.getUid(), post.getUid(), "/static/avatar.png"));
        Map<String, Object> item = body("pid", post.getPid(), "uid", post.getUid(), "text_content", post.getTextContent(),
                "image_urls", stringList(post.getImageUrls()), "file_urls", stringList(post.getFileUrls()), "created_time", post.getCreatedTime().toString(),
                "likes", likes.countByPid(post.getPid()), "comments", comments.countByPid(post.getPid()),
                "is_public", post.isPublicPost(), "username", profile.getName(), "avatar", profile.getAvatar(),
                "is_liked", likes.findByPidAndUid(post.getPid(), current.getUid()).isPresent());
        return item;
    }

    private Map<String, Object> commentMap(PostComment comment) {
        UserProfile profile = profiles.findById(comment.getUid()).orElse(new UserProfile(comment.getUid(), comment.getUid(), "/static/avatar.png"));
        return body("cid", comment.getCid(), "pid", comment.getPid(), "uid", comment.getUid(),
                "username", profile.getName(), "avatar", profile.getAvatar(), "text_content", comment.getTextContent(),
                "image_urls", stringList(comment.getImageUrls()), "created_time", comment.getCreatedTime().toString());
    }

    private Map<String, Object> userWithProfile(UserAccount user) {
        UserProfile profile = profiles.findById(user.getUid()).orElse(new UserProfile(user.getUid(), user.getUid(), AdminAvatarService.defaultFor(user)));
        return body("uid", user.getUid(), "type", user.getType(), "name", profile.getName(), "avatar", AdminAvatarService.avatarOrDefault(user,profile.getAvatar()));
    }

    private Map<String, Object> profileMap(UserAccount account, UserProfile profile) {
        return body("uid", account.getUid(), "type", account.getType(), "name", profile.getName(), "avatar", AdminAvatarService.avatarOrDefault(account,profile.getAvatar()));
    }

    private List<String> stringList(Object value) {
        if (value == null) return List.of();
        if (value instanceof List<?> values) return values.stream().map(CommunityController::string).filter(s -> !s.isBlank()).toList();
        String serialized = string(value).trim();
        if (serialized.isBlank()) return List.of();
        try { return mapper.readValue(serialized, new TypeReference<>() {}); }
        catch (Exception ignored) { return List.of(serialized.split(",")); }
    }

    private String encode(List<String> values) {
        try { return mapper.writeValueAsString(values); }
        catch (Exception ex) { throw new IllegalStateException("无法保存图片列表", ex); }
    }

    private static List<CommunityPost> slice(List<CommunityPost> list, int limit, int offset) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        int safeOffset = Math.max(0, offset);
        if (safeOffset >= list.size()) return List.of();
        return list.subList(safeOffset, Math.min(list.size(), safeOffset + safeLimit));
    }

    private static String extension(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static void requireAdmin(UserAccount user) {
        if (user.getType() != 0) throw new ApiException(HttpStatus.FORBIDDEN, "需要管理员权限");
    }

    private static void ensurePostVisible(CommunityPost post, UserAccount user) {
        if (!post.isPublicPost() && !post.getUid().equals(user.getUid()) && user.getType() != 0) throw forbidden();
    }

    private static ApiException forbidden() { return new ApiException(HttpStatus.FORBIDDEN, "没有权限执行此操作"); }
    private static ApiException notFound(String message) { return new ApiException(HttpStatus.NOT_FOUND, message); }
    private static String string(Object value) { return value == null ? "" : String.valueOf(value); }
    private static int integer(Object value, int fallback) {
        try { return Integer.parseInt(string(value)); } catch (NumberFormatException ignored) { return fallback; }
    }
    private static long longValue(Object value) {
        try { return Long.parseLong(string(value)); } catch (NumberFormatException ignored) { throw new ApiException(HttpStatus.BAD_REQUEST, "动态编号格式不正确"); }
    }
    private static boolean bool(Object value, boolean fallback) {
        if (value instanceof Boolean flag) return flag;
        return value == null ? fallback : Boolean.parseBoolean(string(value));
    }
    private static Map<String, Object> body(Object... pairs) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pairs.length; i += 2) result.put(string(pairs[i]), pairs[i + 1]);
        return result;
    }

}
