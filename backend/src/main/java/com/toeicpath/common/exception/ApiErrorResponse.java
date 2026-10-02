package com.toeicpath.common.exception;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        boolean success,
        String errorCode,
        String message,
        List<String> errors,
        Instant timestamp
) {
    public static ApiErrorResponse of(String errorCode, String message, List<String> errors) {
        return new ApiErrorResponse(false, errorCode, message, errors, Instant.now());
    }
}

