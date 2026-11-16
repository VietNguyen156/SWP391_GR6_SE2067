import { Link } from "react-router-dom";
import Icon from "../common/Icon";
import MaterialIcon from "../course/MaterialIcon";
import { studentMaterialLink } from "../../utils/lessonMaterials";

/**
 * Học liệu phải nộp để hoàn thành bài (do backend tính): mọi Quiz, Listening, Speaking đang
 * hiển thị. ✓ = đã nộp, ○ = chưa nộp.
 */
export default function CompletionChecklist({ requirements = [], lessonId }) {
  return (
    <ul className="cc-list" aria-label="Học liệu cần nộp để hoàn thành bài">
      {requirements.map((item) => (
        <li key={`${item.type}-${item.id}`} className={item.done ? "is-done" : ""}>
          <MaterialIcon type={item.type} />
          <Link
            className="cc-title"
            to={studentMaterialLink({ type: item.type, id: item.id, lessonId })}
          >
            {item.title}
          </Link>
          <span className="cc-detail">{item.done ? "Đã nộp" : "Chưa nộp"}</span>
          <span className="cc-state" aria-hidden="true">
            {item.done && <Icon name="check" size={16} />}
          </span>
        </li>
      ))}
    </ul>
  );
}
