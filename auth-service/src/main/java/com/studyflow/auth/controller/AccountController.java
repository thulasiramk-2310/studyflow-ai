package com.studyflow.auth.controller;

import com.studyflow.auth.client.StudyServiceClient;
import com.studyflow.auth.dto.*;
import com.studyflow.auth.entity.PasswordResetToken;
import com.studyflow.auth.entity.User;
import com.studyflow.auth.repository.PasswordResetTokenRepository;
import com.studyflow.auth.repository.UserRepository;
import com.studyflow.auth.security.JwtTokenProvider;
import com.studyflow.auth.service.ResetMailer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

/** Account self-service: change password, delete account, forgot/reset password. */
@RestController
@RequestMapping("/auth")
public class AccountController {

    static final int MIN_PASSWORD_LENGTH = 8;
    static final int RESET_TOKEN_MINUTES = 30;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final StudyServiceClient study;
    private final ResetMailer mailer;
    private final JwtTokenProvider tokenProvider;
    private final String appBaseUrl;

    public AccountController(UserRepository users, PasswordResetTokenRepository tokens, PasswordEncoder encoder,
                             StudyServiceClient study, ResetMailer mailer, JwtTokenProvider tokenProvider,
                             @Value("${app.base-url}") String appBaseUrl) {
        this.users = users;
        this.tokens = tokens;
        this.encoder = encoder;
        this.study = study;
        this.mailer = mailer;
        this.tokenProvider = tokenProvider;
        this.appBaseUrl = appBaseUrl.replaceAll("/+$", "");
    }

    @PostMapping("/me/password")
    public ResponseEntity<ApiResponse<String>> changePassword(Authentication authentication, @RequestBody ChangePasswordRequest body) {
        User user = currentUser(authentication);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Not authenticated");
        if (body == null || body.getCurrentPassword() == null || !encoder.matches(body.getCurrentPassword(), user.getPassword())) {
            return error(HttpStatus.BAD_REQUEST, "INVALID_PASSWORD", "Current password is incorrect");
        }
        if (!strongEnough(body.getNewPassword())) {
            return error(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD", "New password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        user.setPassword(encoder.encode(body.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now()); // signs out every other device
        users.save(user);
        // Keep this device signed in with a token issued after the change.
        String jwt = tokenProvider.generateToken(new UsernamePasswordAuthenticationToken(user.getEmail(), null, null), user);
        ResponseCookie cookie = ResponseCookie.from("jwt", jwt).httpOnly(true).secure(true).sameSite("Lax").path("/")
                .maxAge(JwtTokenProvider.JWT_EXPIRATION_SECONDS).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(ApiResponse.success("Password updated"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<String>> deleteAccount(Authentication authentication, @RequestBody DeleteAccountRequest body) {
        User user = currentUser(authentication);
        if (user == null) return error(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Not authenticated");
        if (body == null || body.getPassword() == null || !encoder.matches(body.getPassword(), user.getPassword())) {
            return error(HttpStatus.BAD_REQUEST, "INVALID_PASSWORD", "Password is incorrect");
        }
        // Study data first: if the user still owns shared groups, nothing is deleted.
        StudyServiceClient.Result cleanup = study.removeUser(user.getId());
        switch (cleanup.status()) {
            case BLOCKED:
                return error(HttpStatus.CONFLICT, "OWNS_SHARED_GROUPS", cleanup.message());
            case UNAVAILABLE:
                return error(HttpStatus.SERVICE_UNAVAILABLE, "TRY_AGAIN", "Couldn't delete your account right now. Try again in a minute.");
            default:
                break;
        }
        tokens.deleteByUserId(user.getId());
        users.delete(user);
        ResponseCookie clear = ResponseCookie.from("jwt", "").httpOnly(true).secure(true).sameSite("Lax").path("/").maxAge(0).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, clear.toString()).body(ApiResponse.success("Account deleted"));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody ForgotPasswordRequest body) {
        String email = body == null || body.getEmail() == null ? "" : body.getEmail().trim().toLowerCase();
        // Same answer whether or not the account exists, so emails can't be probed.
        users.findByEmail(email).ifPresent(user -> {
            byte[] bytes = new byte[32];
            RANDOM.nextBytes(bytes);
            String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            tokens.save(new PasswordResetToken(user.getId(), sha256(raw), LocalDateTime.now().plusMinutes(RESET_TOKEN_MINUTES)));
            mailer.sendResetLink(user.getEmail(), user.getName(), appBaseUrl + "/reset-password?token=" + raw);
        });
        return ResponseEntity.ok(ApiResponse.success("If that email has an account, a reset link is on its way."));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody ResetPasswordRequest body) {
        if (body == null || body.getToken() == null) {
            return error(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN", "This reset link is invalid or has expired");
        }
        if (!strongEnough(body.getNewPassword())) {
            return error(HttpStatus.BAD_REQUEST, "WEAK_PASSWORD", "New password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        String hash = sha256(body.getToken());
        PasswordResetToken token = tokens.findByTokenHash(hash).orElse(null);
        User user = token == null ? null : users.findById(token.getUserId()).orElse(null);
        // consume() is one conditional UPDATE: of two simultaneous requests, only one gets 1.
        if (user == null || tokens.consume(hash, LocalDateTime.now()) != 1) {
            return error(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN", "This reset link is invalid or has expired");
        }
        user.setPassword(encoder.encode(body.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now()); // signs out every existing login
        users.save(user);
        return ResponseEntity.ok(ApiResponse.success("Password reset. You can log in now."));
    }

    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static boolean strongEnough(String password) {
        return password != null && password.length() >= MIN_PASSWORD_LENGTH;
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        return users.findByEmail(authentication.getName()).orElse(null);
    }

    private static ResponseEntity<ApiResponse<String>> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(ApiResponse.error(code, message));
    }
}
