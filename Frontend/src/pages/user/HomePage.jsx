import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Icon from "../../components/common/Icon";
import MaterialIcon from "../../components/course/MaterialIcon";
import { HoverLift } from "../../components/animations/MotionWrappers";
import { useGsap, useGsapScrollReveal } from "../../hooks/useGsap";
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
    title: "Test cuối khóa",
    description:
      "Hoàn thành lộ trình rồi làm bài kiểm tra tổng hợp Listening, Reading và Speaking.",
  },
  {
    title: "Theo dõi tiến độ",
    description: "Lưu điểm, lịch sử làm bài và các câu sai để tập trung ôn đúng chỗ.",
  },
];

// Các loại học liệu có thật trong một bài học.
const materials = [
  ["GRAMMAR", "Ngữ pháp", "Lý thuyết, ví dụ, kèm tài liệu và video"],
  ["FLASHCARD", "Flashcards", "Từ vựng theo chủ đề công sở"],
  ["LISTENING", "Listening", "Audio Part 1–4 kèm câu hỏi"],
  ["READING", "Reading", "Đoạn văn Part 6–7, xem lại căn cứ đáp án"],
  ["SPEAKING", "Speaking", "Ghi âm câu trả lời, giảng viên chấm"],
];

// Lộ trình học 4 giai đoạn bứt phá TOEIC
const roadmapSteps = [
  {
    step: "01",
    tag: "Tuần 1 – 3",
    title: "Khởi động & Củng cố nền tảng",
    description:
      "Hệ thống hóa 12 chủ điểm ngữ pháp trọng tâm và 600 từ vựng cốt lõi qua Flashcard 3D thông minh.",
  },
  {
    step: "02",
    tag: "Tuần 4 – 7",
    title: "Phản xạ Nghe & Kỹ thuật Đọc hiểu",
    description:
      "Rèn luyện phản xạ bắt âm Part 1–4 Listening và kỹ năng định vị từ khóa Part 5–7 Reading với dẫn chứng giải thích rõ ràng.",
  },
  {
    step: "03",
    tag: "Tuần 8 – 10",
    title: "Chiến thuật làm bài & Chấm chữa",
    description:
      "Thực hành tương tác Speaking, giải quyết các dạng bẫy trắc nghiệm TOEIC và nhận nhận xét cải thiện từ giảng viên.",
  },
  {
    step: "04",
    tag: "Tuần 11 – 12",
    title: "Luyện đề thực chiến & Cán mốc mục tiêu",
    description:
      "Thi thử Full Test chuẩn format IIG dưới áp lực thời gian, khắc phục điểm yếu và tối ưu hóa điểm số bứt phá 750+.",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const timelineRef = useRef(null);
  const methodRef = useRef(null);
  const closeRef = useRef(null);

  // 1. GSAP Hero Entrance Timeline
  useGsap(heroRef, (isReduced) => {
    if (isReduced) return;
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(".home-intro-copy h1", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 })
      .fromTo(
        ".home-intro-copy .home-lede",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55 },
        "-=0.35",
      )
      .fromTo(
        ".home-actions > *",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.1 },
        "-=0.3",
      )
      .fromTo(".home-lesson", { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.65 }, "-=0.4")
      .fromTo(
        ".home-lesson li",
        { opacity: 0, x: 16 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.06 },
        "-=0.3",
      );
  });

  // 3. GSAP ScrollTrigger reveals for Timeline, learning method and closing CTA
  useGsapScrollReveal(timelineRef, ".home-timeline-step", {
    y: 32,
    stagger: 0.16,
    duration: 0.65,
  });
  useGsapScrollReveal(methodRef, ".home-method-list > div", { y: 26, stagger: 0.1 });
  useGsapScrollReveal(closeRef, ".home-close > *", { y: 20, stagger: 0.12 });

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
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="container home-intro"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div className="home-intro-copy" style={{ position: "relative", zIndex: 1 }}>
          <h1>Học TOEIC có hệ thống, tiến bộ mỗi ngày.</h1>
          <p className="home-lede">
            Lý thuyết, Flashcard, bài luyện và Test cuối khóa tạo thành một hành trình học rõ ràng,
            giúp bạn chạm mục tiêu nhanh hơn.
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

        <aside
          className="home-lesson"
          aria-labelledby="home-lesson-title"
          style={{ position: "relative", zIndex: 1 }}
        >
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

      {/* Lộ trình học Timeline Section with GSAP ScrollTrigger */}
      <section
        ref={timelineRef}
        className="container home-timeline-section"
        aria-labelledby="home-timeline-title"
      >
        <div className="home-timeline-header">
          <span className="home-timeline-tag">Lộ trình bứt phá</span>
          <h2 id="home-timeline-title">Lộ trình học 4 giai đoạn chuẩn hóa TOEIC</h2>
          <p>
            Thiết kế khoa học theo từng tuần, giúp bạn nắm vững kiến thức từ gốc đến làm chủ đề thi
            thực chiến.
          </p>
        </div>
        <div className="home-timeline">
          {roadmapSteps.map((step) => (
            <div key={step.step} className="home-timeline-step">
              <div className="home-timeline-badge">{step.step}</div>
              <div className="home-timeline-card">
                <span className="home-timeline-tag">{step.tag}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Method Section with GSAP Scroll Reveal & Motion Hover */}
      <section
        ref={methodRef}
        className="container home-method"
        aria-labelledby="home-method-title"
      >
        <h2 id="home-method-title">Mọi công cụ bạn cần để chinh phục TOEIC</h2>
        <p className="home-method-lede">
          Một phương pháp học liền mạch, khoa học và được thiết kế để tạo ra tiến bộ thật.
        </p>
        <dl className="home-method-list">
          {method.map((item) => (
            <HoverLift key={item.title}>
              <div>
                <dt>{item.title}</dt>
                <dd>{item.description}</dd>
              </div>
            </HoverLift>
          ))}
        </dl>
      </section>

      {/* Final Call to Action */}
      <section ref={closeRef} className="container home-close">
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
