package elearning.repository;

import elearning.entity.Flashcard;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findAllByFlashcardSetIdOrderBySortOrderAsc(Long setId);

    long countByFlashcardSetId(Long setId);
}
