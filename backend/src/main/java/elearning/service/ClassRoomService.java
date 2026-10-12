package elearning.service;

import elearning.dto.ClassroomDto.ClassDetailResponse;
import elearning.dto.ClassroomDto.ClassLessonProgressResponse;
import elearning.dto.ClassroomDto.ClassRoomRequest;
import elearning.dto.ClassroomDto.ClassRoomResponse;
import elearning.dto.ClassroomDto.ClassStudentResponse;
import elearning.dto.ClassroomDto.ClassSubmissionResponse;
import elearning.dto.ClassroomDto.StudentClassProgressResponse;
import elearning.entity.ClassEnrollment;
import elearning.entity.ClassRoom;
import elearning.entity.CourseOrder;
import elearning.entity.Course;
import elearning.entity.CourseWeek;
import elearning.entity.FlashcardProgress;
import elearning.entity.FlashcardSet;
import elearning.entity.GrammarTopic;
import elearning.entity.Lesson;
import elearning.entity.LessonProgress;
import elearning.entity.ListeningActivity;
import elearning.entity.ListeningAttempt;
import elearning.entity.SpeakingActivity;
import elearning.entity.SpeakingSubmission;
import elearning.entity.StudentGrammarProgress;
import elearning.entity.StudentLearningProgress;
import elearning.entity.User;
import elearning.entity.UserRole;
import elearning.entity.UserStatus;
import elearning.exception.ResourceNotFoundException;
import elearning.repository.ClassEnrollmentRepository;
import elearning.repository.ClassRoomRepository;
import elearning.repository.CourseOrderRepository;
import elearning.repository.CourseRepository;
import elearning.repository.CourseWeekRepository;
import elearning.repository.FlashcardProgressRepository;
import elearning.repository.FlashcardSetRepository;
import elearning.repository.GrammarTopicRepository;
import elearning.repository.LessonProgressRepository;
import elearning.repository.LessonRepository;
import elearning.repository.ListeningActivityRepository;
import elearning.repository.ListeningAttemptRepository;
import elearning.repository.QuizAttemptRepository;
import elearning.repository.QuizRepository;
import elearning.repository.SpeakingActivityRepository;
import elearning.repository.SpeakingSubmissionRepository;
import elearning.repository.StudentGrammarProgressRepository;
import elearning.repository.StudentLearningProgressRepository;
import elearning.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.*;
import java.text.Normalizer;
import java.util.*;

@Service
@Transactional
public class ClassRoomService {
    private final ClassRoomRepository classes;
    private final ClassEnrollmentRepository enrollments;
    private final CourseRepository courses;
    private final LessonRepository lessons;
    private final LessonProgressRepository lessonProgress;
    private final StudentLearningProgressRepository courseProgress;
    private final UserRepository users;
    private final SpeakingSubmissionRepository speakingSubmissions;
    private final ListeningAttemptRepository listeningAttempts;
    private final QuizAttemptRepository quizAttempts;
    private final CourseWeekRepository courseWeeks;
    private final GrammarTopicRepository grammarTopics;
    private final StudentGrammarProgressRepository grammarProgress;
    private final FlashcardSetRepository flashcardSets;
    private final FlashcardProgressRepository flashcardProgress;
    private final ListeningActivityRepository listeningActivities;
    private final SpeakingActivityRepository speakingActivities;
    private final QuizRepository quizzes;
    private final CourseOrderRepository orders;

