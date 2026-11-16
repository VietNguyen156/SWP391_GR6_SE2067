package elearning.repository;

import elearning.entity.LessonContent;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonContentRepository extends JpaRepository<LessonContent, Long> {
    List<LessonContent> findAllByLessonIdOrderBySortOrderAsc(Long lessonId);

    boolean existsByLessonId(Long lessonId);

    Optional<LessonContent> findByIdAndLessonCreatedByTeacherId(Long id, Long teacherId);
}
