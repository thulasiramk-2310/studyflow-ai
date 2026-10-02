package com.studyflow.auth.controller;

import com.studyflow.auth.dto.ApiResponse;
import com.studyflow.auth.dto.AuthResponse;
import com.studyflow.auth.dto.RegisterRequest;
import com.studyflow.auth.dto.UpdateAccountRequest;
import com.studyflow.auth.dto.UserDto;
import com.studyflow.auth.entity.AccountType;
import com.studyflow.auth.entity.User;
import com.studyflow.auth.repository.UserRepository;
import com.studyflow.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthControllerAccountTypeTest {

    private UserRepository users;
    private AuthController controller;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        JwtTokenProvider tokens = mock(JwtTokenProvider.class);
        when(tokens.generateToken(any(), any())).thenReturn("test-jwt");
        when(users.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) u.setId(1L);
            return u;
        });
        controller = new AuthController(users, new BCryptPasswordEncoder(4), tokens);
    }

    private RegisterRequest request(String accountType) {
        RegisterRequest r = new RegisterRequest();
        r.setName("Priya");
        r.setEmail("priya@example.com");
        r.setPassword("Secret-123");
        r.setAccountType(accountType);
        return r;
    }

    private UsernamePasswordAuthenticationToken auth() {
        return new UsernamePasswordAuthenticationToken("priya@example.com", null, List.of());
    }

    @Test
    void register_without_account_type_is_a_student() {
        ResponseEntity<ApiResponse<AuthResponse>> res = controller.register(request(null));
        assertEquals(200, res.getStatusCode().value());
        assertEquals("STUDENT", res.getBody().getData().getUser().getAccountType());
    }

    @Test
    void register_as_professional() {
        ResponseEntity<ApiResponse<AuthResponse>> res = controller.register(request("PROFESSIONAL"));
        assertEquals("PROFESSIONAL", res.getBody().getData().getUser().getAccountType());
    }

    @Test
    void register_with_invalid_account_type_is_rejected() {
        ResponseEntity<ApiResponse<AuthResponse>> res = controller.register(request("WIZARD"));
        assertEquals(400, res.getStatusCode().value());
        assertEquals("INVALID_ACCOUNT_TYPE", res.getBody().getError().getCode());
        verify(users, never()).save(any());
    }

    @Test
    void me_returns_student_for_legacy_null() {
        User legacy = new User("priya@example.com", "x", "Priya");
        legacy.setId(1L);
        legacy.setAccountType(null);
        when(users.findByEmail("priya@example.com")).thenReturn(Optional.of(legacy));

        ResponseEntity<ApiResponse<UserDto>> res = controller.getCurrentUser(auth());
        assertEquals("STUDENT", res.getBody().getData().getAccountType());
    }

    @Test
    void patch_me_switches_account_type() {
        User u = new User("priya@example.com", "x", "Priya");
        u.setId(1L);
        when(users.findByEmail("priya@example.com")).thenReturn(Optional.of(u));

        UpdateAccountRequest body = new UpdateAccountRequest();
        body.setAccountType("PROFESSIONAL");
        ResponseEntity<ApiResponse<UserDto>> res = controller.updateCurrentUser(auth(), body);

        assertEquals(200, res.getStatusCode().value());
        assertEquals("PROFESSIONAL", res.getBody().getData().getAccountType());
        assertEquals(AccountType.PROFESSIONAL, u.getAccountType());
        verify(users).save(u);
    }

    @Test
    void patch_me_rejects_invalid_value() {
        User u = new User("priya@example.com", "x", "Priya");
        u.setId(1L);
        when(users.findByEmail("priya@example.com")).thenReturn(Optional.of(u));

        UpdateAccountRequest body = new UpdateAccountRequest();
        body.setAccountType("manager");
        ResponseEntity<ApiResponse<UserDto>> res = controller.updateCurrentUser(auth(), body);

        assertEquals(400, res.getStatusCode().value());
        assertEquals(AccountType.STUDENT, u.getAccountType());
    }

    @Test
    void patch_me_updates_the_name() {
        User u = new User("priya@example.com", "x", "Priya");
        u.setId(1L);
        when(users.findByEmail("priya@example.com")).thenReturn(Optional.of(u));

        UpdateAccountRequest body = new UpdateAccountRequest();
        body.setName("Priya Sharma");
        ResponseEntity<ApiResponse<UserDto>> res = controller.updateCurrentUser(auth(), body);

        assertEquals(200, res.getStatusCode().value());
        assertEquals("Priya Sharma", res.getBody().getData().getName());
        assertEquals(AccountType.STUDENT, u.getAccountType());
    }

    @Test
    void patch_me_rejects_a_one_letter_name() {
        User u = new User("priya@example.com", "x", "Priya");
        u.setId(1L);
        when(users.findByEmail("priya@example.com")).thenReturn(Optional.of(u));

        UpdateAccountRequest body = new UpdateAccountRequest();
        body.setName(" P ");
        ResponseEntity<ApiResponse<UserDto>> res = controller.updateCurrentUser(auth(), body);

        assertEquals(400, res.getStatusCode().value());
        assertEquals("Priya", u.getName());
    }
}
