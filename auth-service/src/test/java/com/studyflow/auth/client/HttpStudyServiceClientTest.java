package com.studyflow.auth.client;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class HttpStudyServiceClientTest {

    @Test
    void reads_the_message_from_study_service_error_envelope() {
        Map<String, Object> body = Map.of("success", false,
                "error", Map.of("code", "409", "message", "You own groups with other members: OS Study Group."));
        assertEquals("You own groups with other members: OS Study Group.", HttpStudyServiceClient.blockedMessage(body));
    }

    @Test
    void reads_a_plain_fastapi_detail_too() {
        assertEquals("Owned: X", HttpStudyServiceClient.blockedMessage(Map.of("detail", "Owned: X")));
    }

    @Test
    void falls_back_when_the_body_is_unreadable() {
        assertEquals("You still own groups with other members.", HttpStudyServiceClient.blockedMessage(null));
    }
}
