import { Link } from "react-router-dom";
import Icon from "../common/Icon";

/** Thẻ "Học tiếp" duy nhất của trang khóa học. next = findNextLesson(weeks). */
export default function ContinueCard({ next, stats }) {
  if (next) {
    const { week, lesson } = next;
    return (
      <section className="sc-continue" aria-label="Học tiếp">
        <div className="sc-continue-main">
          <span className="sc-continue-kicker">
            Tiếp theo · Tuần {week.weekNumber} · Bài {lesson.sortOrder}
          </span>
          <h2 className="sc-continue-title">{lesson.title}</h2>
        </div>
        <Link className="btn btn-primary btn-lg sc-continue-btn" to={`/lessons/${lesson.id}`}>
          Học tiếp →
        </Link>
      </section>
    );
  }

  if (stats.allDone) {
    return (
      <section className="sc-continue is-done" aria-label="Hoàn thành khóa học">
        <span className="sc-continue-icon" aria-hidden="true">
          <Icon name="sparkle" size={24} />
        </span>
        <div className="sc-continue-main">
          <h2 className="sc-continue-title">Bạn đã hoàn thành khóa học</h2>
          <p className="sc-continue-note">Xem lại kết quả các bài kiểm tra của bạn.</p>
        </div>
        <Link className="btn btn-primary btn-lg sc-continue-btn" to="/results">
          Xem kết quả →
        </Link>
      </section>
    );
  }

  if (!stats.total) return null;

  // Các bài còn lại đều đang khóa (chờ hoàn thành bài trước).
  return (
    <section className="sc-continue is-waiting" aria-label="Bài tiếp theo chưa mở">
      <span className="sc-continue-icon" aria-hidden="true">
        <Icon name="lock" size={22} />
      </span>
      <div className="sc-continue-main">
        <h2 className="sc-continue-title">Bài tiếp theo chưa mở</h2>
        <p className="sc-continue-note">Hoàn thành bài trước để mở</p>
      </div>
    </section>
  );
}
