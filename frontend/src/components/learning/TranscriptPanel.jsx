import { parseTranscript, speakerLabel } from "../../utils/transcript";

/** Transcript bài nghe (khối gập), dòng chứa đáp án gắn nhãn "Câu n". Chỉ hiện sau khi đã nộp bài. */
export default function TranscriptPanel({ transcript }) {
  const lines = parseTranscript(transcript);
  if (!lines.length) return null;
  return (
    <details className="transcript-panel">
      <summary>Xem transcript</summary>
      <ol>
        {lines.map((line, index) => (
          <li key={index} className={line.questions.length ? "has-answer" : ""}>
            {line.speaker && (
              <span className="transcript-speaker">{speakerLabel(line.speaker)}</span>
            )}
            <p>
              {line.text}
              {line.questions.map((n) => (
                <mark key={n} title={`Câu này chứa đáp án câu ${n}`}>
                  Câu {n}
                </mark>
              ))}
            </p>
          </li>
        ))}
      </ol>
    </details>
  );
}
