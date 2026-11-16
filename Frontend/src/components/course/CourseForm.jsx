import { useState } from "react";
import { Link } from "react-router-dom";
import { LEVEL_OPTIONS } from "./courseFormModel";

/**
 * Form khóa học dùng chung cho tạo và sửa. Không có trường trạng thái: khóa mới luôn là nháp,
 * trạng thái đổi bằng công tắc Hiển thị ở trang khóa học.
 */
export default function CourseForm({ initialValues, submitting, cancelTo, onSubmit }) {
  const [form, setForm] = useState(initialValues);
  const [brokenCover, setBrokenCover] = useState("");

  function set(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  const showCover = form.thumbnailUrl && brokenCover !== form.thumbnailUrl;

  return (
    <form className="cs-form" onSubmit={submit}>
      <section className="cs-card cs-form-section" aria-labelledby="cs-basic">
        <h2 className="cs-section-title" id="cs-basic">
          Thông tin cơ bản
        </h2>
        <div className="cs-field">
          <label className="form-label" htmlFor="cs-course-title">
            Tên khóa học
          </label>
          <input
            id="cs-course-title"
            className="form-control"
            maxLength="200"
            required
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Ví dụ: TOEIC 650+ Intensive"
          />
        </div>
        <div className="cs-field">
          <div className="cs-label-row">
            <label className="form-label" htmlFor="cs-course-description">
              Mô tả
            </label>
            <span className="cs-counter">{form.description.length} ký tự</span>
          </div>
          <textarea
            id="cs-course-description"
            className="form-control"
            rows="4"
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="Khóa học dành cho ai, học gì, đạt được gì."
          />
        </div>
        <div className="cs-field">
          <label className="form-label" htmlFor="cs-course-cover">
            Ảnh bìa (URL)
          </label>
          <input
            id="cs-course-cover"
            className="form-control"
            type="url"
            maxLength="500"
            value={form.thumbnailUrl}
            onChange={(event) => set("thumbnailUrl", event.target.value)}
            placeholder="https://..."
          />
          <div className="cs-cover cs-cover-preview">
            {showCover ? (
              <img
                src={form.thumbnailUrl}
                alt="Xem trước ảnh bìa"
                onError={() => setBrokenCover(form.thumbnailUrl)}
              />
            ) : (
              <span className="cs-cover-empty">
                {form.thumbnailUrl ? "Không tải được ảnh" : "Chưa có ảnh bìa"}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="cs-card cs-form-section" aria-labelledby="cs-path">
        <h2 className="cs-section-title" id="cs-path">
          Lộ trình
        </h2>
        <div className="cs-grid-2">
          <div className="cs-field">
            <label className="form-label" htmlFor="cs-course-level">
              Trình độ
            </label>
            <select
              id="cs-course-level"
              className="form-select"
              value={form.level}
              onChange={(event) => set("level", event.target.value)}
            >
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="cs-field">
            <label className="form-label" htmlFor="cs-course-target">
              Điểm mục tiêu
            </label>
            <input
              id="cs-course-target"
              className="form-control"
              type="number"
              min="0"
              max="990"
              value={form.targetScore}
              onChange={(event) => set("targetScore", event.target.value)}
              placeholder="Ví dụ: 650"
            />
          </div>
        </div>
      </section>

      <div className="cs-form-actions">
        <Link className="btn btn-link cs-btn-quiet" to={cancelTo}>
          Hủy
        </Link>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Đang lưu…" : "Lưu khóa học"}
        </button>
      </div>
    </form>
  );
}
