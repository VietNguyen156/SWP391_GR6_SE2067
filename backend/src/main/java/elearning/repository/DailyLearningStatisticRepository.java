package elearning.repository;

import elearning.entity.DailyLearningStatistic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.*;

public interface DailyLearningStatisticRepository
        extends JpaRepository<DailyLearningStatistic, Long> {
    Optional<DailyLearningStatistic> findByStudentIdAndLearningDate(Long studentId, LocalDate date);
}
