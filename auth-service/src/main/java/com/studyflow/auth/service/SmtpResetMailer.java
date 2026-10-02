package com.studyflow.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class SmtpResetMailer implements ResetMailer {

    private static final Logger log = LoggerFactory.getLogger(SmtpResetMailer.class);

    private final ObjectProvider<JavaMailSender> sender;
    private final String host;
    private final String from;

    public SmtpResetMailer(ObjectProvider<JavaMailSender> sender,
                           @Value("${spring.mail.host:}") String host,
                           @Value("${mail.from:}") String from) {
        this.sender = sender;
        this.host = host;
        this.from = from;
    }

    @Override
    public void sendResetLink(String to, String name, String link) {
        JavaMailSender mail = sender.getIfAvailable();
        if (host == null || host.isBlank() || mail == null) {
            log.warn("SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD); password reset email not sent");
            return;
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        if (from != null && !from.isBlank()) msg.setFrom(from);
        msg.setTo(to);
        msg.setSubject("Reset your StudyFlow password");
        msg.setText("Hi " + name + ",\n\n"
                + "Someone asked to reset the password for your StudyFlow account. "
                + "Use this link within 30 minutes; it works once:\n\n" + link + "\n\n"
                + "If this wasn't you, ignore this email. Your password stays the same.\n");
        try {
            mail.send(msg);
        } catch (Exception e) {
            log.error("Password reset email failed: {}", e.getClass().getSimpleName());
        }
    }
}
