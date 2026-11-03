package org.psycommunity.api.repository;

import org.psycommunity.api.domain.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    List<CommunityPost> findAllByPublicPostTrueOrderByCreatedTimeDesc();
    List<CommunityPost> findAllByUidOrderByCreatedTimeDesc(String uid);
    List<CommunityPost> findAllByPublicPostTrueAndTextContentContainingIgnoreCaseOrderByCreatedTimeDesc(String text);
    List<CommunityPost> findAllByUidAndTextContentContainingIgnoreCaseOrderByCreatedTimeDesc(String uid, String text);
}
