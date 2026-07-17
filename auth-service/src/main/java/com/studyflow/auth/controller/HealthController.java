package com.studyflow.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.Instant;
import java.util.Map;
import java.util.HashMap;

@RestController
public class HealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "UP");
        return health;
    }

    @GetMapping("/ready")
    public Map<String, String> readyCheck() {
        Map<String, String> ready = new HashMap<>();
        ready.put("status", "UP");
        ready.put("service", "auth-service");
        ready.put("version", "1.0.0");
        ready.put("timestamp", Instant.now().toString());

        try {
            jdbcTemplate.execute("SELECT 1");
            ready.put("database", "UP");
        } catch (Exception e) {
            ready.put("database", "DOWN");
            ready.put("status", "DOWN");
        }

        return ready;
    }
}
