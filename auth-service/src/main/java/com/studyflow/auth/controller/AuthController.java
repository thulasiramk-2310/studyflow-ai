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
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

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
            if (user == null) {
                // dummy match to prevent timing attacks
                passwordEncoder.matches(loginRequest.getPassword(), "$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdum");
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Invalid email or password"));
        }

        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication, user);
        UserDto userDto = new UserDto(user.getId().toString(), user.getName(), user.getEmail(), "https://i.pravatar.cc/150?u=" + user.getEmail());

        ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwt)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(ApiResponse.success(new AuthResponse(userDto)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            // Dummy hash to prevent timing attacks
            passwordEncoder.matches(registerRequest.getPassword(), "$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdum");
            // Return dummy response with parity
            UserDto dummyDto = new UserDto("00000000-0000-0000-0000-000000000000", registerRequest.getName(), registerRequest.getEmail(), "https://i.pravatar.cc/150?u=" + registerRequest.getEmail());
            
            ResponseCookie dummyCookie = ResponseCookie.from("jwt", "dummy_token")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
                
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, dummyCookie.toString())
                    .body(ApiResponse.success(new AuthResponse(dummyDto)));
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

        ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwt)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(ApiResponse.success(new AuthResponse(userDto)));
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

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        ResponseCookie clearCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(ApiResponse.success("Logged out successfully"));
    }
}
