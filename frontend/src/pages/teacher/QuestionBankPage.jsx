import PageTabs, { useTab } from "../../components/common/PageTabs";
import QuestionManagementPage from "./QuestionManagementPage";
import QuizManagementPage from "./QuizManagementPage";

const TABS = [
  { key: "questions", label: "Câu hỏi" },
  { key: "quizzes", label: "Quiz" },
];

/** Ngân hàng câu hỏi: tab Câu hỏi và tab Quiz (đề được ghép từ câu hỏi). */
export default function QuestionBankPage() {
  const tab = useTab(TABS);
  return (
    <>
      <PageTabs tabs={TABS} label="Ngân hàng câu hỏi" />
      {tab === "quizzes" ? <QuizManagementPage /> : <QuestionManagementPage />}
    </>
  );
}
