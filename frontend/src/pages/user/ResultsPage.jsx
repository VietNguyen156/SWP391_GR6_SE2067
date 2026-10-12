import PageTabs, { useTab } from "../../components/common/PageTabs";
import LearningHistoryPage from "./LearningHistoryPage";
import MyOrdersPage from "./MyOrdersPage";
import ProgressPage from "./ProgressPage";
import ResultHistoryPage from "./ResultHistoryPage";

const TABS = [
  { key: "results", label: "Kết quả" },
  { key: "progress", label: "Tiến độ" },
  { key: "history", label: "Lịch sử" },
  { key: "orders", label: "Đơn hàng" },
];

/** Kết quả học tập: kết quả bài làm, tiến độ khóa học và lịch sử hoạt động. */
export default function ResultsPage() {
  const tab = useTab(TABS);
  return (
    <>
      <PageTabs tabs={TABS} label="Kết quả học tập" />
      {tab === "progress" ? (
        <ProgressPage />
      ) : tab === "orders" ? (
        <MyOrdersPage />
      ) : tab === "history" ? (
        <LearningHistoryPage />
      ) : (
        <ResultHistoryPage />
      )}
    </>
  );
}
