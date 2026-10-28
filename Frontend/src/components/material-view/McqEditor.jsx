// Soạn câu hỏi trắc nghiệm (Listening, Reading): mỗi câu 4 đáp án, chọn đúng một đáp án đúng.
// withKey: thêm ô "Giải thích" và "Căn cứ trong bài" (Reading).

const option = (text = "", correct = false) => ({ optionText: text, correct });

export const blankQuestion = () => ({
  questionText: "",
  explanation: "",
  evidence: "",
  options: [option("", true), option(), option(), option()],
});

export default function McqEditor({ questions, onChange, withKey = false }) {
  const patch = (qi, fn) => onChange(questions.map((q, n) => (n === qi ? fn(q) : q)));
  const setField = (qi, key, value) => patch(qi, (q) => ({ ...q, [key]: value }));
  const setOption = (qi, oi, key, value) =>
    patch(qi, (q) => ({
      ...q,
      options: q.options.map((o, m) =>
        m === oi
          ? { ...o, [key]: value }
          : key === "correct" && value
            ? { ...o, correct: false }
            : o,
      ),
    }));

  return (
    <>
      <h2 className="h5 fw-bold">Câu hỏi ({questions.length})</h2>
      {questions.map((q, qi) => (
        <div className="border rounded-3 p-3 mt-3" key={qi}>
          <div className="d-flex gap-2">
            <input
              required
              className="form-control"
              placeholder={`Câu ${qi + 1}`}
              aria-label={`Nội dung câu ${qi + 1}`}
              value={q.questionText}
              onChange={(e) => setField(qi, "questionText", e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-danger"
              disabled={questions.length === 1}
              onClick={() => onChange(questions.filter((_, n) => n !== qi))}
            >
              Xóa
            </button>
          </div>
          <div className="row g-2 mt-1">
            {q.options.map((o, oi) => (
              <div className="col-md-6" key={oi}>
                <div className="input-group">
                  <span className="input-group-text">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      aria-label={`Đáp án ${String.fromCharCode(65 + oi)} là đáp án đúng`}
                      checked={o.correct}
                      onChange={() => setOption(qi, oi, "correct", true)}
                    />
                  </span>
                  <input
                    required
                    className="form-control"
                    value={o.optionText}
                    onChange={(e) => setOption(qi, oi, "optionText", e.target.value)}
                    placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                    aria-label={`Đáp án ${String.fromCharCode(65 + oi)} của câu ${qi + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>
          {withKey && (
            <div className="row g-2 mt-1">
              <div className="col-md-6">
                <label className="form-label small mb-1" htmlFor={`evidence-${qi}`}>
                  Căn cứ trong bài
                </label>
                <textarea
                  id={`evidence-${qi}`}
                  className="form-control"
                  rows="2"
                  placeholder="Chép nguyên văn câu chứa đáp án; học viên sẽ thấy câu này được tô sáng."
                  value={q.evidence}
                  onChange={(e) => setField(qi, "evidence", e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small mb-1" htmlFor={`explain-${qi}`}>
                  Giải thích
                </label>
                <textarea
                  id={`explain-${qi}`}
                  className="form-control"
                  rows="2"
                  placeholder="Hiện cho học viên trả lời sai sau khi nộp."
                  value={q.explanation}
                  onChange={(e) => setField(qi, "explanation", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
