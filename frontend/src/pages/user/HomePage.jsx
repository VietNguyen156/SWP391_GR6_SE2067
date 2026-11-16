import { Link } from "react-router-dom";
import Icon from "../../components/common/Icon";
import MaterialIcon from "../../components/course/MaterialIcon";
import { useAuth } from "../../contexts/AuthContext";

// Cách học trên TOEIC Path (nội dung giữ từ trang cũ, trình bày như bảng thông số).
const method = [
  {
    title: "Nội dung rõ ràng",
    description: "Học theo Tuần → Bài học → Học liệu, luôn biết chính xác hôm nay cần học gì.",
  },
  {
    title: "Flashcard thông minh",
    description: "Ôn từ vựng TOEIC theo chủ đề và lưu trạng thái đã nhớ, chưa nhớ.",
  },
  {
    title: "Quiz & Practice",
    description: "Kiểm tra ngay sau mỗi bài học và luyện đúng dạng Listening, Reading.",
  },
  {
    title: "Theo dõi tiến độ",
    description: "Lưu điểm, lịch sử làm bài và các câu sai để tập trung ôn đúng chỗ.",
  },
];

// Các loại học liệu có thật trong một bài học.
const materials = [
  ["LECTURE", "Bài giảng", "Video, văn bản hoặc tài liệu của giảng viên"],
  ["GRAMMAR", "Ngữ pháp", "Quy tắc, ví dụ và lỗi thường gặp"],
  ["FLASHCARD", "Flashcards", "Từ vựng theo chủ đề công sở"],
  ["LISTENING", "Listening", "Audio Part 1–4 kèm câu hỏi và transcript"],
  ["SPEAKING", "Speaking", "Ghi âm câu trả lời, giảng viên chấm"],
  ["QUIZ", "Quiz", "Câu hỏi trắc nghiệm, chấm ngay"],
];

export default function HomePage() {
  const { user } = useAuth();
  const workspacePath =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "TEACHER"
        ? "/teacher/dashboard"
        : "/dashboard";
  const profilePath =
    user?.role === "ADMIN"
      ? "/admin/profile"
      : user?.role === "TEACHER"
        ? "/teacher/profile"
        : "/user/profile";

  return (
    <div className="home">
      <section className="container home-intro">
        <div className="home-intro-copy">
          <h1>Học TOEIC có hệ thống, tiến bộ mỗi ngày.</h1>
          <p className="home-lede">
            Lý thuyết, Flashcard, Quiz, bài luyện và Mock Test được kết nối trong một hành trình học
            rõ ràng, giúp bạn chạm mục tiêu nhanh hơn.
          </p>
          <div className="home-actions">
            {user ? (
              <>
                <Link className="btn btn-primary btn-lg" to={workspacePath}>
                  Vào không gian học <Icon name="arrow" size={18} />
                </Link>
                <Link className="btn btn-outline-secondary btn-lg" to={profilePath}>
                  Xem hồ sơ
                </Link>
              </>
            ) : (
              <>
                <Link className="btn btn-primary btn-lg" to="/register">
                  Bắt đầu miễn phí <Icon name="arrow" size={18} />
                </Link>
                <Link className="btn btn-outline-secondary btn-lg" to="/login">
                  Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>

        <aside className="home-lesson" aria-labelledby="home-lesson-title">
          <h2 id="home-lesson-title">Trong mỗi bài học</h2>
          <ul>
            {materials.map(([type, name, detail]) => (
              <li key={type}>
                <MaterialIcon type={type} />
                <span>
                  <strong>{name}</strong>
                  <small>{detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="container home-method" aria-labelledby="home-method-title">
        <h2 id="home-method-title">Mọi công cụ bạn cần để chinh phục TOEIC</h2>
        <p className="home-method-lede">
          Một phương pháp học liền mạch, khoa học và được thiết kế để tạo ra tiến bộ thật.
        </p>
        <dl className="home-method-list">
          {method.map((item) => (
            <div key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="container home-close">
        <div>
          <h2>Sẵn sàng chinh phục mục tiêu TOEIC?</h2>
          <p>Tạo tài khoản miễn phí và bắt đầu bài học đầu tiên chỉ trong vài phút.</p>
        </div>
        {!user ? (
          <Link className="btn btn-primary btn-lg" to="/register">
            Đăng ký miễn phí <Icon name="arrow" size={18} />
          </Link>
        ) : (
          <Link className="btn btn-primary btn-lg" to={workspacePath}>
            Tiếp tục hành trình <Icon name="arrow" size={18} />
          </Link>
        )}
      </section>
    </div>
  );
}
