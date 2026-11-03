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
@Table(name = "posts")
public class CommunityPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pid;

    @Column(nullable = false, length = 50)
    private String uid;

    @Column(name = "text_content", nullable = false, length = 4000)
    private String textContent = "";

    @Column(name = "image_urls", length = 8000)
    private String imageUrls = "[]";

    @Column(name = "file_urls", length = 8000)
    private String fileUrls = "[]";

    @Column(name = "created_time", nullable = false)
    private Instant createdTime;

    @Column(nullable = false)
    private long likes = 0;

    @Column(nullable = false)
    private long comments = 0;

    @Column(name = "is_public", nullable = false)
    private boolean publicPost = true;

    protected CommunityPost() {}

    public CommunityPost(String uid, String textContent, String imageUrls, boolean publicPost) {
        this.uid = uid;
        this.textContent = textContent;
        this.imageUrls = imageUrls;
        this.publicPost = publicPost;
    }

    @PrePersist
    void onCreate() {
        if (createdTime == null) createdTime = Instant.now();
    }

    public Long getPid() { return pid; }
    public String getUid() { return uid; }
    public String getTextContent() { return textContent; }
    public String getImageUrls() { return imageUrls; }
    public String getFileUrls() { return fileUrls; }
    public void setFileUrls(String fileUrls) { this.fileUrls = fileUrls; }
    public Instant getCreatedTime() { return createdTime; }
    public long getLikes() { return likes; }
    public void setLikes(long likes) { this.likes = likes; }
    public long getComments() { return comments; }
    public void setComments(long comments) { this.comments = comments; }
    public boolean isPublicPost() { return publicPost; }
    public void setPublicPost(boolean publicPost) { this.publicPost = publicPost; }
}
