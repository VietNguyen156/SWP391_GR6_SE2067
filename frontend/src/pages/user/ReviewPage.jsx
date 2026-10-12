import { useEffect, useState } from "react";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { Link } from "react-router-dom";
import { flashcardApi, reviewApi } from "../../services/learningContentService";

const GRAMMAR_PROGRESS = { COMPLETED: "Đã học", LEARNING: "Đang học", NOT_STARTED: "Chưa học" };

/** "TOEIC 600+ Foundation · Tuần 1 · Bài 2" */
const placeLine = (item) =>
  item.courseTitle ? `${item.courseTitle} · Tuần ${item.weekNumber} · Bài ${item.lessonNo}` : "";

/**
 * Ôn tập: bộ flashcard cá nhân và các học liệu đã mở trong khóa học (Ngữ pháp, Flashcards).
 * Dữ liệu lấy từ một endpoint gộp; backend đã lọc bỏ bài khóa / ẩn / chưa ghi danh.
 */
export default function ReviewPage() {
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: "", actionError: "" });

  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setData(await reviewApi.get());
      setState({ loading: false, error: "", actionError: "" });
    } catch (error) {
      setState({
        loading: false,
        error: error.response?.data?.message || error.message,
        actionError: "",
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(item) {
    if (
      !(await confirm({
        message: `Xóa bộ “${item.title}”?`,
        title: "Xóa bộ flashcard",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await flashcardApi.personalDelete(item.id);
      await load();
    } catch (error) {
      setState((current) => ({
        ...current,
        actionError: error.response?.data?.message || "Không thể xóa bộ flashcard",
      }));
    }
  }

  return (
    <main className="container py-5 content-shell">
      <header className="content-hero flashcard-theme">
        <h1>Ôn tập</h1>
        <p>Bộ flashcard của riêng bạn và các học liệu đã mở trong khóa học.</p>
      </header>

      {state.actionError && <div className="alert alert-danger">{state.actionError}</div>}

      {state.loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" aria-label="Đang tải" />
        </div>
      ) : state.error ? (
        <div className="alert alert-danger d-flex flex-wrap align-items-center gap-3" role="alert">
          <span className="flex-grow-1">Không tải được dữ liệu ôn tập: {state.error}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={load}>
            Thử lại
          </button>
        </div>
      ) : (
        <>
          <section className="mb-5">
            <div className="d-flex justify-content-between align-items-end gap-3 mb-3">
              <h2 className="h4 fw-bold mb-0">Bộ flashcard của tôi</h2>
              <Link className="btn btn-outline-primary" to="/flashcards/personal/new">
                + Tạo mới
              </Link>
            </div>
            {data.personalFlashcardSets.length ? (
              <div className="row g-4">
                {data.personalFlashcardSets.map((item) => (
                  <div className="col-md-6 col-xl-4" key={item.id}>
                    <article className="learning-tile h-100">
                      <span className="badge text-bg-warning">Cá nhân</span>
                      <h2>{item.title}</h2>
                      <div className="small text-secondary mb-3">
                        Đã ôn {item.reviewedCount}/{item.cardCount} thẻ
                      </div>
                      <div className="d-flex gap-2">
                        <Link className="btn btn-primary flex-grow-1" to={`/flashcards/${item.id}`}>
                          Học ngay
                        </Link>
                        <Link
                          className="btn btn-outline-secondary"
                          to={`/flashcards/personal/${item.id}/edit`}
                        >
                          Sửa
                        </Link>
                        <button className="btn btn-outline-danger" onClick={() => remove(item)}>
                          Xóa
                        </button>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            ) : (
              <div className="content-empty">Bạn chưa tạo bộ flashcard cá nhân nào.</div>
            )}
          </section>

          <section className="mb-5">
            <h2 className="h4 fw-bold mb-3">Ngữ pháp đã mở</h2>
            {data.grammar.length ? (
              <div className="row g-4">
                {data.grammar.map((item) => (
                  <div className="col-md-6 col-xl-4" key={item.id}>
                    <article className="learning-tile h-100">
                      <span className="badge text-bg-light">
                        {GRAMMAR_PROGRESS[item.progressStatus] || "Chưa học"}
                      </span>
                      <h2>{item.title}</h2>
                      <p className="small text-secondary">{placeLine(item)}</p>
                      <Link className="btn btn-outline-primary w-100" to={`/grammar/${item.id}`}>
                        Ôn lại
                      </Link>
                    </article>
                  </div>
                ))}
              </div>
            ) : (
              <div className="content-empty">Chưa có chủ đề ngữ pháp nào được mở.</div>
            )}
          </section>

          <section>
            <h2 className="h4 fw-bold mb-3">Flashcards đã mở</h2>
            {data.flashcardSets.length ? (
              <div className="row g-4">
                {data.flashcardSets.map((item) => (
                  <div className="col-md-6 col-xl-4" key={item.id}>
                    <article className="learning-tile h-100">
                      <span className="badge text-bg-light">
                        Đã ôn {item.reviewedCount}/{item.cardCount} thẻ
                      </span>
                      <h2>{item.title}</h2>
                      <p className="small text-secondary">{placeLine(item)}</p>
                      <Link className="btn btn-primary w-100" to={`/flashcards/${item.id}`}>
                        Học ngay
                      </Link>
                    </article>
                  </div>
                ))}
              </div>
            ) : (
              <div className="content-empty">Chưa có bộ flashcard nào của khóa học được mở.</div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
