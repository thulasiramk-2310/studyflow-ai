package com.studyflow.auth.service;

public interface ResetMailer {
    /** Sends the password reset link. Must never throw: failures are logged, not shown to the requester. */
    void sendResetLink(String to, String name, String link);
}
