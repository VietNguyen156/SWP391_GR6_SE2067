import { motion } from "motion/react";

/**
 * Một câu trắc nghiệm của học viên (Listening, Reading): chọn đáp án; sau khi nộp hiện Đúng/Sai và
 * đáp án đúng. children: phần thêm dưới các đáp án (vd. giải thích, nút xem căn cứ của Reading).
 */
export default function QuestionCard({
  question,
  index,
  answer,
  onPick,
  result,
  disabled,
  children,
}) {
  // Sau khi nộp: so đáp án đã chọn với đáp án đúng do backend trả về trong kết quả.
  const correctId = result?.correctAnswers?.[question.id];
  // Backend cũ không gửi đáp án đúng: không chấm Đúng/Sai để tránh báo sai tất cả.
  const graded = Boolean(result?.correctAnswers);
  const right = graded && Number(answer) === Number(correctId);
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`student-question-card ${result ? "is-submitted" : ""} ${graded ? (right ? "is-right" : "is-wrong") : ""}`}
    >
      <header>
        <span>Câu {index + 1}</span>
        <h2>{question.questionText}</h2>
        {graded && (
          <em className={`student-q-verdict ${right ? "is-right" : "is-wrong"}`}>
            {right ? "Đúng" : "Sai"}
          </em>
        )}
      </header>
      <div className="student-option-grid">
        {question.options.map((option, optionIndex) => {
          const checked = Number(answer) === Number(option.id);
          const isAnswer = graded && Number(correctId) === Number(option.id);
          const wrongPick = graded && checked && !isAnswer;

          // Animation variant:
          // - Chọn sai: rung nhẹ (shake)
          // - Chọn đúng / đáp án đúng: bật sáng nhẹ (pulse)
          // - Đang làm và vừa click chọn: micro-scale
          let motionAnimate = { scale: 1, x: 0 };
          let motionTransition = { duration: 0.2 };

          if (wrongPick) {
            motionAnimate = {
              x: [0, -7, 7, -5, 5, -3, 3, 0],
              scale: 1,
            };
            motionTransition = {
              duration: 0.45,
              ease: "easeInOut",
            };
          } else if (isAnswer) {
            motionAnimate = {
              scale: [1, 1.025, 1],
            };
            motionTransition = {
              duration: 0.5,
              ease: "easeOut",
            };
          } else if (checked && !graded) {
            motionAnimate = {
              scale: [1, 1.018, 1],
            };
            motionTransition = {
              duration: 0.22,
              ease: "easeOut",
            };
          }

          return (
            <motion.label
              className={`student-option ${checked ? "selected" : ""} ${result && checked ? "locked-selection" : ""} ${isAnswer ? "is-answer" : ""} ${wrongPick ? "is-wrong-pick" : ""}`}
              key={option.id}
              whileHover={disabled || Boolean(result) ? undefined : { scale: 1.01 }}
              whileTap={disabled || Boolean(result) ? undefined : { scale: 0.985 }}
              animate={motionAnimate}
              transition={motionTransition}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={checked}
                disabled={disabled || Boolean(result)}
                onChange={() => onPick(option.id)}
              />
              <span className="student-option-key">{String.fromCharCode(65 + optionIndex)}</span>
              <span>{option.optionText}</span>
              {isAnswer && <b>{checked ? "Bạn chọn · Đúng" : "Đáp án đúng"}</b>}
              {wrongPick && <b>Bạn chọn · Sai</b>}
              {result && !graded && checked && <b>Đã chọn</b>}
            </motion.label>
          );
        })}
      </div>
      {children}
    </motion.article>
  );
}

/** true khi câu đã chấm và trả lời sai (để chỉ hiện giải thích cho câu sai). */
export const answeredWrong = (question, answer, result) =>
  Boolean(result?.correctAnswers) && Number(answer) !== Number(result.correctAnswers[question.id]);