    public ClassRoomService(
            ClassRoomRepository c,
            ClassEnrollmentRepository e,
            CourseRepository cr,
            LessonRepository l,
            LessonProgressRepository lp,
            StudentLearningProgressRepository cp,
            UserRepository u,
            SpeakingSubmissionRepository ss,
            ListeningAttemptRepository la,
            QuizAttemptRepository qa,
            CourseWeekRepository cw,
            GrammarTopicRepository gt,
            StudentGrammarProgressRepository gp,
            FlashcardSetRepository fs,
            FlashcardProgressRepository fp,
            ListeningActivityRepository lia,
            SpeakingActivityRepository spa,
            QuizRepository qr,
            CourseOrderRepository co) {
        classes = c;
        enrollments = e;
        courses = cr;
        lessons = l;
        lessonProgress = lp;
        courseProgress = cp;
        users = u;
        speakingSubmissions = ss;
        listeningAttempts = la;
        quizAttempts = qa;
        courseWeeks = cw;
        grammarTopics = gt;
        grammarProgress = gp;
        flashcardSets = fs;
        flashcardProgress = fp;
        listeningActivities = lia;
        speakingActivities = spa;
        quizzes = qr;
        orders = co;
    }

    public ClassRoomResponse create(String email, ClassRoomRequest r) {
        User teacher = teacher(email);
        Course course = ownedCourse(r.courseId(), teacher.getId());
        validateDates(r);
        ClassRoom room = new ClassRoom();
        room.setCreatedByTeacher(teacher);
        room.setTeacher(teacher);
        room.setCourse(course);
        apply(room, r, null);
        return response(classes.save(room));
    }

    public ClassRoomResponse update(String email, Long id, ClassRoomRequest r) {
        User teacher = teacher(email);
        ClassRoom room = ownedClass(id, teacher.getId());
        room.setCourse(ownedCourse(r.courseId(), teacher.getId()));
        validateDates(r);
        apply(room, r, id);
        return response(classes.save(room));
    }

    public void delete(String email, Long id) {
        User teacher = teacher(email);
        ClassRoom room = ownedClass(id, teacher.getId());
        // Xóa lớp sẽ xóa dây chuyền ghi danh (FK ON DELETE CASCADE) → học viên mất quyền học.
        if (enrollments.existsByClassroomId(id)) {
            throw new IllegalArgumentException(
                    "Lớp đã có học viên tham gia nên không thể xóa. Hãy chuyển trạng thái lớp sang Đã đóng.");
        }
        classes.delete(room);
    }

