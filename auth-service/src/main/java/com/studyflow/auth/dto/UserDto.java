package com.studyflow.auth.dto;

public class UserDto {
    private String id;
    private String name;
    private String email;
    private String avatar;
    private String accountType;

    public UserDto(String id, String name, String email, String avatar, String accountType) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatar = avatar;
        this.accountType = accountType;
    }

    public static UserDto from(com.studyflow.auth.entity.User u) {
        return new UserDto(u.getId().toString(), u.getName(), u.getEmail(),
                "https://i.pravatar.cc/150?u=" + u.getEmail(), u.getAccountType().name());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
}
