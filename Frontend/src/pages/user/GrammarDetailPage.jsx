import { useEffect, useState } from "react";
import LoadingState from "../../components/common/LoadingState";
import { useSuccessToast } from "../../components/common/Toast";
import { useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import MaterialShell from "../../components/learning/MaterialShell";
import GrammarContents from "../../components/grammar/GrammarContents";
import { grammarApi } from "../../services/learningContentService";
import { apiError } from "../../utils/apiError";

const fallback = { to: "/courses", label: "Khóa học của tôi" };

export default function GrammarDetailPage() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [state, setState] = useState({ loading: true, working: false, error: "", message: "" });
  useSuccessToast(state.message);

  function load() {
    setState((s) => ({ ...s, loading: true, error: "", loadError: null }));
    grammarApi
      .get(id)
      .then(setTopic)
      .catch((e) => setState((s) => ({ ...s, loadError: apiError(e, "Không thể tải chủ đề") })))
      .finally(() => setState((s) => ({ ...s, loading: false })));
  }
  useEffect(load, [id]);

  async function complete() {
    setState((s) => ({ ...s, working: true, error: "" }));
    try {
      const p = await grammarApi.complete(id);
      setTopic((t) => ({ ...t, progressStatus: p.status, progressPercent: p.progressPercent }));
      setState((s) => ({ ...s, working: false, message: "Đã hoàn thành chủ đề ngữ pháp" }));
    } catch (e) {
      setState((s) => ({
        ...s,
        working: false,
        error: e.response?.data?.message || "Không thể cập nhật tiến độ",
      }));
    }
  }

  if (state.loading) return <LoadingState />;
  if (!topic)
    return (
      <main className="container py-5">
        <ErrorState error={state.loadError} onRetry={load} actions={[fallback]} />
      </main>
    );

  return (
    <MaterialShell
      lessonId={topic.lessonId}
      type="GRAMMAR"
      materialId={topic.id}
      title={topic.title}
      fallback={fallback}
    >
      <main className="container py-4 content-shell">
        <header className="content-detail-header">
          <h1>{topic.title}</h1>
          <p>{topic.description}</p>
        </header>
        <GrammarContents contents={topic.contents} />
        {!topic.contents.length && (
          <div className="empty-content">Nội dung đang được cập nhật.</div>
        )}
        {state.error && <div className="alert alert-danger mt-3">{state.error}</div>}
        <div className="text-end mt-4">
          <button
            className="btn btn-success btn-lg"
            onClick={complete}
            disabled={state.working || topic.progressStatus === "COMPLETED"}
          >
            {topic.progressStatus === "COMPLETED"
              ? "Đã hoàn thành"
              : state.working
                ? "Đang lưu…"
                : "Đánh dấu hoàn thành"}
          </button>
        </div>
      </main>
    </MaterialShell>
  );
}
