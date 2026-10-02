package com.studyflow.auth.entity;

import java.util.Optional;

public enum AccountType {
    STUDENT, PROFESSIONAL;

    /** Empty for unknown values; callers decide whether that is an error. */
    public static Optional<AccountType> parse(String value) {
        if (value == null) return Optional.empty();
        try {
            return Optional.of(AccountType.valueOf(value.trim().toUpperCase()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
