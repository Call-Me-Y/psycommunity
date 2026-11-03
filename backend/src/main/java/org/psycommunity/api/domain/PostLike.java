package org.psycommunity.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "post_likes", uniqueConstraints = @UniqueConstraint(columnNames = {"pid", "uid"}))
public class PostLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long pid;

    @Column(nullable = false, length = 50)
    private String uid;

    protected PostLike() {}
    public PostLike(Long pid, String uid) { this.pid = pid; this.uid = uid; }
    public Long getId() { return id; }
    public Long getPid() { return pid; }
    public String getUid() { return uid; }
}
