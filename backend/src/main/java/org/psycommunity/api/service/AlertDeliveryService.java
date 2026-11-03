package org.psycommunity.api.service;

import org.psycommunity.api.domain.UserAccount;
import org.psycommunity.api.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;

/** Delivers automatic alerts through ordinary private messages without impersonating a person. */
@Service
public class AlertDeliveryService {
    private static final Logger log=LoggerFactory.getLogger(AlertDeliveryService.class);
    private final JdbcTemplate db;
    private final UserAccountRepository users;
    private final TransactionTemplate transactions;

    public AlertDeliveryService(JdbcTemplate db, UserAccountRepository users, TransactionTemplate transactions) {
        this.db=db; this.users=users; this.transactions=transactions;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() { deliverPending(); }

    @Scheduled(fixedDelayString="${ALERT_DELIVERY_INTERVAL_MS:2000}")
    public void deliverPending() {
        try {
            List<String> admins=users.findAll().stream().filter(u->u.getType()==0).map(UserAccount::getUid).sorted().toList();
            if(admins.isEmpty()) return; // Pending alerts remain for delivery when an administrator exists.
            String sender=admins.get(0);
            List<Long> pendingEvents=db.queryForList("SELECT id FROM psy_emotion_events WHERE admin_delivery_pending=TRUE ORDER BY id LIMIT 100",Long.class);
            for(Long eventId:pendingEvents) transactions.executeWithoutResult(status->addMissingAdminRecipients(eventId,admins));
            List<Long> ids=db.queryForList("SELECT n.id FROM psy_notifications n LEFT JOIN psy_messages m ON m.emotion_notification_id=n.id WHERE m.id IS NULL ORDER BY n.id LIMIT 100",Long.class);
            for(Long id:ids) transactions.executeWithoutResult(status->deliver(id,sender));
        } catch (Exception ex) {
            log.error("自动预警消息投递失败，稍后将重试",ex);
        }
    }

    private void addMissingAdminRecipients(long eventId,List<String> admins) {
        List<Map<String,Object>> rows=db.queryForList("SELECT id,uid,created_at FROM psy_emotion_events WHERE id=? AND admin_delivery_pending=TRUE FOR UPDATE",eventId);
        if(rows.isEmpty()) return;
        Map<String,Object> event=rows.get(0);
        String target=String.valueOf(event.get("uid"));
        for(String admin:admins) {
            if(!db.queryForList("SELECT id FROM psy_notifications WHERE recipient_uid=? AND event_id=?",admin,eventId).isEmpty()) continue;
            String message="用户 "+target+" 的文字出现需要关注的情绪表达，请结合实际情况核实。";
            db.update("INSERT INTO psy_notifications(recipient_uid,event_id,target_uid,message,is_read,created_at) VALUES (?,?,?,?,?,?)",admin,eventId,target,message,false,String.valueOf(event.get("created_at")));
        }
        db.update("UPDATE psy_emotion_events SET admin_delivery_pending=FALSE WHERE id=?",eventId);
    }

    private void deliver(long id,String sender) {
        List<Map<String,Object>> rows=db.queryForList("SELECT n.id,n.recipient_uid,n.target_uid,n.created_at,e.source_type,e.source_id FROM psy_notifications n JOIN psy_emotion_events e ON e.id=n.event_id WHERE n.id=? FOR UPDATE",id);
        if(rows.isEmpty() || !db.queryForList("SELECT id FROM psy_messages WHERE emotion_notification_id=?",id).isEmpty()) return;
        Map<String,Object> row=rows.get(0);
        String target=String.valueOf(row.get("target_uid")), source=String.valueOf(row.get("source_type"));
        String sourceName=switch(source) { case "agent" -> "AI 对话"; case "post" -> "动态"; case "chat" -> "聊天"; default -> "文字"; };
        String excerpt=excerpt(source,String.valueOf(row.get("source_id")),target);
        String content="【系统自动预警，非人工发送】\n关注账号："+target+"\n来源："+sourceName+"\n时间："+row.get("created_at")+"\n内容："+excerpt+"\n请结合实际情况核实；模型可能误判。";
        db.update("INSERT INTO psy_messages(sender_uid,receiver_uid,gid,content,msg_type,link,sent_time,emotion_notification_id) VALUES (?,?,?,?,?,?,?,?)",
                sender,String.valueOf(row.get("recipient_uid")),null,content,0,"",String.valueOf(row.get("created_at")),id);
    }

    private String excerpt(String source,String sourceId,String uid) {
        try {
            long id=Long.parseLong(sourceId);
            String sql=switch(source) {
                case "agent" -> "SELECT content FROM psy_agent_messages WHERE id=? AND uid=?";
                case "chat" -> "SELECT content FROM psy_messages WHERE id=? AND sender_uid=?";
                case "post" -> "SELECT text_content FROM posts WHERE pid=? AND uid=?";
                default -> null;
            };
            if(sql==null) return "原文不可用";
            List<String> values=db.queryForList(sql,String.class,id,uid);
            if(values.isEmpty() || values.get(0)==null || values.get(0).isBlank()) return "原文已删除或不可用";
            int[] text=values.get(0).codePoints().toArray();
            return new String(text,0,Math.min(text.length,180))+(text.length>180?"…":"");
        } catch (NumberFormatException ex) { return "原文不可用"; }
    }
}
