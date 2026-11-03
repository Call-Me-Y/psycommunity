package org.psycommunity.api.repository;

import org.psycommunity.api.domain.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByPidAndUid(Long pid, String uid);
    long countByPid(Long pid);
}
