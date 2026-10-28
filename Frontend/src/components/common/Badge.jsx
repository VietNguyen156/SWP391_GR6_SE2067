/**
 * Badge thông báo / nhãn phân loại đồng nhất.
 * Biến thể: neutral | primary | accent | success | danger
 */
export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
  title,
}) {
  const sizeClass = size === "sm" ? "badge-sm" : "";
  const variantClass = `badge-${variant}`;
  const dotClass = dot ? "badge-has-dot" : "";

  return (
    <span
      className={`ui-badge ${variantClass} ${sizeClass} ${dotClass} ${className}`.trim()}
      title={title}
    >
      {dot && <span className="ui-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
