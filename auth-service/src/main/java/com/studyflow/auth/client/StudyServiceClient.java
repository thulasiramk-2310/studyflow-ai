package com.studyflow.auth.client;

/** Removes a user's study data (memberships, solo groups) before their account is deleted. */
public interface StudyServiceClient {

    Result removeUser(long userId);

    record Result(Status status, String message) {
        public enum Status { OK, BLOCKED, UNAVAILABLE }

        public static Result ok() { return new Result(Status.OK, null); }
        public static Result blocked(String message) { return new Result(Status.BLOCKED, message); }
        public static Result unavailable() { return new Result(Status.UNAVAILABLE, null); }
    }
}
