import { useEffect, useMemo, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { formatDate } from "../../utils/format";
import { useSuccessToast } from "../../components/common/Toast";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useConfirm } from "../../components/common/ConfirmDialog";
import {
  LockedPreview,
  PendingOrderBanner,
  PurchaseCard,
} from "../../components/course/CoursePurchase";
import { orderApi } from "../../services/orderService";
import ErrorState from "../../components/common/ErrorState";
import ContinueCard from "../../components/course/ContinueCard";
import CourseHero from "../../components/course/CourseHero";
import CourseRoadmap from "../../components/course/CourseRoadmap";
import { getCourse, getStudentCurriculum } from "../../services/courseService";
import { classroomApi } from "../../services/classroomService";
import { classStatusLabel } from "../../utils/statusLabels";
import { courseStats, findNextLesson } from "../../utils/studentCurriculum";
import { finalTestApi } from "../../services/finalTestService";

export default function CourseDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [course, setCourse] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [purchase, setPurchase] = useState(null);
  const [finalTest, setFinalTest] = useState(null);
  const [buying, setBuying] = useState(false);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [error, setError] = useState("");
  const [classState, setClassState] = useState({
    loading: true,
    joiningId: null,
    error: "",
    message: "",
  });
  useSuccessToast(classState.message);

  const joinedCourseClass = useMemo(
    () => myClasses.find((item) => String(item.courseId) === String(id)) || null,
    [myClasses, id],
  );
  // Lộ trình từ /student/curriculum chỉ gồm tuần và bài đang hiển thị với học viên, nên mọi con số
  // dưới đây (x/y bài, bài tiếp theo) là số đang hiển thị, khớp với những gì học viên thấy.
  const visibleProgress = useMemo(() => courseStats(weeks), [weeks]);
  const nextLesson = useMemo(() => findNextLesson(weeks), [weeks]);

  async function loadBase() {
    const [courseData, classData, joinedData, purchaseData] = await Promise.all([
      getCourse(id),
      classroomApi.courseClasses(id),
      classroomApi.studentList(),
      orderApi.purchase(id),
    ]);
    setCourse(courseData);
    setPurchase(purchaseData);
    setClasses(classData);
    setMyClasses(joinedData);
    setClassState((current) => ({ ...current, loading: false }));
    return joinedData.find((item) => String(item.courseId) === String(id)) || null;
  }

  async function loadCurriculum() {
    try {
      setWeeks(await getStudentCurriculum(id));
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Không thể tải lộ trình học");
    }
  }

  useEffect(() => {
    let active = true;
    setError("");
    setWeeks([]);
    loadBase()
      .then((joined) => {
        if (active && joined) return loadCurriculum();
        return null;
      })
      .catch((e) => {
        if (active) {
          setError(e.response?.data?.message || "Không thể tải khóa học");
          setClassState((current) => ({ ...current, loading: false }));
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    finalTestApi
      .studentInfo(id)
      .then(setFinalTest)
      .catch(() => setFinalTest(null));
  }, [id]);

  // Link cũ ?week=<id> (trước khi bỏ thanh tab tuần): cuộn tới tuần đó khi lộ trình đã tải.
  const legacyWeek = params.get("week");
  useEffect(() => {
    if (legacyWeek && weeks.length)
      document.getElementById(`sc-week-${legacyWeek}`)?.scrollIntoView({ block: "start" });
  }, [legacyWeek, weeks]);

  async function buy() {
    setBuying(true);
    setClassState((current) => ({ ...current, error: "", message: "" }));
    try {
      const order = await orderApi.create(id);
      if (order.status === "PAID") {
        setPurchase(await orderApi.purchase(id));
        setClassState((current) => ({
          ...current,
          message: "Bạn đã nhận khóa học miễn phí. Hãy chọn một lớp để bắt đầu.",
        }));
      } else {
        navigate(`/orders/${order.orderCode}`);
      }
    } catch (e) {
      setClassState((current) => ({
        ...current,
        error: e.response?.data?.message || "Không thể tạo đơn hàng",
      }));
    } finally {
      setBuying(false);
    }
  }

  async function chooseClass(classroom) {
    const ok = await confirm({
      title: `Tham gia lớp ${classroom.className}?`,
      message:
        "Bạn sẽ không thể đổi lớp sau khi tham gia. Hãy kiểm tra lịch học và giảng viên trước khi xác nhận.",
      confirmLabel: "Tham gia lớp",
    });
    if (!ok) return;
    setClassState({ loading: false, joiningId: classroom.id, error: "", message: "" });
    try {
      await classroomApi.join(classroom.id);
      const [available, joined] = await Promise.all([
        classroomApi.courseClasses(id),
        classroomApi.studentList(),
      ]);
      setClasses(available);
      setMyClasses(joined);
      await loadCurriculum();
      setClassState({
        loading: false,
        joiningId: null,
        error: "",
        message: `Bạn đã tham gia lớp ${classroom.className} thành công.`,
      });
    } catch (e) {
      setClassState({
        loading: false,
        joiningId: null,
        error: e.response?.data?.message || "Không thể tham gia lớp học",
        message: "",
      });
    }
  }

  if (error && !course) {
    return (
      <main className="container py-5">
        <ErrorState message={error} actions={[{ label: "Danh sách khóa học", to: "/courses" }]} />
      </main>
    );
  }
  if (!course) {
    return <LoadingState />;
  }

  return (
    <main className="sc-page">
      {joinedCourseClass ? (
        <JoinedHeader course={course} joined={joinedCourseClass} progress={visibleProgress} />
      ) : (
        <CourseHero course={course} />
      )}

      <div className="container sc-body">
        {!joinedCourseClass && purchase && !purchase.purchased && (
          <div className="sc-join">
            {purchase.openOrder && <PendingOrderBanner order={purchase.openOrder} />}
            {classState.error && <div className="alert alert-danger">{classState.error}</div>}
            <div className="sc-buy-layout">
              <LockedPreview weeks={purchase.preview} />
              <PurchaseCard purchase={purchase} busy={buying} onBuy={buy} />
            </div>
          </div>
        )}

        {!joinedCourseClass && purchase?.purchased && (
          <section className="sc-join" aria-labelledby="sc-join-title">
            <header className="sc-section-head">
              <h2 id="sc-join-title">Bạn đã mua khóa học, hãy chọn một lớp</h2>
              <p>Mỗi khóa học chỉ chọn một lớp và không thể đổi lớp sau khi tham gia.</p>
            </header>
            {classState.error && <div className="alert alert-danger">{classState.error}</div>}
            {!classState.loading && !purchase.hasOpenClass && (
              <div className="alert alert-info">
                Đang chờ lớp mới, bạn đã có quyền học khóa này. Lớp mới mở sẽ hiện tại đây.
              </div>
            )}
            {classState.loading ? (
              <div className="py-4 text-center">
                <div className="spinner-border text-primary" role="status" aria-label="Đang tải" />
              </div>
            ) : classes.length ? (
              <ul className="sc-class-grid">
                {classes.map((classroom) => {
                  const full =
                    classroom.maxStudents != null &&
                    classroom.studentCount >= classroom.maxStudents;
                  const joining = classState.joiningId === classroom.id;
                  return (
                    <li key={classroom.id}>
                      <article className="sc-class-card">
                        <div className="sc-class-top">
                          <span
                            className={`class-status ${String(classroom.status || "").toLowerCase()}`}
                          >
                            {classStatusLabel(classroom.status)}
                          </span>
                          <small>{classroom.classCode}</small>
                        </div>
                        <h3>{classroom.className}</h3>
                        <p>{classroom.description || "Lớp học thuộc khóa học này."}</p>
                        <ul className="sc-class-meta">
                          <li>GV: {classroom.teacherName || course.teacherName}</li>
                          <li>
                            {classroom.studentCount}/{classroom.maxStudents ?? "∞"} học viên
                          </li>
                          <li>
                            {formatDate(classroom.startDate)} – {formatDate(classroom.endDate)}
                          </li>
                        </ul>
                        <button
                          className="btn btn-primary w-100"
                          disabled={full || joining || classState.joiningId != null}
                          onClick={() => chooseClass(classroom)}
                        >
                          {joining
                            ? "Đang tham gia…"
                            : full
                              ? "Lớp đã đủ học viên"
                              : "Tham gia lớp"}
                        </button>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        )}

        {joinedCourseClass && (
          <>
            <ContinueCard next={nextLesson} stats={visibleProgress} />
            {error && <div className="alert alert-danger sc-alert">{error}</div>}
            {weeks.length ? (
              <CourseRoadmap weeks={weeks} next={nextLesson} />
            ) : (
              !error && <div className="content-empty">Giảng viên chưa công bố tuần học nào.</div>
            )}
            {finalTest?.exists && (
              <section className="card p-3 p-md-4 mt-4">
                <h2 className="h5">Test cuối khóa</h2>
                <p className="text-muted">
                  {finalTest.title} · {finalTest.timeLimitMinutes} phút
                </p>
                {finalTest.eligible || finalTest.attempt?.id ? (
                  <Link className="btn btn-primary align-self-start" to={`/courses/${id}/test`}>
                    {finalTest.attempt?.status === "IN_PROGRESS"
                      ? "Tiếp tục Test"
                      : finalTest.attempt?.id
                        ? "Xem kết quả"
                        : "Mở Test"}
                  </Link>
                ) : (
                  <p className="mb-0">Hoàn thành khóa học để mở Test.</p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/** Header gọn khi đã tham gia lớp: tên khóa, lớp · GV, một thanh tiến độ "x/y bài". */
function JoinedHeader({ course, joined, progress }) {
  return (
    <header className="container cr-head">
      <div className="cr-head-main">
        <Link className="cr-back" to="/courses">
          ← Khóa học của tôi
        </Link>
        <h1 className="cr-course">{course.title}</h1>
        <p className="cr-class">
          <Link to={`/student/classes/${joined.id}`}>{joined.className}</Link> · GV{" "}
          {joined.teacherName || course.teacherName || "—"}
        </p>
      </div>
      <div
        className="cr-progress"
        role="progressbar"
        aria-label="Tiến độ khóa học"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.completed}
      >
        <span className="cr-progress-track">
          <span style={{ width: `${progress.percent}%` }} />
        </span>
        <span className="cr-progress-text">
          {progress.completed}/{progress.total} bài
        </span>
      </div>
    </header>
  );
}
