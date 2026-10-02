package com.studyflow.auth.controller;

import com.studyflow.auth.client.StudyServiceClient;
import com.studyflow.auth.dto.*;
import com.studyflow.auth.entity.PasswordResetToken;
import com.studyflow.auth.entity.User;
import com.studyflow.auth.repository.PasswordResetTokenRepository;
import com.studyflow.auth.repository.UserRepository;
import com.studyflow.auth.security.JwtTokenProvider;
import com.studyflow.auth.service.ResetMailer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AccountControllerTest {

    private UserRepository users;
    private PasswordResetTokenRepository tokens;
    private StudyServiceClient study;
    private ResetMailer mailer;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private AccountController controller;
    private User priya;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        tokens = mock(PasswordResetTokenRepository.class);
        study = mock(StudyServiceClient.class);
        mailer = mock(ResetMailer.class);
        JwtTokenProvider jwt = mock(JwtTokenProvider.class);
        when(jwt.generateToken(any(), any())).thenReturn("fresh-jwt");
        controller = new AccountController(users, tokens, encoder, study, mailer, jwt, "http://localhost");
        priya = new User("priya@example.com", encoder.encode("Old-Pass-123"), "Priya");
        priya.setId(7L);
        when(users.findByEmail("priya@example.com")).thenReturn(Optional.of(priya));
        when(users.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokens.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private UsernamePasswordAuthenticationToken auth() {
        return new UsernamePasswordAuthenticationToken("priya@example.com", null, List.of());
    }

    // --- change password -------------------------------------------------

    @Test
    void change_password_rejects_a_wrong_current_password() {
        ResponseEntity<ApiResponse<String>> res = controller.changePassword(auth(), new ChangePasswordRequest("nope", "New-Pass-456"));
        assertEquals(400, res.getStatusCode().value());
        assertEquals("INVALID_PASSWORD", res.getBody().getError().getCode());
        assertTrue(encoder.matches("Old-Pass-123", priya.getPassword()));
    }

    @Test
    void change_password_rejects_a_short_new_password() {
        ResponseEntity<ApiResponse<String>> res = controller.changePassword(auth(), new ChangePasswordRequest("Old-Pass-123", "short"));
        assertEquals(400, res.getStatusCode().value());
        assertEquals("WEAK_PASSWORD", res.getBody().getError().getCode());
    }

    @Test
    void change_password_updates_the_hash() {
        ResponseEntity<ApiResponse<String>> res = controller.changePassword(auth(), new ChangePasswordRequest("Old-Pass-123", "New-Pass-456"));
        assertEquals(200, res.getStatusCode().value());
        assertTrue(encoder.matches("New-Pass-456", priya.getPassword()));
        assertNotNull(priya.getPasswordChangedAt(), "older logins must be revoked");
        assertTrue(res.getHeaders().getFirst(HttpHeaders.SET_COOKIE).contains("jwt=fresh-jwt"), "this device stays signed in");
        verify(users).save(priya);
    }

    // --- delete account --------------------------------------------------

    @Test
    void delete_requires_the_password() {
        ResponseEntity<ApiResponse<String>> res = controller.deleteAccount(auth(), new DeleteAccountRequest("wrong"));
        assertEquals(400, res.getStatusCode().value());
        verifyNoInteractions(study);
        verify(users, never()).delete(any());
    }

    @Test
    void delete_is_blocked_while_the_user_owns_shared_groups() {
        when(study.removeUser(7L)).thenReturn(StudyServiceClient.Result.blocked("You own groups with other members: OS Study Group"));
        ResponseEntity<ApiResponse<String>> res = controller.deleteAccount(auth(), new DeleteAccountRequest("Old-Pass-123"));
        assertEquals(409, res.getStatusCode().value());
        assertTrue(res.getBody().getError().getMessage().contains("OS Study Group"));
        verify(users, never()).delete(any());
    }

    @Test
    void delete_removes_study_data_then_the_user_and_clears_the_cookie() {
        when(study.removeUser(7L)).thenReturn(StudyServiceClient.Result.ok());
        ResponseEntity<ApiResponse<String>> res = controller.deleteAccount(auth(), new DeleteAccountRequest("Old-Pass-123"));
        assertEquals(200, res.getStatusCode().value());
        verify(study).removeUser(7L);
        verify(tokens).deleteByUserId(7L);
        verify(users).delete(priya);
        assertTrue(res.getHeaders().getFirst(HttpHeaders.SET_COOKIE).contains("Max-Age=0"));
    }

    @Test
    void delete_fails_safely_when_study_service_is_unreachable() {
        when(study.removeUser(7L)).thenReturn(StudyServiceClient.Result.unavailable());
        ResponseEntity<ApiResponse<String>> res = controller.deleteAccount(auth(), new DeleteAccountRequest("Old-Pass-123"));
        assertEquals(503, res.getStatusCode().value());
        verify(users, never()).delete(any());
    }

    // --- forgot / reset password -----------------------------------------

    @Test
    void forgot_password_does_not_reveal_unknown_emails() {
        when(users.findByEmail("ghost@example.com")).thenReturn(Optional.empty());
        ResponseEntity<ApiResponse<String>> res = controller.forgotPassword(new ForgotPasswordRequest("ghost@example.com"));
        assertEquals(200, res.getStatusCode().value());
        verifyNoInteractions(mailer);
    }

    @Test
    void forgot_password_stores_only_a_hash_and_emails_the_raw_token() {
        ResponseEntity<ApiResponse<String>> res = controller.forgotPassword(new ForgotPasswordRequest("priya@example.com"));
        assertEquals(200, res.getStatusCode().value());

        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokens).save(saved.capture());
        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(mailer).sendResetLink(eq("priya@example.com"), eq("Priya"), link.capture());

        String raw = link.getValue().substring(link.getValue().indexOf("token=") + 6);
        assertTrue(link.getValue().startsWith("http://localhost/reset-password?token="));
        assertNotEquals(raw, saved.getValue().getTokenHash());
        assertEquals(AccountController.sha256(raw), saved.getValue().getTokenHash());
        assertTrue(saved.getValue().getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(29)));
    }

    private PasswordResetToken tokenFor(String raw, LocalDateTime expiresAt, LocalDateTime usedAt) {
        PasswordResetToken t = new PasswordResetToken(7L, AccountController.sha256(raw), expiresAt);
        t.setUsedAt(usedAt);
        when(tokens.findByTokenHash(AccountController.sha256(raw))).thenReturn(Optional.of(t));
        when(users.findById(7L)).thenReturn(Optional.of(priya));
        // The database decides: one conditional UPDATE marks it used only if unused and unexpired.
        boolean usable = usedAt == null && expiresAt.isAfter(LocalDateTime.now());
        when(tokens.consume(eq(AccountController.sha256(raw)), any())).thenReturn(usable ? 1 : 0);
        return t;
    }

    @Test
    void reset_password_with_a_valid_token_changes_the_password_once() {
        tokenFor("good-token", LocalDateTime.now().plusMinutes(10), null);
        when(tokens.consume(eq(AccountController.sha256("good-token")), any())).thenReturn(1).thenReturn(0);

        ResponseEntity<ApiResponse<String>> res = controller.resetPassword(new ResetPasswordRequest("good-token", "Brand-New-789"));
        assertEquals(200, res.getStatusCode().value());
        assertTrue(encoder.matches("Brand-New-789", priya.getPassword()));
        assertNotNull(priya.getPasswordChangedAt(), "logins from before the reset are revoked");

        ResponseEntity<ApiResponse<String>> again = controller.resetPassword(new ResetPasswordRequest("good-token", "Another-000"));
        assertEquals(400, again.getStatusCode().value());
        assertTrue(encoder.matches("Brand-New-789", priya.getPassword()));
    }

    @Test
    void reset_password_rejects_an_expired_token() {
        tokenFor("old-token", LocalDateTime.now().minusMinutes(1), null);
        ResponseEntity<ApiResponse<String>> res = controller.resetPassword(new ResetPasswordRequest("old-token", "Brand-New-789"));
        assertEquals(400, res.getStatusCode().value());
        assertEquals("INVALID_RESET_TOKEN", res.getBody().getError().getCode());
    }

    @Test
    void reset_password_rejects_an_unknown_token() {
        when(tokens.findByTokenHash(anyString())).thenReturn(Optional.empty());
        ResponseEntity<ApiResponse<String>> res = controller.resetPassword(new ResetPasswordRequest("made-up", "Brand-New-789"));
        assertEquals(400, res.getStatusCode().value());
    }

    @Test
    void the_loser_of_a_concurrent_reset_changes_nothing() {
        // Both requests found the token unused; the database let only one consume it.
        tokenFor("raced-token", LocalDateTime.now().plusMinutes(10), null);
        when(tokens.consume(eq(AccountController.sha256("raced-token")), any())).thenReturn(0);

        ResponseEntity<ApiResponse<String>> res = controller.resetPassword(new ResetPasswordRequest("raced-token", "Loser-Pass-111"));

        assertEquals(400, res.getStatusCode().value());
        assertTrue(encoder.matches("Old-Pass-123", priya.getPassword()));
        verify(users, never()).save(any());
    }
}
