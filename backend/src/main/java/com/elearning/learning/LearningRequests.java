package com.elearning.learning;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class LearningRequests {
    private LearningRequests() {}
    public record PackageRequest(
        @NotBlank @Size(max=180) String name,
        @Size(max=10000) String description,
        @NotNull @DecimalMin("0.00") @Digits(integer=10, fraction=2) BigDecimal price,
        @NotNull @Min(1) @Max(3650) Integer durationDays) {}
    public record ClassRequest(
        @NotBlank @Size(max=180) String name,
        @Size(max=10000) String description,
        LocalDate startDate, LocalDate endDate,
        @NotNull @Min(1) @Max(10000) Integer maxStudents) {}
    public record AddStudentRequest(@NotBlank @Email @Size(max=255) String email) {}
}
