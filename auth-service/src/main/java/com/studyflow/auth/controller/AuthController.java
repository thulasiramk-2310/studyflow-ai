package com.studyflow.auth.controller;

import com.studyflow.auth.dto.ApiResponse;
import com.studyflow.auth.dto.AuthResponse;
import com.studyflow.auth.dto.LoginRequest;
import com.studyflow.auth.dto.RegisterRequest;
import com.studyflow.auth.dto.UserDto;
import com.studyflow.auth.entity.User;
import com.studyflow.auth.repository.UserRepository;
import com.studyflow.auth.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Invalid email or password"));
        }

        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication, user);
        UserDto userDto = new UserDto(user.getId().toString(), user.getName(), user.getEmail(), "https://i.pravatar.cc/150?u=" + user.getEmail());

        return ResponseEntity.ok(ApiResponse.success(new AuthResponse(jwt, userDto)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("EMAIL_TAKEN", "Email is already taken!"));
        }

        User user = new User(
                registerRequest.getEmail(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getName()
        );

        userRepository.save(user);

        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null, null);
        String jwt = tokenProvider.generateToken(authentication, user);
        
        UserDto userDto = new UserDto(user.getId().toString(), user.getName(), user.getEmail(), "https://i.pravatar.cc/150?u=" + user.getEmail());

        return ResponseEntity.ok(ApiResponse.success(new AuthResponse(jwt, userDto)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", "User not found"));
        }

        UserDto userDto = new UserDto(user.getId().toString(), user.getName(), user.getEmail(), "https://i.pravatar.cc/150?u=" + user.getEmail());
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }
}
