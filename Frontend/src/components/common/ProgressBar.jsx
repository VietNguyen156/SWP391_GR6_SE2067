/**
 * Thanh tiến độ tuyến tính & Vòng tròn tiến độ đồng nhất.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  showLabel = false,
  label,
  variant = "primary", // "primary" | "accent" | "success"
  size = "md", // "sm" | "md" | "lg"
  className = "",
}) {
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const sizeClass = size === "sm" ? "progress-sm" : size === "lg" ? "progress-lg" : "";

  return (
    <div className={`ui-progress-wrapper ${className}`.trim()}>
      {(showLabel || label) && (
        <div className="ui-progress-header">
          {label && <span className="ui-progress-label">{label}</span>}
          {showLabel && <span className="ui-progress-percent">{percent}%</span>}
        </div>
      )}
      <div
        className={`ui-progress-track ${sizeClass}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin="0"
        aria-valuemax={max}
      >
        <div
          className={`ui-progress-fill ui-progress-${variant}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function ProgressRing({
  value = 0,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = "primary",
  children,
  className = "",
}) {
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`ui-progress-ring-container ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="ui-progress-ring-svg">
        <circle
          className="ui-progress-ring-bg"
          stroke="var(--line)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`ui-progress-ring-circle ui-progress-ring-${variant}`}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="ui-progress-ring-content">{children}</div>}
    </div>
  );
}
