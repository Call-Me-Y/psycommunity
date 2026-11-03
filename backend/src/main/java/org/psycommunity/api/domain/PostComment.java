package org.psycommunity.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "post_comments")
public class PostComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cid;

    @Column(nullable = false)
    private Long pid;

    @Column(nullable = false, length = 50)
    private String uid;

    @Column(name = "text_content", nullable = false, length = 2000)
    private String textContent = "";

    @Column(name = "image_urls", length = 4000)
    private String imageUrls = "[]";

    @Column(name = "created_time", nullable = false)
    private Instant createdTime;

    protected PostComment() {}

    public PostComment(Long pid, String uid, String textContent, String imageUrls) {
        this.pid = pid;
        this.uid = uid;
        this.textContent = textContent;
        this.imageUrls = imageUrls;
    }

    @PrePersist
    void onCreate() { if (createdTime == null) createdTime = Instant.now(); }

    public Long getCid() { return cid; }
    public Long getPid() { return pid; }
    public String getUid() { return uid; }
    public String getTextContent() { return textContent; }
    public String getImageUrls() { return imageUrls; }
    public Instant getCreatedTime() { return createdTime; }
}
