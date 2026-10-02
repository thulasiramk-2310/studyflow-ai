package com.studyflow.auth.security;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/** A login token is revoked when it was issued before the user's last password change. */
public final class TokenRevocation {

    private TokenRevocation() {}

    public static boolean isRevoked(Date issuedAt, LocalDateTime passwordChangedAt) {
        if (passwordChangedAt == null || issuedAt == null) return false;
        // JWT iat has second precision, so compare at seconds: a token minted in the same
        // second as the change (the one re-issued to the device that changed it) stays valid.
        LocalDateTime issued = LocalDateTime.ofInstant(issuedAt.toInstant(), ZoneId.systemDefault());
        return issued.isBefore(passwordChangedAt.truncatedTo(ChronoUnit.SECONDS));
    }
}
