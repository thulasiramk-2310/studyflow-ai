package com.studyflow.auth.security;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenRevocationTest {

    private static Date at(LocalDateTime t) {
        return Date.from(t.atZone(ZoneId.systemDefault()).toInstant());
    }

    @Test
    void a_token_issued_before_the_password_change_is_revoked() {
        LocalDateTime changed = LocalDateTime.of(2026, 10, 2, 12, 0, 30);
        assertTrue(TokenRevocation.isRevoked(at(changed.minusMinutes(5)), changed));
    }

    @Test
    void a_token_issued_in_the_same_second_or_later_is_valid() {
        LocalDateTime changed = LocalDateTime.of(2026, 10, 2, 12, 0, 30, 700_000_000);
        assertFalse(TokenRevocation.isRevoked(at(changed.withNano(0)), changed));
        assertFalse(TokenRevocation.isRevoked(at(changed.plusMinutes(1)), changed));
    }

    @Test
    void users_who_never_changed_their_password_are_unaffected() {
        assertFalse(TokenRevocation.isRevoked(at(LocalDateTime.now().minusDays(1)), null));
    }
}
