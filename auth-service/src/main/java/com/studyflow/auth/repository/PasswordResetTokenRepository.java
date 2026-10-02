package com.studyflow.auth.repository;

import com.studyflow.auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Transactional
    void deleteByUserId(Long userId);

    /**
     * Marks the token used only if it is still unused and unexpired, in one statement.
     * Returns 1 for the single request that wins; concurrent requests get 0.
     */
    @Modifying
    @Transactional
    @Query("update PasswordResetToken t set t.usedAt = :now where t.tokenHash = :hash and t.usedAt is null and t.expiresAt > :now")
    int consume(@Param("hash") String hash, @Param("now") LocalDateTime now);
}
