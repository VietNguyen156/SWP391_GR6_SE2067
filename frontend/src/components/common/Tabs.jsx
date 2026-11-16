/**
 * Tabs chuyển đổi danh mục:
 * Hỗ trợ cả controlled state (activeKey, onChange) lẫn các biến thể pills hoặc underline.
 */
export default function Tabs({
  items = [],
  activeKey,
  onChange,
  variant = "pills", // "pills" | "underline"
  className = "",
  ariaLabel = "Tabs",
}) {
  return (
    <div
      className={`ui-tabs ui-tabs-${variant} ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            className={`ui-tab-item ${isActive ? "is-active" : ""}`}
            onClick={() => !item.disabled && onChange?.(item.key)}
          >
            {item.icon && <span className="ui-tab-icon me-1-5">{item.icon}</span>}
            <span className="ui-tab-label">{item.label}</span>
            {item.count !== undefined && <span className="ui-tab-count ms-1-5">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
