import { useRef, useState } from "react";
import { parseReadingQuestionText } from "../../utils/readingQuestionImport";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const TEMPLATE_URL = "/templates/reading-questions-template.txt";

export default function ReadingQuestionImporter({ onImport }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function readFile(file) {
    setResult(null);
    setError("");
    setFileName("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Vui lòng chọn file có đuôi .txt.");
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setError("File import không được vượt quá 2 MB.");
      return;
    }

    try {
      const parsed = parseReadingQuestionText(await file.text());
      setFileName(file.name);
      setResult(parsed);
    } catch {
      setError("Không thể đọc file. Hãy lưu file dưới dạng văn bản UTF-8 rồi thử lại.");
    }
  }

  function applyImport() {
    if (!result || result.errors.length || !result.questions.length) return;
    onImport(result.questions);
    setResult(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="border rounded-3 p-3 mb-3" aria-label="Import câu hỏi Reading">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h3 className="h6 fw-bold mb-1">Import câu hỏi từ file .txt</h3>
          <p className="small text-secondary mb-2">
            Mỗi câu gồm một dòng câu hỏi, bốn đáp án A–D và một dòng “Đáp án: B”. Import chỉ đưa câu
            hỏi vào form; hãy kiểm tra và bấm “Lưu bài đọc” để lưu.
          </p>
        </div>
        <a className="btn btn-sm btn-outline-secondary" href={TEMPLATE_URL} download>
          Tải file mẫu
        </a>
      </div>

      <label className="form-label small fw-semibold" htmlFor="reading-question-import">
        Chọn file câu hỏi
      </label>
      <input
        ref={inputRef}
        id="reading-question-import"
        className="form-control"
        type="file"
        accept=".txt,text/plain"
        onChange={(event) => readFile(event.target.files?.[0])}
      />

      {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

      {result && (
        <div className="mt-3" aria-live="polite">
          <p className="small mb-2">
            File: <strong>{fileName}</strong> · Đọc được {result.questions.length} câu
          </p>

          {result.errors.length > 0 && (
            <div className="alert alert-danger">
              <strong>Chưa thể import vì file có lỗi:</strong>
              <ul className="mb-0 mt-2">
                {result.errors.map((message, index) => (
                  <li key={`${index}-${message}`}>{message}</li>
                ))}
              </ul>
              <span className="small">Sửa file rồi chọn lại để xem trước lần nữa.</span>
            </div>
          )}

          {result.questions.length > 0 && (
            <div className="border rounded-2 p-3 mb-3">
              <strong>Xem trước</strong>
              <ol className="mb-0 mt-2">
                {result.questions.map((question, index) => (
                  <li className="mb-2" key={`${index}-${question.questionText}`}>
                    <div>{question.questionText}</div>
                    <ul className="small mb-0">
                      {question.options.map((option, optionIndex) => (
                        <li key={optionIndex}>
                          {String.fromCharCode(65 + optionIndex)}. {option.optionText}
                          {option.correct && (
                            <strong className="text-success"> — đáp án đúng</strong>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            disabled={result.errors.length > 0 || result.questions.length === 0}
            onClick={applyImport}
          >
            Thêm {result.questions.length} câu vào form
          </button>
        </div>
      )}
    </section>
  );
}