    @Transactional(readOnly = true)
    public List<ClassRoomResponse> teacherClasses(String email) {
        User teacher = teacher(email);
        return classes.findAllByTeacherIdOrderByUpdatedAtDesc(teacher.getId()).stream()
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassDetailResponse teacherClass(String email, Long id) {
        User teacher = teacher(email);
        return detail(ownedClass(id, teacher.getId()));
    }

    @Transactional(readOnly = true)
    public List<ClassStudentResponse> students(String email, Long id) {
        User teacher = teacher(email);
        return studentRows(ownedClass(id, teacher.getId()));
    }

    @Transactional(readOnly = true)
    public List<ClassSubmissionResponse> submissions(String email, Long id) {
        User teacher = teacher(email);
        ClassRoom room = ownedClass(id, teacher.getId());
        List<ClassEnrollment> active =
                enrollments.findAllByClassroomIdAndStatusOrderByJoinedAtDesc(
                        room.getId(), ClassEnrollment.Status.ACTIVE);
        List<Long> studentIds = active.stream().map(e -> e.getStudent().getId()).toList();
        if (studentIds.isEmpty()) return List.of();
        List<ClassSubmissionResponse> rows = new ArrayList<>();
        for (SpeakingSubmission s :
                speakingSubmissions
                        .findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
                                room.getCourse().getId(), studentIds)) {
            User st = s.getStudent();
            rows.add(
                    new ClassSubmissionResponse(
                            "SPEAKING",
                            s.getId(),
                            s.getActivity().getId(),
                            s.getActivity().getTitle(),
                            st.getId(),
                            st.getFullName(),
                            st.getEmail(),
                            s.getStatus().name(),
                            s.getScore(),
                            s.getFeedback(),
                            s.getSubmittedAt(),
                            s.getRecordingUrl()));
        }
        for (ListeningAttempt a :
                listeningAttempts
                        .findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
                                room.getCourse().getId(), studentIds)) {
            User st = a.getStudent();
            rows.add(
                    new ClassSubmissionResponse(
                            "LISTENING",
                            a.getId(),
                            a.getActivity().getId(),
                            a.getActivity().getTitle(),
                            st.getId(),
                            st.getFullName(),
                            st.getEmail(),
                            "SUBMITTED",
                            a.getScore(),
                            null,
                            a.getSubmittedAt(),
                            null));
        }
        rows.sort(
                Comparator.comparing(
                        ClassSubmissionResponse::submittedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())));
        return rows;
    }

    public ClassRoomResponse join(String email, Long id) {
        User student = student(email);
        ClassRoom room =
                classes.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        if (room.getStatus() != ClassRoom.Status.OPEN)
            throw new IllegalArgumentException("Lớp học hiện không nhận học viên");
        if (room.getCourse().getStatus() != elearning.entity.Course.Status.PUBLISHED)
            throw new IllegalArgumentException("Khóa học của lớp chưa được xuất bản");
        // (a) Phải mua khóa học trước (đơn PAID).
        if (!orders.existsByStudentIdAndCourseIdAndStatus(
                student.getId(), room.getCourse().getId(), CourseOrder.Status.PAID))
            throw new IllegalArgumentException(
                    "Bạn cần mua khóa học trước khi chọn lớp");
        // (b) Mỗi khóa chỉ một lớp, không đổi lớp (kể cả lớp đã kết thúc). Ghi danh bị gỡ do hoàn
        // tiền (REMOVED) / tự bỏ (DROPPED) không chặn việc mua lại và chọn lớp.
        Optional<ClassEnrollment> existing =
                enrollments
                        .findAllByStudentIdAndClassroomCourseId(student.getId(), room.getCourse().getId())
                        .stream()
                        .filter(
                                e ->
                                        e.getStatus() == ClassEnrollment.Status.ACTIVE
                                                || e.getStatus() == ClassEnrollment.Status.COMPLETED)
                        .findFirst();
        if (existing.isPresent()) {
            ClassEnrollment current = existing.get();
            if (current.getClassroom().getId().equals(id))
                throw new IllegalArgumentException("Bạn đã tham gia lớp học này");
            throw new IllegalArgumentException(
                    "Bạn đã tham gia lớp "
                            + current.getClassroom().getClassName()
                            + " của khóa học này. Mỗi học viên chỉ học một lớp trong mỗi khóa và"
                            + " không thể đổi lớp.");
        }
        Optional<ClassEnrollment> old =
                enrollments.findByClassroomIdAndStudentId(id, student.getId());
        long count = enrollments.countByClassroomIdAndStatus(id, ClassEnrollment.Status.ACTIVE);
        if (room.getMaxStudents() != null && count >= room.getMaxStudents())
            throw new IllegalArgumentException("Lớp học đã đủ số lượng");
        ClassEnrollment enrollment = old.orElseGet(ClassEnrollment::new);
        enrollment.setClassroom(room);
        enrollment.setStudent(student);
        enrollment.setStatus(ClassEnrollment.Status.ACTIVE);
        enrollment.setCompletedAt(null);
        enrollments.save(enrollment);
        return response(room);
    }

    @Transactional(readOnly = true)
    public List<ClassRoomResponse> studentClasses(String email) {
        User student = student(email);
        return enrollments
                .findAllByStudentIdAndStatusOrderByJoinedAtDesc(
                        student.getId(), ClassEnrollment.Status.ACTIVE)
                .stream()
                .map(ClassEnrollment::getClassroom)
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassRoomResponse> studentCourseClasses(Long courseId) {
        return classes.findAllByCourseId(courseId).stream()
                .filter(room -> room.getStatus() == ClassRoom.Status.OPEN)
                .sorted(
                        Comparator.comparing(
                                        ClassRoom::getStartDate,
                                        Comparator.nullsLast(Comparator.naturalOrder()))
                                .thenComparing(
                                        ClassRoom::getClassName, String.CASE_INSENSITIVE_ORDER))
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClassDetailResponse studentClass(String email, Long id) {
        User student = student(email);
        enrollments
                .findByClassroomIdAndStudentId(id, student.getId())
                .filter(x -> x.getStatus() == ClassEnrollment.Status.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn chưa tham gia lớp học"));
        return detail(
                classes.findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Không tìm thấy lớp học")));
    }

    @Transactional(readOnly = true)
    public StudentClassProgressResponse studentClassProgress(String email, Long id) {
        User student = student(email);
        ClassEnrollment enrollment =
                enrollments
                        .findByClassroomIdAndStudentId(id, student.getId())
                        .filter(x -> x.getStatus() == ClassEnrollment.Status.ACTIVE)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Bạn chưa tham gia lớp học"));
        ClassRoom room = enrollment.getClassroom();
        Long courseId = room.getCourse().getId();
        Long studentId = student.getId();
        List<CourseWeek> weekList = courseWeeks.findAllByCourseIdOrderByWeekNumberAsc(courseId);
        List<GrammarTopic> grammar =
                grammarTopics
                        .findAllByStatusOrderByCreatedAtDesc(GrammarTopic.Status.PUBLISHED)
                        .stream()
                        .filter(
                                x ->
                                        x.getCourseWeek() != null
                                                && x.getCourseWeek()
                                                        .getCourse()
                                                        .getId()
                                                        .equals(courseId))
                        .toList();
        List<FlashcardSet> flash =
                flashcardSets
                        .findAllByStatusOrderByUpdatedAtDesc(FlashcardSet.Status.PUBLISHED)
                        .stream()
                        .filter(
                                x ->
                                        x.getCreatedByUser().getRole() == UserRole.TEACHER
                                                && x.getCourseWeek() != null
                                                && x.getCourseWeek()
                                                        .getCourse()
                                                        .getId()
                                                        .equals(courseId))
                        .toList();
        List<ListeningActivity> listening =
                listeningActivities.findAll().stream()
                        .filter(
                                x ->
                                        x.getStatus() == ListeningActivity.Status.PUBLISHED
                                                && x.getCourseWeek() != null
                                                && x.getCourseWeek()
                                                        .getCourse()
                                                        .getId()
                                                        .equals(courseId))
                        .toList();
        List<SpeakingActivity> speaking =
                speakingActivities.findAll().stream()
                        .filter(
                                x ->
                                        x.getStatus() == SpeakingActivity.Status.PUBLISHED
                                                && x.getCourseWeek() != null
                                                && x.getCourseWeek()
                                                        .getCourse()
                                                        .getId()
                                                        .equals(courseId))
                        .toList();

        Set<Long> grammarDone =
                grammarProgress.findAllByStudentId(studentId).stream()
                        .filter(x -> x.getStatus() == StudentGrammarProgress.Status.COMPLETED)
                        .map(x -> x.getGrammarTopic().getId())
                        .collect(java.util.stream.Collectors.toSet());
        Set<Long> flashTouched =
                flashcardProgress.findAllByStudentId(studentId).stream()
                        .filter(x -> x.getMemoryStatus() != FlashcardProgress.MemoryStatus.NEW)
                        .map(x -> x.getFlashcard().getFlashcardSet().getId())
                        .collect(java.util.stream.Collectors.toSet());

        LinkedHashMap<Long, ListeningAttempt> listeningLatest = new LinkedHashMap<>();
        for (ListeningAttempt a :
                listeningAttempts
                        .findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
                                courseId, List.of(studentId)))
            listeningLatest.putIfAbsent(a.getActivity().getId(), a);
        LinkedHashMap<Long, SpeakingSubmission> speakingLatest = new LinkedHashMap<>();
        for (SpeakingSubmission a :
                speakingSubmissions
                        .findAllByActivityCourseWeekCourseIdAndStudentIdInOrderBySubmittedAtDesc(
                                courseId, List.of(studentId)))
            speakingLatest.putIfAbsent(a.getActivity().getId(), a);

        List<StudentClassProgressResponse.WeekProgress> weekRows = new ArrayList<>();
        for (CourseWeek w : weekList) {
            int total =
                    (int)
                                    grammar.stream()
                                            .filter(
                                                    x ->
                                                            x.getCourseWeek()
                                                                    .getId()
                                                                    .equals(w.getId()))
                                            .count()
                            + (int)
                                    flash.stream()
                                            .filter(
                                                    x ->
                                                            x.getCourseWeek()
                                                                    .getId()
                                                                    .equals(w.getId()))
                                            .count()
                            + (int)
                                    listening.stream()
                                            .filter(
                                                    x ->
                                                            x.getCourseWeek()
                                                                    .getId()
                                                                    .equals(w.getId()))
                                            .count()
                            + (int)
                                    speaking.stream()
                                            .filter(
                                                    x ->
                                                            x.getCourseWeek()
                                                                    .getId()
                                                                    .equals(w.getId()))
                                            .count();
            int done =
                    (int)
                                    grammar.stream()
                                            .filter(
                                                    x ->
                                                            x.getCourseWeek()
                                                                            .getId()
                                                                            .equals(w.getId())
                                                                    && grammarDone.contains(
                                                                            x.getId()))
                                            .count()
                            + (int)
                                    flash.stream()
                                            .filter(
                                                    x ->
                                                            x.getCourseWeek()
                                                                            .getId()
                                                                            .equals(w.getId())
                                                                    && flashTouched.contains(
                                                                            x.getId()))
                                            .count()
                            + (int)
                                    listening.stream()
                                            .filter(
                                                    x ->
                                                            x.getCourseWeek()
                                                                            .getId()
                                                                            .equals(w.getId())
                                                                    && listeningLatest.containsKey(
                                                                            x.getId()))
                                            .count()
                            + (int)
                                    speaking.stream()
                                            .filter(
                                                    x ->
                                                            x.getCourseWeek()
                                                                            .getId()
                                                                            .equals(w.getId())
                                                                    && speakingLatest.containsKey(
                                                                            x.getId()))
                                            .count();
            weekRows.add(
                    new StudentClassProgressResponse.WeekProgress(
                            w.getId(),
                            w.getWeekNumber(),
                            w.getTitle(),
                            done,
                            total,
                            percentage(done, total)));
        }

        int grammarCompleted =
                (int) grammar.stream().filter(x -> grammarDone.contains(x.getId())).count();
        int flashCompleted =
                (int) flash.stream().filter(x -> flashTouched.contains(x.getId())).count();
        int listeningCompleted =
                (int)
                        listening.stream()
                                .filter(x -> listeningLatest.containsKey(x.getId()))
                                .count();
        int speakingCompleted =
                (int) speaking.stream().filter(x -> speakingLatest.containsKey(x.getId())).count();
        int totalContent = grammar.size() + flash.size() + listening.size() + speaking.size();
        int completedContent =
                grammarCompleted + flashCompleted + listeningCompleted + speakingCompleted;
        int submitted = listeningLatest.size() + speakingLatest.size();
        int graded =
                (int) listeningLatest.values().stream().filter(x -> x.getScore() != null).count()
                        + (int)
                                speakingLatest.values().stream()
                                        .filter(
                                                x ->
                                                        x.getStatus()
                                                                == SpeakingSubmission.Status.GRADED)
                                        .count();
        List<BigDecimal> scoreValues = new ArrayList<>();
        listeningLatest.values().stream()
                .map(ListeningAttempt::getScore)
                .filter(Objects::nonNull)
                .forEach(scoreValues::add);
        speakingLatest.values().stream()
                .map(SpeakingSubmission::getScore)
                .filter(Objects::nonNull)
                .forEach(scoreValues::add);

        List<StudentClassProgressResponse.TypeProgress> types =
                List.of(
                        new StudentClassProgressResponse.TypeProgress(
                                "GRAMMAR",
                                "Ngữ pháp",
                                grammarCompleted,
                                grammar.size(),
                                null,
                                null),
                        new StudentClassProgressResponse.TypeProgress(
                                "FLASHCARD", "Flashcard", flashCompleted, flash.size(), null, null),
                        new StudentClassProgressResponse.TypeProgress(
                                "LISTENING",
                                "Listening",
                                listeningCompleted,
                                listening.size(),
                                (int)
                                        listeningLatest.values().stream()
                                                .filter(x -> x.getScore() != null)
                                                .count(),
                                averageScores(
                                        listeningLatest.values().stream()
                                                .map(ListeningAttempt::getScore)
                                                .filter(Objects::nonNull)
                                                .toList())),
                        new StudentClassProgressResponse.TypeProgress(
                                "SPEAKING",
                                "Speaking",
                                speakingCompleted,
                                speaking.size(),
                                (int)
                                        speakingLatest.values().stream()
                                                .filter(
                                                        x ->
                                                                x.getStatus()
                                                                        == SpeakingSubmission.Status
                                                                                .GRADED)
                                                .count(),
                                averageScores(
                                        speakingLatest.values().stream()
                                                .map(SpeakingSubmission::getScore)
                                                .filter(Objects::nonNull)
                                                .toList())));

        List<StudentClassProgressResponse.RecentItem> recent = new ArrayList<>();
        for (ListeningAttempt a : listeningLatest.values())
            recent.add(
                    new StudentClassProgressResponse.RecentItem(
                            "LISTENING",
                            a.getActivity().getTitle(),
                            "GRADED",
                            a.getScore(),
                            a.getSubmittedAt()));
        for (SpeakingSubmission a : speakingLatest.values())
            recent.add(
                    new StudentClassProgressResponse.RecentItem(
                            "SPEAKING",
                            a.getActivity().getTitle(),
                            a.getStatus().name(),
                            a.getScore(),
                            a.getSubmittedAt()));
        recent.sort(
                Comparator.comparing(
                        StudentClassProgressResponse.RecentItem::occurredAt,
                        Comparator.nullsLast(Comparator.reverseOrder())));
        if (recent.size() > 8) recent = new ArrayList<>(recent.subList(0, 8));

        return new StudentClassProgressResponse(
                room.getId(),
                courseId,
                room.getClassName(),
                room.getCourse().getTitle(),
                new StudentClassProgressResponse.Summary(
                        completedContent,
                        totalContent,
                        submitted,
                        graded,
                        averageScores(scoreValues)),
                weekRows,
                types,
                recent);
    }

    @Transactional(readOnly = true)
    public List<ClassRoomResponse> adminClasses() {
        return classes.findAllByOrderByUpdatedAtDesc().stream().map(this::response).toList();
    }

    private ClassDetailResponse detail(ClassRoom room) {
        List<ClassStudentResponse> students = studentRows(room);
        List<Long> ids = students.stream().map(ClassStudentResponse::id).toList();
        List<Lesson> shared = courseLessons(room.getCourse().getId());
        List<ClassLessonProgressResponse> rows = new ArrayList<>();
        long completed = 0, total = (long) ids.size() * shared.size();
        for (Lesson lesson : shared) {
            long done =
                    ids.isEmpty()
                            ? 0
                            : lessonProgress.countByLessonIdAndStatusAndStudentIdIn(
                                    lesson.getId(), LessonProgress.Status.COMPLETED, ids);
            completed += done;
            BigDecimal percentage =
                    ids.isEmpty()
                            ? BigDecimal.ZERO
                            : BigDecimal.valueOf(done * 100.0 / ids.size())
                                    .setScale(2, RoundingMode.HALF_UP);
            rows.add(
                    new ClassLessonProgressResponse(
                            lesson.getId(), lesson.getTitle(), done, ids.size(), percentage));
        }
        BigDecimal overall =
                total == 0
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(completed * 100.0 / total)
                                .setScale(2, RoundingMode.HALF_UP);
        return new ClassDetailResponse(response(room), students, rows, overall);
    }

    private List<ClassStudentResponse> studentRows(ClassRoom room) {
        return enrollments
                .findAllByClassroomIdAndStatusOrderByJoinedAtDesc(
                        room.getId(), ClassEnrollment.Status.ACTIVE)
                .stream()
                .map(
                        e -> {
                            User u = e.getStudent();
                            BigDecimal p =
                                    courseProgress
                                            .findByStudentIdAndCourseId(
                                                    u.getId(), room.getCourse().getId())
                                            .map(StudentLearningProgress::getProgressPercentage)
                                            .orElse(BigDecimal.ZERO);
                            return new ClassStudentResponse(
                                    u.getId(),
                                    u.getEmail(),
                                    u.getFullName(),
                                    u.getAvatarUrl(),
                                    e.getStatus().name(),
                                    e.getJoinedAt(),
                                    p);
                        })
                .toList();
    }

    private BigDecimal percentage(int completed, int total) {
        return total == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(completed * 100.0 / total).setScale(0, RoundingMode.HALF_UP);
    }

    private BigDecimal averageScores(List<BigDecimal> scores) {
        return scores.isEmpty()
                ? BigDecimal.ZERO
                : scores.stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(scores.size()), 2, RoundingMode.HALF_UP);
    }

    private ClassRoomResponse response(ClassRoom r) {
        Course c = r.getCourse();
        return new ClassRoomResponse(
                r.getId(),
                c.getId(),
                c.getTitle(),
                r.getTeacher().getId(),
                r.getTeacher().getFullName(),
                r.getClassName(),
                r.getClassCode(),
                r.getDescription(),
                r.getStartDate(),
                r.getEndDate(),
                r.getMaxStudents(),
                r.getStatus().name(),
                enrollments.countByClassroomIdAndStatus(r.getId(), ClassEnrollment.Status.ACTIVE),
                courseLessonCount(c.getId()),
                r.getCreatedAt(),
                r.getUpdatedAt());
    }

    private List<Lesson> courseLessons(Long courseId) {
        return lessons.findAllByCourseWeekCourseIdOrderByCourseWeekWeekNumberAscSortOrderAsc(courseId);
    }

    private long courseLessonCount(Long courseId) {
        return lessons.countByCourseWeekCourseId(courseId);
    }

    private void apply(ClassRoom room, ClassRoomRequest r, Long id) {
        room.setClassName(r.className().trim());
        room.setClassCode(code(r.classCode(), r.className(), id));
        room.setDescription(clean(r.description()));
        room.setStartDate(r.startDate());
        room.setEndDate(r.endDate());
        room.setMaxStudents(r.maxStudents());
        room.setStatus(r.status());
    }

    private String code(String requested, String name, Long id) {
        String value = clean(requested);
        String base =
                (value == null
                                ? Normalizer.normalize(name, Normalizer.Form.NFD)
                                        .replaceAll("\\p{M}+", "")
                                        .replaceAll("[^A-Za-z0-9]+", "-")
                                : value)
                        .toUpperCase(Locale.ROOT)
                        .replaceAll("(^-|-$)", "");
        if (base.isBlank()) base = "CLASS";
        if (base.length() > 42) base = base.substring(0, 42);
        String candidate = base;
        int suffix = 1;
        while (id == null
                ? classes.existsByClassCodeIgnoreCase(candidate)
                : classes.existsByClassCodeIgnoreCaseAndIdNot(candidate, id))
            candidate = base + "-" + (++suffix);
        return candidate;
    }

    private void validateDates(ClassRoomRequest r) {
        if (r.startDate() != null && r.endDate() != null && r.endDate().isBefore(r.startDate()))
            throw new IllegalArgumentException("Ngày kết thúc không được trước ngày bắt đầu");
    }

    private User teacher(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(x -> x.getRole() == UserRole.TEACHER && x.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));
    }

    private User student(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(x -> x.getRole() == UserRole.STUDENT && x.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên"));
    }

    private Course ownedCourse(Long id, Long teacherId) {
        return courses.findByIdAndCreatedByTeacherId(id, teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khóa học"));
    }

    private ClassRoom ownedClass(Long id, Long teacherId) {
        return classes.findByIdAndTeacherId(id, teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
    }

    private String clean(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
