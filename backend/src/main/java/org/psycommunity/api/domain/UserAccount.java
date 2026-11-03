package org.psycommunity.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "users")
public class UserAccount {
    @Id
    @Column(length = 50, nullable = false)
    private String uid;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "user_type", nullable = false)
    private int type = 2;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected UserAccount() {}

    public UserAccount(String uid, String passwordHash, int type) {
        this.uid = uid;
        this.passwordHash = passwordHash;
        this.type = type;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public String getUid() { return uid; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public int getType() { return type; }
    public void setType(int type) { this.type = type; }
    public Instant getCreatedAt() { return createdAt; }
}
