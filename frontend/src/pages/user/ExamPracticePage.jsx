import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { studentPracticeApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";
import { formatNumber, formatPercent } from "../../utils/format";

function SkillStatus({ score, hasData, needsPractice }) {
  if (!hasData) return <span className="practice-status is-new">Chưa đủ dữ liệu</span>;
  return (
    <span className={`practice-status ${needsPractice ? "is-weak" : "is-good"}`}>
      {needsPractice ? "Ưu tiên ôn tập" : "Đang ổn"}
      {score !== null && score !== undefined && ` · ${formatPercent(score)}`}
    </span>
  );
}

export default function ExamPracticePage() {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    studentPracticeApi
      .plan()
      .then((response) => active && setPlan(response))
      .catch((cause) => active && setError(apiError(cause, "Không thể tải kế hoạch ôn tập")));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <main className="container py-5">
        <ErrorState error={error} actions={[{ label: "Khóa học của tôi", to: "/courses" }]} />
      </main>
    );
  }
  if (!plan) return <LoadingState />;

  const readingHasData = plan.readingSkills.some((skill) => skill.hasAssessmentData);
  const speakingHasData = plan.speakingSkills.some((skill) => skill.gradedSubmissionCount > 0);

  return (
    <main className="container py-5 student-practice-page">
      <header className="student-practice-hero">
        <div>
          <p className="student-practice-kicker">ÔN LUYỆN CÁ NHÂN HÓA</p>
          <h1>Kế hoạch ôn Reading & Speaking</h1>
          <p>
            Hệ thống tổng hợp kết quả chính thức và chọn bài đang mở trong các khóa học bạn tham
            gia. Bài luyện không thay đổi điểm đánh giá.
          </p>
        </div>
        <div className="student-practice-hero-mark" aria-hidden="true">
          ƯU TIÊN
        </div>
      </header>

      <section className="student-practice-section">
        <div className="student-practice-section-heading">
          <div>
            <span className="student-practice-overline">01 · ĐỌC HIỂU</span>
            <h2>Luyện Reading theo kỹ năng</h2>
            <p>
              Tỷ lệ đúng được tổng hợp từ các lượt đánh giá chính thức. Chọn đề để luyện những câu
              cùng kỹ năng từ các bài đã được mở cho bạn.
            </p>
          </div>
          {!readingHasData && (
            <span className="practice-data-note">
              Hoàn thành bài đánh giá để cá nhân hóa gợi ý.
            </span>
          )}
        </div>

        {plan.readingSkills.length === 0 ? (
          <div className="student-practice-empty">
            Chưa có bài Reading được mở trong các khóa học bạn đang tham gia.
          </div>
        ) : (
          <div className="student-practice-skill-grid">
            {plan.readingSkills.map((skill) => (
              <article
                className={`student-practice-card ${skill.needsPractice ? "is-priority" : ""}`}
                key={skill.skillType}
              >
                <div className="student-practice-card-head">
                  <div>
                    <h3>{skill.label}</h3>
                    <small>
                      {skill.hasAssessmentData
                        ? `${skill.correct}/${skill.total} câu đúng ở bài đánh giá`
                        : "Chưa có lượt đánh giá cho kỹ năng này"}
                    </small>
                  </div>
                  <SkillStatus
                    score={skill.score}
                    hasData={skill.hasAssessmentData}
                    needsPractice={skill.needsPractice}
                  />
                </div>
                <div className="student-practice-activity-list">
                  {skill.activities.map((activity) => (
                    <div className="student-practice-activity" key={activity.activityId}>
                      <div>
                        <strong>{activity.title}</strong>
                        <span>
                          {activity.courseTitle} · {activity.questionCount} câu thuộc kỹ năng này
                        </span>
                      </div>
                      <Link
                        className="btn btn-outline-primary btn-sm"
                        to={`/reading/${activity.activityId}?practiceSkill=${skill.skillType}`}
                      >
                        Luyện đề
                      </Link>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="student-practice-section">
        <div className="student-practice-section-heading">
          <div>
            <span className="student-practice-overline">02 · NÓI</span>
            <h2>Luyện Speaking theo barem</h2>
            <p>
              Điểm trung bình các bài đã được giáo viên chấm giúp xác định tiêu chí cần ôn. Bản ghi
              trong chế độ tự luyện chỉ phát trên thiết bị của bạn, không nộp cho giáo viên.
            </p>
          </div>
          {!speakingHasData && (
            <span className="practice-data-note">
              Chưa có bài Speaking được chấm; các đề dưới đây dùng để tự luyện chung.
            </span>
          )}
        </div>

        {plan.speakingSkills.every((skill) => skill.activities.length === 0) ? (
          <div className="student-practice-empty">
            Chưa có đề Speaking được mở trong các khóa học bạn đang tham gia.
          </div>
        ) : (
          <div className="student-practice-skill-grid speaking-practice-grid">
            {plan.speakingSkills.map((skill) => (
              <article
                className={`student-practice-card ${skill.needsPractice ? "is-priority" : ""}`}
                key={skill.criterion}
              >
                <div className="student-practice-card-head">
                  <div>
                    <h3>{skill.label}</h3>
                    <small>
                      {skill.gradedSubmissionCount
                        ? `Điểm trung bình từ ${skill.gradedSubmissionCount} bài đã chấm`
                        : "Chưa có dữ liệu chấm cho tiêu chí này"}
                    </small>
                  </div>
                  <SkillStatus
                    score={skill.averageScore}
                    hasData={skill.gradedSubmissionCount > 0}
                    needsPractice={skill.needsPractice}
                  />
                </div>
                <div className="student-practice-activity-list">
                  {skill.activities.map((activity) => (
                    <div className="student-practice-activity" key={activity.activityId}>
                      <div>
                        <strong>{activity.title}</strong>
                        <span>{activity.courseTitle}</span>
                      </div>
                      <Link
                        className="btn btn-outline-primary btn-sm"
                        to={`/speaking/${activity.activityId}?practice=1&criterion=${skill.criterion}`}
                      >
                        Tự luyện
                      </Link>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="student-practice-footnote">
        <strong>Cách đọc điểm yếu:</strong> Reading và Speaking dùng kết quả đánh giá/chấm đã lưu;
        tiêu chí dưới 70% được gợi ý ưu tiên. Đây là ngưỡng hỗ trợ ôn tập, không phải kết luận năng
        lực tuyệt đối. Hãy làm thêm bài mới để có dữ liệu đáng tin cậy hơn.
        <span>
          {plan.readingSkills.length + plan.speakingSkills.length > 0 &&
            ` Gợi ý hiện có: ${formatNumber(plan.readingSkills.length)} nhóm Reading và ${formatNumber(plan.speakingSkills.length)} tiêu chí Speaking.`}
        </span>
      </aside>
    </main>
  );
}
