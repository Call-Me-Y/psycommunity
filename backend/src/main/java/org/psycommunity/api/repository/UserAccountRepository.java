package org.psycommunity.api.repository;

import org.psycommunity.api.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {
    List<UserAccount> findByTypeOrderByUidAsc(int type);
}
