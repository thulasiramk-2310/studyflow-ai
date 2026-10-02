package com.studyflow.auth.dto;

public class DeleteAccountRequest {
    private String password;

    public DeleteAccountRequest() {}

    public DeleteAccountRequest(String password) {
        this.password = password;
    }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
