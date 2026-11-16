/** Xem lại đáp án của một lượt làm quiz. */
export default function AnswerReview({ answers = [] }) {
  return (
    <section className="answer-review">
      <h2>Xem lại đáp án</h2>
      {answers.map((answer, index) => (
        <article className={answer.correct ? "correct" : "wrong"} key={answer.questionId}>
          <span>
            Câu {index + 1} · {answer.correct ? "Đúng" : "Sai"}
          </span>
          <h3>{answer.questionText}</h3>
          <p>
            Bạn chọn: <strong>{answer.selectedAnswer || "Chưa trả lời"}</strong>
          </p>
          {!answer.correct && (
            <p>
              Đáp án đúng: <strong>{answer.correctAnswer}</strong>
            </p>
          )}
          {answer.explanation && <small>Giải thích: {answer.explanation}</small>}
        </article>
      ))}
    </section>
  );
}
