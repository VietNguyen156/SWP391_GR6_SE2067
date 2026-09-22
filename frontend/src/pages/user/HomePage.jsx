import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const features = [
  { number: "01", icon: "route", title: "Lộ trình rõ ràng", description: "Học theo Chapter và Lesson, luôn biết chính xác hôm nay cần học gì." },
  { number: "02", icon: "cards", title: "Flashcard thông minh", description: "Ôn từ vựng TOEIC theo chủ đề và lưu trạng thái đã nhớ, chưa nhớ." },
  { number: "03", icon: "quiz", title: "Quiz & Practice", description: "Kiểm tra ngay sau mỗi bài học và luyện đúng dạng Listening, Reading." },
  { number: "04", icon: "chart", title: "Theo dõi tiến độ", description: "Lưu điểm, lịch sử làm bài và các câu sai để tập trung ôn đúng chỗ." },
];

const lessons = [
  { label: "Lý thuyết", detail: "Parts of Speech", done: true },
  { label: "Flashcard", detail: "30 từ", done: true },
  { label: "Quiz", detail: "15 câu", done: false },
  { label: "Practice", detail: "Part 5", done: false },
];

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function FeatureIcon({ name }) {
  const paths = {
    route: <><circle cx="5" cy="17" r="2" /><circle cx="19" cy="7" r="2" /><path d="M7 17h3a3 3 0 0 0 3-3v-4a3 3 0 0 1 3-3h1" /><path d="M5 5V2M3.5 3.5h3" /></>,
    cards: <><rect x="4" y="3" width="14" height="18" rx="3" /><path d="M8 8h6M8 12h6M8 16h3" /><path d="M18 6h1a2 2 0 0 1 2 2v10" /></>,
    quiz: <><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="m7 12 3 3 7-7" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /><path d="m4 7 6-5 6 7 6-5" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function HomePage() {
  const { user } = useAuth();
  const workspace = user?.role === "TEACHER" ? "/mentor" : user?.role === "ADMIN" ? "/admin/payments" : "/user/classes";
  const workspaceLabel = user?.role === "TEACHER" ? "Quản lý mentor" : user?.role === "ADMIN" ? "Quản lý học phí" : "Tiếp tục học";

  return <>
    <section className="hero-section">
      <div className="hero-orb hero-orb-one" aria-hidden="true" />
      <div className="hero-orb hero-orb-two" aria-hidden="true" />
      <div className="container hero-container">
        <div className="row align-items-center g-5">
          <div className="col-lg-7 hero-copy">
            <span className="hero-kicker"><span /> TOEIC LEARNING PLATFORM</span>
            <h1>Học TOEIC theo <span>lộ trình</span>,<br className="d-none d-xl-block" /> tiến bộ mỗi ngày.</h1>
            <p className="hero-description">Lý thuyết, Flashcard, Quiz, bài luyện và Mock Test được kết nối trong một hành trình học rõ ràng, giúp bạn chạm mục tiêu nhanh hơn.</p>
            <div className="hero-actions">
              {user ? <>
                <Link className="btn hero-primary-btn" to={workspace}>{workspaceLabel} <ArrowIcon /></Link>
                <Link className="btn hero-secondary-btn" to="/user/profile">Xem hồ sơ</Link>
              </> : <>
                <Link className="btn hero-primary-btn" to="/register">Bắt đầu miễn phí <ArrowIcon /></Link>
                <Link className="btn hero-secondary-btn" to="/login">Đăng nhập</Link>
              </>}
            </div>
            <div className="hero-trust">
              <div className="avatar-stack" aria-hidden="true"><span>AN</span><span>MH</span><span>TL</span></div>
              <div><strong>2.000+ học viên</strong><small>đang học tập mỗi ngày</small></div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="study-card-wrap">
              <div className="card-accent card-accent-one" aria-hidden="true" />
              <div className="card-accent card-accent-two" aria-hidden="true" />
              <article className="study-card">
                <div className="study-card-header">
                  <div><span className="study-eyebrow">LỘ TRÌNH TOEIC 650+</span><h2>Lesson 05 <span>·</span> Part 5</h2></div>
                  <div className="lesson-badge">05</div>
                </div>
                <div className="progress-heading"><span>Tiến độ bài học</span><strong>45%</strong></div>
                <div className="study-progress" role="progressbar" aria-label="Tiến độ bài học" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100"><div style={{ width: "45%" }} /></div>
                <div className="lesson-list">
                  {lessons.map((lesson, index) => <div className={`lesson-row${lesson.done ? " completed" : ""}`} key={lesson.label}>
                    <span className="lesson-status" aria-hidden="true">{lesson.done ? <svg viewBox="0 0 16 16" fill="none"><path d="m4 8.2 2.4 2.4L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : index + 1}</span>
                    <span className="lesson-name"><strong>{lesson.label}</strong><small>{lesson.detail}</small></span>
                    <span className="lesson-action" aria-hidden="true">›</span>
                  </div>)}
                </div>
                <div className="study-card-footer"><div className="streak-icon" aria-hidden="true">✦</div><div><strong>Chuỗi học tập 7 ngày</strong><small>Tiếp tục giữ vững phong độ nhé!</small></div></div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="features-section">
      <div className="container">
        <div className="section-heading">
          <span>TẤT CẢ TRONG MỘT NỀN TẢNG</span>
          <h2>Mọi công cụ bạn cần để<br className="d-none d-md-block" /> chinh phục TOEIC</h2>
          <p>Một phương pháp học liền mạch, khoa học và được thiết kế để tạo ra tiến bộ thật.</p>
        </div>
        <div className="row g-4">
          {features.map((feature) => <div className="col-md-6 col-lg-3" key={feature.number}>
            <article className="feature-card h-100">
              <div className="feature-top"><div className="feature-icon"><FeatureIcon name={feature.icon} /></div><span>{feature.number}</span></div>
              <h3>{feature.title}</h3><p>{feature.description}</p>
            </article>
          </div>)}
        </div>
      </div>
    </section>

    <section className="container cta-section">
      <div className="cta-box">
        <div className="cta-decoration" aria-hidden="true" />
        <div className="row align-items-center position-relative g-4">
          <div className="col-lg-8"><span className="cta-kicker">BẮT ĐẦU NGAY HÔM NAY</span><h2>Sẵn sàng chinh phục mục tiêu TOEIC?</h2><p>Tạo tài khoản miễn phí và bắt đầu bài học đầu tiên chỉ trong vài phút.</p></div>
          <div className="col-lg-4 text-lg-end">{!user ? <Link className="btn cta-button" to="/register">Đăng ký miễn phí <ArrowIcon /></Link> : <Link className="btn cta-button" to={workspace}>{workspaceLabel} <ArrowIcon /></Link>}</div>
        </div>
      </div>
    </section>
  </>;
}
