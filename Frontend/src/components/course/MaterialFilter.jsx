import { MATERIAL_TYPES, materialLabel } from "../../utils/lessonMaterials";

/** Chip lọc theo loại học liệu. value: "" (tất cả) hoặc một MATERIAL_TYPE. */
export default function MaterialFilter({ value, counts, onChange, types = MATERIAL_TYPES }) {
  const options = [{ type: "", label: "Tất cả" }].concat(
    types.map((type) => ({ type, label: materialLabel[type] })),
  );
  return (
    <div className="sc-filter" role="group" aria-label="Lọc theo loại học liệu">
      {options.map(({ type, label }) => (
        <button
          key={type || "ALL"}
          type="button"
          className={`sc-filter-chip ${type ? `cs-mat-${type.toLowerCase()}` : ""} ${
            value === type ? "is-on" : ""
          }`}
          aria-pressed={value === type}
          onClick={() => onChange(type)}
        >
          {label}
          {type && <span className="sc-filter-count">{counts[type] || 0}</span>}
        </button>
      ))}
    </div>
  );
}
