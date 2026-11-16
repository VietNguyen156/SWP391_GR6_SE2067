import { Link } from "react-router-dom";
import Icon from "../common/Icon";
import MaterialIcon from "./MaterialIcon";
import { materialLabel, studentMaterialLink } from "../../utils/lessonMaterials";

const speakingState = { SUBMITTED: "Đã nộp", GRADED: "Đã chấm" };

/** Một dòng học liệu của học viên: tên + loại (không kèm định dạng, trình độ, số câu). locked: không bấm được. */
export default function MaterialRow({ material, locked = false }) {
  const speaking = material.type === "SPEAKING" ? speakingState[material.extra] : null;
  const body = (
    <>
      <MaterialIcon type={material.type} />
      <span className="sc-material-text">
        <span className="sc-material-name">{material.title}</span>
        <span className="sc-material-sub">{materialLabel[material.type] || material.type}</span>
      </span>
      {speaking && (
        <span className="sc-chip sc-chip-done">
          <Icon name="check" size={12} />
          {speaking}
        </span>
      )}
      <span className="sc-material-end" aria-hidden="true">
        {locked ? <Icon name="lock" size={16} /> : <Icon name="arrow" size={16} />}
      </span>
    </>
  );

  if (locked) {
    return (
      <div className="sc-material is-locked" aria-disabled="true">
        {body}
      </div>
    );
  }
  return (
    <Link className="sc-material" to={studentMaterialLink(material)}>
      {body}
    </Link>
  );
}
