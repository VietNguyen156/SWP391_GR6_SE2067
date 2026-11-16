package elearning.repository;

import elearning.entity.FlashcardSet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface FlashcardSetRepository extends JpaRepository<FlashcardSet, Long> {
    List<FlashcardSet> findAllByCourseWeekIdOrderByUpdatedAtDesc(Long courseWeekId);

    List<FlashcardSet> findAllByCreatedByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<FlashcardSet> findByIdAndCreatedByUserId(Long id, Long userId);

    List<FlashcardSet> findAllByStatusOrderByUpdatedAtDesc(FlashcardSet.Status status);
    boolean existsByLessonId(Long lessonId);

    List<FlashcardSet> findAllByLessonIdOrderByCreatedAtAsc(Long lessonId);

}
