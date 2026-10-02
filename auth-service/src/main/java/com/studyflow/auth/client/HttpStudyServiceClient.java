package com.studyflow.auth.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Component
public class HttpStudyServiceClient implements StudyServiceClient {

    private static final Logger log = LoggerFactory.getLogger(HttpStudyServiceClient.class);

    private final RestClient http;
    private final String internalKey;

    public HttpStudyServiceClient(@Value("${study.service.url}") String baseUrl,
                                  @Value("${internal.api.key}") String internalKey) {
        this.http = RestClient.builder().baseUrl(baseUrl).build();
        this.internalKey = internalKey;
    }

    /** study-service wraps errors as {"success": false, "error": {"message": ...}}; plain FastAPI uses "detail". */
    @SuppressWarnings("unchecked")
    static String blockedMessage(Map<String, Object> body) {
        if (body != null) {
            Object error = body.get("error");
            if (error instanceof Map<?, ?> e && e.get("message") != null) return e.get("message").toString();
            if (body.get("detail") != null) return body.get("detail").toString();
        }
        return "You still own groups with other members.";
    }

    @Override
    @SuppressWarnings("unchecked")
    public Result removeUser(long userId) {
        try {
            return http.delete()
                    .uri("/internal/users/{id}", userId)
                    .header("X-Internal-Key", internalKey)
                    .exchange((request, response) -> {
                        HttpStatusCode status = response.getStatusCode();
                        if (status.is2xxSuccessful()) return Result.ok();
                        if (status.value() == 409) {
                            return Result.blocked(blockedMessage(response.bodyTo(Map.class)));
                        }
                        log.error("study-service refused user cleanup: HTTP {}", status.value());
                        return Result.unavailable();
                    });
        } catch (RestClientException e) {
            log.error("study-service unreachable for user cleanup: {}", e.getClass().getSimpleName());
            return Result.unavailable();
        }
    }
}
