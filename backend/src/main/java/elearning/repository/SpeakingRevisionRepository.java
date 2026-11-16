package elearning.repository;

import elearning.entity.SpeakingRevision;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SpeakingRevisionRepository extends JpaRepository<SpeakingRevision, Long> {
    List<SpeakingRevision> findAllBySubmissionIdOrderByRevisionNumberDesc(Long submissionId);

    List<SpeakingRevision> findAllBySubmissionIdInOrderBySubmissionIdAscRevisionNumberDesc(
            Collection<Long> submissionIds);

    Optional<SpeakingRevision> findByIdAndSubmissionId(Long id, Long submissionId);

    boolean existsBySubmissionIdAndRevisionNumber(Long submissionId, Integer revisionNumber);
}
