import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Tabs from "../../components/common/Tabs";
import TestBankList from "../../components/teacher/TestBankList";
import QuestionManagementPage from "./QuestionManagementPage";

const TABS = [
  { key: "question", label: "Questions" },
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "speaking", label: "Speaking" },
];

/**
 * Ngân hàng đề thi: câu hỏi + bài Nghe/Đọc/Nói dùng riêng để dựng Test cuối khóa.
 * Không liên quan tới học liệu của từng tuần/bài học trong khóa.
 */
export default function QuestionBankPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab = TABS.some((t) => t.key === requested) ? requested : "question";
  return (
    <main className="container content-shell">
      <PageHeader title="Ngân hàng đề thi" />
      <Tabs
        items={TABS}
        activeKey={tab}
        onChange={(key) => setParams(key === "question" ? {} : { tab: key }, { replace: true })}
        ariaLabel="Loại nội dung của ngân hàng đề thi"
        variant="underline"
        className="mb-3"
      />
      {tab === "question" ? (
        <QuestionManagementPage embedded />
      ) : (
        <TestBankList key={tab} type={tab} />
      )}
    </main>
  );
}
