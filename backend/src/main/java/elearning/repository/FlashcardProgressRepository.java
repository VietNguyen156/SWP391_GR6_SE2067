package elearning.repository;

import elearning.entity.FlashcardProgress;
import elearning.entity.FlashcardProgressId;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface FlashcardProgressRepository
        extends JpaRepository<FlashcardProgress, FlashcardProgressId> {
    Optional<FlashcardProgress> findByStudentIdAndFlashcardId(Long studentId, Long cardId);

    List<FlashcardProgress> findAllByStudentIdAndFlashcardFlashcardSetId(
            Long studentId, Long setId);

    List<FlashcardProgress> findAllByStudentId(Long studentId);

    boolean existsByFlashcardFlashcardSetId(Long setId);

    boolean existsByFlashcardId(Long cardId);
}
