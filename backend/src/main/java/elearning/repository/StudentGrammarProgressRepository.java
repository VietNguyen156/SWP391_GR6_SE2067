package elearning.repository;

import elearning.entity.StudentGrammarProgress;
import elearning.entity.StudentGrammarProgressId;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface StudentGrammarProgressRepository
        extends JpaRepository<StudentGrammarProgress, StudentGrammarProgressId> {
    Optional<StudentGrammarProgress> findByStudentIdAndGrammarTopicId(Long studentId, Long topicId);

    List<StudentGrammarProgress> findAllByStudentId(Long studentId);

    boolean existsByGrammarTopicId(Long topicId);
}
