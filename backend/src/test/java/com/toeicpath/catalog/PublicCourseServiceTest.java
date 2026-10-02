package com.toeicpath.catalog;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicCourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private PublicCourseService publicCourseService;

    @Test
    void returnsPublishedCourses() {
        when(courseRepository.findByStatusOrderByCreatedAtDesc(CourseStatus.PUBLISHED))
                .thenReturn(List.of());

        List<CourseSummary> result = publicCourseService.getPublishedCourses();

        assertThat(result).isEmpty();
        verify(courseRepository).findByStatusOrderByCreatedAtDesc(CourseStatus.PUBLISHED);
    }
}

