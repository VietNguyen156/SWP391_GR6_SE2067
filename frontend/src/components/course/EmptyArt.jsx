// Minh họa nhỏ cho empty state: một chồng thẻ bài học vẽ nét mảnh (màu lấy từ token qua class).
export default function EmptyArt() {
  return (
    <svg className="cs-empty-art" viewBox="0 0 96 72" aria-hidden="true">
      <rect x="22" y="6" width="56" height="40" rx="5" className="cs-empty-art-back" />
      <rect x="14" y="16" width="60" height="44" rx="5" className="cs-empty-art-front" />
      <path d="M24 30h26M24 40h38M24 48h18" className="cs-empty-art-lines" />
      <circle cx="78" cy="56" r="11" className="cs-empty-art-plus-bg" />
      <path d="M78 51v10M73 56h10" className="cs-empty-art-plus" />
    </svg>
  );
}
