import { useSearchParams } from "react-router-dom";

/** Tab đầu trang lưu trong `?tab=`; tab đầu tiên là mặc định. Trả về key của tab đang mở. */
export function useTab(tabs) {
  const [params] = useSearchParams();
  const key = params.get("tab");
  return tabs.some((tab) => tab.key === key) ? key : tabs[0].key;
}

export default function PageTabs({ tabs, label }) {
  const [, setParams] = useSearchParams();
  const current = useTab(tabs);
  return (
    <div className="container pt-4">
      <div className="sc-filter mb-0" role="tablist" aria-label={label}>
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={current === tab.key}
            className={`sc-filter-chip ${current === tab.key ? "is-on" : ""}`}
            onClick={() => setParams(index === 0 ? {} : { tab: tab.key }, { replace: true })}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
