import { useNavigate } from "react-router-dom";
import Icon from "../common/Icon";
import IconButton from "../common/IconButton";
import Dropdown from "./Dropdown";
import MaterialIcon from "./MaterialIcon";
import { materialLabel, teacherMaterialLink } from "../../utils/lessonMaterials";
import { displayTitle, splitMatch } from "../../utils/materialLibrary";

/**
 * Một dòng học liệu (Thư viện học liệu, trang bài học): lưới cột cố định [icon][tên][số liệu][hành động]
 * để mọi dòng thẳng hàng. Bấm cả dòng (ngoài nút) mở trang sửa; Sửa và ⋯ hiện khi hover hoặc focus.
 * `where`: hiện vị trí Khóa · Tuần · Bài dưới tên (khi tìm kiếm trên mọi khóa).
 */
export default function MaterialLine({ row, q = "", where = false, here, onRemove }) {
  const navigate = useNavigate();
  const link = teacherMaterialLink(row, here);
  const label = materialLabel[row.type];
  const title = displayTitle(row);
  function open(event) {
    if (event.target.closest("a, button, .dropdown")) return;
    navigate(link);
  }
  return (
    <li className={`ml-row cs-mat-${row.type.toLowerCase()}`} onClick={open}>
      <span className="ml-icon" role="img" aria-label={label} title={label}>
        <MaterialIcon type={row.type} />
      </span>
      <div className="ml-main">
        <span className="ml-title" title={row.title}>
          {splitMatch(title, q).map((part, i) =>
            part.match ? <strong key={i}>{part.text}</strong> : part.text,
          )}
        </span>
        {where && (
          <span className="ml-where">
            {row.courseTitle} · Tuần {row.weekNumber} · Bài {row.lessonNo}
          </span>
        )}
      </div>
      <div className="ml-sub">
        <span className="ml-metric" title={row.metric?.text}>
          {row.metric && (
            <>
              <Icon name={row.metric.icon} size={14} />
              {row.metric.text}
            </>
          )}
        </span>
      </div>
      <div className="ml-actions">
        <IconButton icon="edit" label={`Sửa “${row.title}”`} to={link} />
        <Dropdown
          label="⋯"
          ariaLabel={`Tùy chọn “${row.title}”`}
          toggleClassName="cs-icon-btn ml-more-btn"
          items={[
            {
              label: "Xóa",
              onClick: () => onRemove(row),
              danger: true,
              disabled: row.inUse,
              reason: "Đã có học viên làm bài nên không thể xóa.",
            },
          ]}
        />
      </div>
    </li>
  );
}
