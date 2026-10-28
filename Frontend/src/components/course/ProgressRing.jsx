import { useId } from "react";

/** Vòng tiến độ SVG; tone="dark" khi đặt trên nền gradient. */
export default function ProgressRing({
  percent = 0,
  size = 72,
  stroke = 7,
  tone = "light",
  label,
}) {
  const id = useId();
  const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className={`sc-ring sc-ring-${tone}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label || `Hoàn thành ${value}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="sc-ring-stop-1" />
            <stop offset="1" className="sc-ring-stop-2" />
          </linearGradient>
        </defs>
        <circle
          className="sc-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="sc-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          stroke={`url(#${id}-ring)`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="sc-ring-text">{value}%</span>
    </div>
  );
}
