package org.psycommunity.api.repository;

import org.psycommunity.api.domain.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    List<PostComment> findAllByPidOrderByCreatedTimeAsc(Long pid);
    Optional<PostComment> findByCidAndUid(Long cid, String uid);
    long countByPid(Long pid);
}
