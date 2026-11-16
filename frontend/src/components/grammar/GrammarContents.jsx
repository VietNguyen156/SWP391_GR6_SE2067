import AttachmentList from "./AttachmentList";
import Icon from "../common/Icon";

/**
 * Trình bày nội dung Ngữ pháp chuẩn trang giáo trình:
 * - Khung "Công thức & Quy tắc" nổi bật
 * - Ví dụ minh họa có điểm nhấn
 * - Khối "Lỗi thường gặp & Lưu ý"
 * - Mục tệp đính kèm (PDF, video, audio)
 */
export default function GrammarContents({ contents = [] }) {
  return contents.map((content, index) => {
    const isMistakeNote =
      content.notes &&
      (content.notes.toLowerCase().includes("lỗi") ||
        content.notes.toLowerCase().includes("tránh") ||
        content.notes.toLowerCase().includes("chú ý") ||
        content.notes.toLowerCase().includes("sai"));

    return (
      <article className="content-reading-card gm-textbook-card" key={content.id}>
        <div className="gm-section-header">
          <span className="gm-section-badge">Mục {String(index + 1).padStart(2, "0")}</span>
        </div>

        {/* Khung Công thức / Quy tắc */}
        <section className="gm-formula-box">
          <div className="gm-box-label">
            <Icon name="book" size={16} />
            <span>Công thức & Quy tắc</span>
          </div>
          <div className="gm-box-content pre-line">{content.ruleContent}</div>
        </section>

        {/* Khung Ví dụ minh họa */}
        {content.examples && (
          <section className="gm-examples-box">
            <div className="gm-box-label">
              <Icon name="sparkle" size={16} />
              <span>Ví dụ minh họa</span>
            </div>
            <div className="gm-box-content pre-line">{content.examples}</div>
          </section>
        )}

        {/* Khối Lỗi thường gặp & Lưu ý */}
        {content.notes && (
          <section className={`gm-notes-box ${isMistakeNote ? "is-mistake" : ""}`}>
            <div className="gm-box-label">
              <Icon name="flag" size={16} />
              <span>{isMistakeNote ? "Lỗi thường gặp & Lưu ý" : "Ghi chú mở rộng"}</span>
            </div>
            <div className="gm-box-content pre-line">{content.notes}</div>
          </section>
        )}

        {/* Tệp đính kèm & tài liệu (xem PDF, video nhúng) */}
        {content.attachments && content.attachments.length > 0 && (
          <div className="gm-attachments-wrap mt-3">
            <AttachmentList attachments={content.attachments} />
          </div>
        )}
      </article>
    );
  });
}
