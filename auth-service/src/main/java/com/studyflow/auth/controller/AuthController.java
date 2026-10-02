package com.studyflow.auth.controller;

import com.studyflow.auth.dto.ApiResponse;
import com.studyflow.auth.dto.AuthResponse;
import com.studyflow.auth.dto.LoginRequest;
import com.studyflow.auth.dto.RegisterRequest;
import com.studyflow.auth.dto.UpdateAccountRequest;
import com.studyflow.auth.dto.UserDto;
import com.studyflow.auth.entity.AccountType;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import java.util.Optional;
import static com.studyflow.auth.security.JwtTokenProvider.JWT_EXPIRATION_SECONDS;

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
        UserDto userDto = UserDto.from(user);

        ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwt)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(JWT_EXPIRATION_SECONDS)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(ApiResponse.success(new AuthResponse(userDto)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        // Missing means student; a value that is present must be valid.
        AccountType accountType = AccountType.STUDENT;
        if (registerRequest.getAccountType() != null) {
            Optional<AccountType> parsed = AccountType.parse(registerRequest.getAccountType());
            if (parsed.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("INVALID_ACCOUNT_TYPE", "Account type must be STUDENT or PROFESSIONAL"));
            }
            accountType = parsed.get();
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            // Dummy hash to prevent timing attacks
            passwordEncoder.matches(registerRequest.getPassword(), "$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdum");
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("EMAIL_ALREADY_REGISTERED", "An account with this email already exists"));
        }

        User user = new User(
                registerRequest.getEmail(),
                passwordEncoder.encode(registerRequest.getPassword()),
                registerRequest.getName()
        );

        user.setAccountType(accountType);
        userRepository.save(user);

        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null, null);
        String jwt = tokenProvider.generateToken(authentication, user);
        
        UserDto userDto = UserDto.from(user);

        ResponseCookie jwtCookie = ResponseCookie.from("jwt", jwt)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(JWT_EXPIRATION_SECONDS)
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

        UserDto userDto = UserDto.from(user);
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateCurrentUser(Authentication authentication, @RequestBody UpdateAccountRequest body) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("NOT_FOUND", "User not found"));
        }
        Optional<AccountType> parsed = AccountType.parse(body == null ? null : body.getAccountType());
        if (parsed.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("INVALID_ACCOUNT_TYPE", "Account type must be STUDENT or PROFESSIONAL"));
        }
        user.setAccountType(parsed.get());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(UserDto.from(user)));
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
