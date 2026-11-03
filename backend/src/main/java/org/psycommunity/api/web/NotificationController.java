package org.psycommunity.api.web;

import org.psycommunity.api.service.ApiException;
import org.psycommunity.api.service.AuthService;
import org.psycommunity.api.service.EmotionService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class NotificationController {
    private final JdbcTemplate db;
    private final AuthService auth;
    private final EmotionService emotion;
    public NotificationController(JdbcTemplate db,AuthService auth,EmotionService emotion) { this.db=db; this.auth=auth; this.emotion=emotion; }

    @GetMapping("/emotion/status")
    public Map<String,Object> status(@RequestHeader(value="Authorization",required=false) String token) {
        auth.require(token); return Map.of("success",true,"model",emotion.status());
    }

    @GetMapping("/notifications")
    public Map<String,Object> notifications(@RequestHeader(value="Authorization",required=false) String token) {
        var user=auth.require(token);
        return Map.of("success",true,"is_admin",user.getType()==0,"notifications",db.queryForList("SELECT n.id,n.message,n.is_read,n.created_at,n.target_uid,e.source_type FROM psy_notifications n JOIN psy_emotion_events e ON e.id=n.event_id WHERE n.recipient_uid=? ORDER BY n.id DESC LIMIT 100",user.getUid()));
    }

    @GetMapping("/emotion/events")
    public Map<String,Object> events(@RequestHeader(value="Authorization",required=false) String token) {
        String uid=auth.require(token).getUid();
        return Map.of("success",true,"events",db.queryForList("SELECT id,source_type,source_id,negative_score,attention,model_version,created_at FROM psy_emotion_events WHERE uid=? ORDER BY id DESC LIMIT 100",uid));
    }

    @PostMapping("/notifications/{id}/read")
    public Map<String,Object> read(@RequestHeader(value="Authorization",required=false) String token,@PathVariable long id) {
        if(db.update("UPDATE psy_notifications SET is_read=? WHERE id=? AND recipient_uid=?",true,id,auth.require(token).getUid())==0) throw new ApiException(HttpStatus.NOT_FOUND,"通知不存在");
        return Map.of("success",true);
    }
}
