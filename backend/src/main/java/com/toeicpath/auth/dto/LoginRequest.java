package com.toeicpath.auth.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.toeicpath.auth.dto.validation.TrimmedEmailDeserializer;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @JsonDeserialize(using = TrimmedEmailDeserializer.class) @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 72) String password
) {
}