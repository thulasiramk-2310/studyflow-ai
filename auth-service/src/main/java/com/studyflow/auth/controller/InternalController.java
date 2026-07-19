package com.studyflow.auth.controller;

import com.studyflow.auth.dto.UserDto;
import com.studyflow.auth.entity.User;
import com.studyflow.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal")
public class InternalController {

    private final UserRepository userRepository;

    @Value("${internal.api.key}")
    private String internalApiKey;

    public InternalController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Validates the X-Internal-Key header against the configured internal API key.
     * Returns 403 if the key is missing or invalid.
     */
    private ResponseEntity<?> validateInternalKey(String key) {
        if (key == null || !key.equals(internalApiKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden: Invalid internal key");
        }
        return null;
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey) {
        ResponseEntity<?> authError = validateInternalKey(internalKey);
        if (authError != null) return authError;

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new UserDto(user.getId().toString(), user.getName(), user.getEmail(), "https://i.pravatar.cc/150?u=" + user.getEmail()));
    }

    @PostMapping("/users/batch")
    public ResponseEntity<?> getUsersBatch(
            @RequestBody List<Long> ids,
            @RequestHeader(value = "X-Internal-Key", required = false) String internalKey) {
        ResponseEntity<?> authError = validateInternalKey(internalKey);
        if (authError != null) return authError;

        List<User> users = userRepository.findAllById(ids);
        List<UserDto> userDtos = users.stream()
                .map(u -> new UserDto(u.getId().toString(), u.getName(), u.getEmail(), "https://i.pravatar.cc/150?u=" + u.getEmail()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }
}
