/** Nút "+ Thêm …" dùng chung cho mọi phần thêm của học liệu (giải thích, thẻ, câu hỏi). */
export default function AddButton({ label, onClick, disabled }) {
  return (
    <button type="button" className="mv-add" onClick={onClick} disabled={disabled}>
      <span aria-hidden="true">+</span> {label}
    </button>
  );
}
