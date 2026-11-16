import listeningTemplate from "../../assets/import-templates/listening-questions-template.txt?raw";
import readingTemplate from "../../assets/import-templates/reading-questions-template.txt?raw";
import { isBlankQuestion, mergeImported, parseMcqText } from "../../utils/questionImport";
import FileImport, { McqPreview } from "./FileImport";

const TEMPLATES = {
  reading: [readingTemplate, "reading-questions-template.txt"],
  listening: [listeningTemplate, "listening-questions-template.txt"],
};

/**
 * Nhập câu trắc nghiệm từ file vào McqEditor (Reading, Listening, Ngân hàng đề thi).
 * Chỉ đổi form; câu hỏi lên máy chủ khi giáo viên bấm Lưu như bình thường.
 */
export default function McqFileImport({ questions, onChange, kind = "reading", disabled }) {
  const [template, templateName] = TEMPLATES[kind];
  return (
    <FileImport
      template={template}
      templateName={templateName}
      disabled={disabled}
      parse={(text) => {
        const { questions: items, errors } = parseMcqText(text);
        return {
          errors,
          items: items.map(({ line, ...q }) =>
            kind === "reading" ? q : { ...q, explanation: "", evidence: "" },
          ),
        };
      }}
      renderItem={(q) => <McqPreview q={q} />}
      onImport={(items) => onChange(mergeImported(questions, items, isBlankQuestion))}
    />
  );
}
