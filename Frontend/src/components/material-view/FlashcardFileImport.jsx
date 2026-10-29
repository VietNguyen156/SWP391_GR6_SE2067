import template from "../../assets/import-templates/flashcard-template.txt?raw";
import { isBlankCard, mergeImported, parseFlashcardText } from "../../utils/questionImport";
import FileImport from "./FileImport";

/**
 * Nhập nhiều thẻ từ file .txt (mỗi dòng: mặt trước | mặt sau | phát âm | loại từ | ví dụ).
 * makeCard tạo thẻ trống đúng dạng form của trang gọi; thẻ chỉ lưu khi bấm Lưu.
 */
export default function FlashcardFileImport({ cards, onChange, makeCard }) {
  return (
    <FileImport
      noun="thẻ"
      confirmLabel={(n) => `Thêm ${n} thẻ vào bộ`}
      template={template}
      templateName="flashcard-template.txt"
      parse={(text) => {
        const { cards: items, errors } = parseFlashcardText(text);
        return { errors, items: items.map(({ line, ...c }) => ({ ...makeCard(), ...c })) };
      }}
      renderItem={(c) => (
        <>
          <strong>{c.frontText}</strong>
          {c.pronunciation && <span className="text-muted"> {c.pronunciation}</span>}
          {c.wordType && <em> ({c.wordType})</em>}: {c.backText}
          {c.exampleSentence && <div className="text-muted">{c.exampleSentence}</div>}
        </>
      )}
      onImport={(items) => onChange(mergeImported(cards, items, isBlankCard))}
    />
  );
}
