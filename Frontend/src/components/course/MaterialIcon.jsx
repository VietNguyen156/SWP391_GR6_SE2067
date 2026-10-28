// Icon tròn theo loại học liệu: cùng màu chính trên nền nhạt, mỗi loại phân biệt bằng hình icon.
const paths = {
  GRAMMAR: (
    <>
      <path d="M4 19 9 5l5 14" />
      <path d="M6 14h6" />
      <path d="M15 19v-6.5a2.5 2.5 0 0 1 5 0V19" />
    </>
  ),
  FLASHCARD: (
    <>
      <rect x="3.5" y="7" width="12" height="13" rx="2" />
      <path d="M8.5 4h10a2 2 0 0 1 2 2v11" />
    </>
  ),
  LISTENING: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3.5" y="14" width="4" height="6" rx="1.5" />
      <rect x="16.5" y="14" width="4" height="6" rx="1.5" />
    </>
  ),
  READING: (
    <>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  SPEAKING: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v2.5" />
    </>
  ),
};

export default function MaterialIcon({ type }) {
  const key = paths[type] ? type : "GRAMMAR";
  return (
    <span className={`cs-mat-icon cs-mat-${key.toLowerCase()}`} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[key]}
      </svg>
    </span>
  );
}
