import Icon from "./Icon.jsx";

const MATERIAL_MAP = {
  grammar: { icon: "grammar", label: "Ngữ pháp" },
  flashcards: { icon: "cards", label: "Flashcards" },
  flashcard: { icon: "cards", label: "Flashcards" },
  listening: { icon: "audio", label: "Listening" },
  reading: { icon: "reading", label: "Reading" },
  speaking: { icon: "mic", label: "Speaking" },
};

/**
 * Icon chuẩn cho 5 loại học liệu:
 * Cùng sử dụng màu --primary, phân biệt nhận diện bằng hình icon.
 */
export default function MaterialIcon({
  type,
  size = 20,
  variant = "inline", // "inline" | "badge" | "tile"
  className = "",
}) {
  const meta = MATERIAL_MAP[type?.toLowerCase()] || { icon: "book", label: "Học liệu" };

  if (variant === "badge") {
    return (
      <span
        className={`material-icon-badge ${className}`}
        title={meta.label}
        aria-label={meta.label}
      >
        <Icon name={meta.icon} size={size} />
      </span>
    );
  }

  if (variant === "tile") {
    return (
      <span
        className={`material-icon-tile ${className}`}
        title={meta.label}
        aria-label={meta.label}
      >
        <Icon name={meta.icon} size={size} />
      </span>
    );
  }

  return (
    <span
      className={`material-icon-inline ${className}`}
      title={meta.label}
      aria-label={meta.label}
    >
      <Icon name={meta.icon} size={size} />
    </span>
  );
}
