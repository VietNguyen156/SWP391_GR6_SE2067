import { Link } from "react-router-dom";

/**
 * Hero giới thiệu khóa học cho học viên CHƯA tham gia lớp (đã tham gia thì trang dùng header gọn).
 * Không đặt pill "x tuần" cạnh mô tả: mô tả do giáo viên viết có thể ghi số tuần khác số tuần
 * đang hiển thị.
 */
export default function CourseHero({ course }) {
  return (
    <section className="sc-hero">
      <div className="container sc-hero-inner">
        <div className="sc-hero-main">
          <Link className="sc-hero-back" to="/courses">
            ← Tất cả khóa học
          </Link>
          <span className="sc-hero-badge">Lộ trình TOEIC</span>
          <h1 className="sc-hero-title">{course.title}</h1>
          <p className="sc-hero-desc">
            {course.description || "Khóa học đang được giáo viên cập nhật nội dung."}
          </p>
          <ul className="sc-hero-facts">
            <li>
              Mục tiêu <b>{course.targetScore || "—"}</b>
            </li>
            <li>
              GV <b>{course.teacherName || "—"}</b>
            </li>
          </ul>
        </div>

        <div className="sc-hero-side">
          <div className="sc-hero-cover">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt="" />
            ) : (
              <div className="course-placeholder-art">
                <span>TP</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
