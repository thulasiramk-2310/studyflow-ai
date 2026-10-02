package com.studyflow.auth.dto;

public class UpdateAccountRequest {
    private String accountType;
    /** Optional new display name (2-50 characters). */
    private String name;

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
