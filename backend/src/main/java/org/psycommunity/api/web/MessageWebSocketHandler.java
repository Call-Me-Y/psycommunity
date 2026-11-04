package org.psycommunity.api.web;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.psycommunity.api.domain.UserAccount;
import org.psycommunity.api.domain.UserProfile;
import org.psycommunity.api.repository.UserAccountRepository;
import org.psycommunity.api.repository.UserProfileRepository;
import org.psycommunity.api.service.AdminAvatarService;
import org.psycommunity.api.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Authenticated per-user message delivery over WebSocket. */
@Component
public class MessageWebSocketHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(MessageWebSocketHandler.class);
    private static final String USER_ATTRIBUTE = "psycommunity.uid";

    private final ObjectMapper mapper;
    private final AuthService auth;
    private final JdbcTemplate db;
    private final UserAccountRepository users;
    private final UserProfileRepository profiles;
    private final Map<String, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();

    public MessageWebSocketHandler(ObjectMapper mapper, AuthService auth, JdbcTemplate db,
                                   UserAccountRepository users, UserProfileRepository profiles) {
        this.mapper = mapper;
        this.auth = auth;
        this.db = db;
        this.users = users;
        this.profiles = profiles;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Map<String, Object> frame = mapper.readValue(message.getPayload(), new TypeReference<>() {});
        String type = text(frame.get("type"));
        String uid = text(session.getAttributes().get(USER_ATTRIBUTE));

        if ("auth".equals(type)) {
            if (!uid.isBlank()) {
                send(session, Map.of("type", "ready"));
                return;
            }
            authenticate(session, text(frame.get("token")));
            return;
        }
        if (uid.isBlank()) {
            closePolicy(session, "Authentication required");
            return;
        }
        if ("ping".equals(type)) {
            send(session, Map.of("type", "pong"));
        }
    }

    private void authenticate(WebSocketSession session, String token) throws Exception {
        try {
            UserAccount user = auth.require("Bearer " + token);
            session.getAttributes().put(USER_ATTRIBUTE, user.getUid());
            WebSocketSession safeSession = new ConcurrentWebSocketSessionDecorator(session, 10_000, 512 * 1024);
            sessionsByUser.computeIfAbsent(user.getUid(), ignored -> ConcurrentHashMap.newKeySet()).add(safeSession);
            send(safeSession, Map.of("type", "ready"));
        } catch (RuntimeException ex) {
            send(session, Map.of("type", "auth_error", "message", "登录状态无效，请重新登录"));
            closePolicy(session, "Invalid authentication");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        removeSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.debug("WebSocket transport closed: {}", exception.getMessage());
        removeSession(session);
        if (session.isOpen()) {
            try { session.close(CloseStatus.SERVER_ERROR); } catch (Exception ignored) {}
        }
    }

    /** Send only after an enclosing transaction commits, so clients never receive an uncommitted row. */
    public void publishAfterCommit(long messageId) {
        Runnable publish = () -> publishMessage(messageId);
        if (TransactionSynchronizationManager.isSynchronizationActive()
                && TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { publish.run(); }
            });
        } else {
            publish.run();
        }
    }

    private void publishMessage(long messageId) {
        try {
            List<Map<String, Object>> rows = db.queryForList("SELECT * FROM psy_messages WHERE id=?", messageId);
            if (rows.isEmpty()) return;
            Map<String, Object> row = rows.get(0);
            String senderUid = text(row.get("sender_uid"));
            Map<String, Object> sender = profile(senderUid);
            Object gid = row.get("gid");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id", row.get("id"));
            payload.put("sender_uid", senderUid);
            payload.put("receiver_uid", row.get("receiver_uid"));
            payload.put("gid", gid);
            payload.put("content", row.get("content"));
            payload.put("msg_type", row.get("msg_type"));
            payload.put("link", row.get("link"));
            payload.put("sent_time", row.get("sent_time"));
            payload.put("sender_name", sender.get("name"));
            payload.put("sender_avatar", sender.get("avatar"));
            payload.put("is_auto_alert", row.get("emotion_notification_id") != null);
            payload.put("emotion_notification_id", row.get("emotion_notification_id"));

            List<String> recipients = new ArrayList<>();
            if (gid != null) {
                long groupId = ((Number) gid).longValue();
                List<Map<String, Object>> groups = db.queryForList("SELECT name,avatar FROM psy_groups WHERE id=?", groupId);
                if (groups.isEmpty()) return;
                Map<String, Object> group = groups.get(0);
                payload.put("chat_type", "group");
                payload.put("contact_id", String.valueOf(groupId));
                payload.put("contact_name", group.get("name"));
                payload.put("contact_avatar", valueOr(group.get("avatar"), "/static/avatarg.png"));
                db.query("SELECT uid FROM psy_group_members WHERE gid=? AND uid<>?", rs -> {
                    while (rs.next()) recipients.add(rs.getString(1));
                }, groupId, senderUid);
            } else {
                String receiver = text(row.get("receiver_uid"));
                if (receiver.isBlank()) return;
                payload.put("chat_type", "private");
                payload.put("contact_id", senderUid);
                payload.put("contact_name", sender.get("name"));
                payload.put("contact_avatar", sender.get("avatar"));
                boolean isAdmin = users.findById(senderUid).map(user -> user.getType() == 0).orElse(false);
                payload.put("contact_is_admin", isAdmin);
                recipients.add(receiver);
            }

            Map<String, Object> frame = Map.of("type", "newMessage", "message", payload);
            for (String recipient : recipients) sendToUser(recipient, frame);
        } catch (Exception ex) {
            log.warn("Failed to publish chat message {} over WebSocket", messageId, ex);
        }
    }

    private Map<String, Object> profile(String uid) {
        UserAccount account = users.findById(uid).orElse(null);
        UserProfile profile = profiles.findById(uid).orElse(null);
        String name = profile == null || profile.getName() == null || profile.getName().isBlank()
                ? uid : profile.getName();
        String avatar = profile == null ? null : profile.getAvatar();
        if (account != null) avatar = AdminAvatarService.avatarOrDefault(account, avatar);
        if (avatar == null || avatar.isBlank()) avatar = AdminAvatarService.USER_AVATAR;
        return Map.of("name", name, "avatar", avatar);
    }

    private void sendToUser(String uid, Map<String, Object> frame) {
        Set<WebSocketSession> sessions = sessionsByUser.get(uid);
        if (sessions == null) return;
        for (WebSocketSession session : sessions) {
            try {
                if (session.isOpen()) send(session, frame);
                else removeSession(session);
            } catch (Exception ex) {
                removeSession(session);
                log.debug("Unable to send WebSocket message to user {}", uid, ex);
            }
        }
    }

    private void send(WebSocketSession session, Map<String, Object> frame) throws Exception {
        if (session.isOpen()) session.sendMessage(new TextMessage(mapper.writeValueAsString(frame)));
    }

    private void removeSession(WebSocketSession session) {
        String uid = text(session.getAttributes().get(USER_ATTRIBUTE));
        if (uid.isBlank()) return;
        Set<WebSocketSession> sessions = sessionsByUser.get(uid);
        if (sessions == null) return;
        sessions.removeIf(existing -> existing.getId().equals(session.getId()));
        if (sessions.isEmpty()) sessionsByUser.remove(uid, sessions);
    }

    private void closePolicy(WebSocketSession session, String reason) {
        if (!session.isOpen()) return;
        try { session.close(new CloseStatus(1008, reason)); } catch (Exception ignored) {}
    }

    private static String text(Object value) { return value == null ? "" : String.valueOf(value); }
    private static Object valueOr(Object value, Object fallback) {
        return value == null || value.toString().isBlank() ? fallback : value;
    }
}
