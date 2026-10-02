package com.toeicpath.catalog;

public record CourseSummary(
        Long id,
        String code,
        String title,
        String description,
        CourseLevel level,
        Long priceVnd
) {
}

