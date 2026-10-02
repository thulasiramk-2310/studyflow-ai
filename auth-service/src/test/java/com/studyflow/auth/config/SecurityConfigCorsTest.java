package com.studyflow.auth.config;

import com.studyflow.auth.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class SecurityConfigCorsTest {

    @Test
    void cors_allows_patch_for_switching_account_type() {
        // Behind TLS termination the browser's Origin differs from what Spring sees,
        // so PATCH /auth/me is checked as a cross-origin request.
        SecurityConfig config = new SecurityConfig(mock(JwtAuthenticationFilter.class));
        MockHttpServletRequest request = new MockHttpServletRequest("PATCH", "/auth/me");
        CorsConfiguration cors = config.corsConfigurationSource().getCorsConfiguration(request);

        assertNotNull(cors);
        assertTrue(cors.getAllowedMethods().contains("PATCH"), "allowed methods: " + cors.getAllowedMethods());
    }
}
