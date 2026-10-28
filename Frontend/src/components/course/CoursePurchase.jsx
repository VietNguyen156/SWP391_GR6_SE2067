import { Link } from "react-router-dom";
import Icon from "../common/Icon";
import { formatMoney } from "../../utils/format";
import { orderStatusLabel } from "../../utils/orderStatus";

/** Đơn đang mở (chờ chuyển khoản / chờ xác nhận) của khóa này. */
export function PendingOrderBanner({ order }) {
  const awaiting = order.status === "AWAITING_CONFIRMATION";
  return (
    <div className={`sc-order-banner ${awaiting ? "is-info" : ""}`} role="status">
      <Icon name="clock" size={20} />
      <div>
        <strong>
          Đơn {order.orderCode} · {orderStatusLabel(order.status)}
        </strong>
        <p>
          {awaiting
            ? "Trung tâm đang kiểm tra giao dịch, bạn sẽ có quyền chọn lớp ngay khi đơn được xác nhận."
            : `Chuyển ${formatMoney(order.amount)} với nội dung ${order.transferContent} để hoàn tất.`}
        </p>
      </div>
      <Link className="btn btn-primary btn-sm" to={`/orders/${order.orderCode}`}>
        {awaiting ? "Xem đơn" : "Tiếp tục thanh toán"}
      </Link>
    </div>
  );
}

/** Thẻ giá + quyền lợi khi học viên chưa mua khóa học. */
export function PurchaseCard({ purchase, busy, onBuy }) {
  const benefits = [
    { icon: "book", text: `${purchase.lessonCount} bài học theo lộ trình từng tuần` },
    { icon: "test", text: `${purchase.questionCount} câu hỏi trong Test cuối khóa` },
    { icon: "users", text: "Học trong lớp cùng giảng viên theo dõi tiến độ" },
    { icon: "shield", text: "Mua một lần, chọn bất kỳ lớp đang mở của khóa" },
  ];
  const lastClosed = purchase.lastClosedOrder;
  return (
    <aside className="sc-buy-card" aria-labelledby="sc-buy-title">
      <span className="sc-buy-kicker">Học phí trọn khóa</span>
      <p className="sc-buy-price" id="sc-buy-title">
        {formatMoney(purchase.price)}
      </p>
      <ul className="sc-buy-benefits">
        {benefits.map((item) => (
          <li key={item.icon}>
            <Icon name={item.icon} size={18} />
            {item.text}
          </li>
        ))}
      </ul>
      {lastClosed?.status === "REJECTED" && lastClosed.statusReason && (
        <p className="sc-buy-note">
          Đơn {lastClosed.orderCode} bị từ chối: {lastClosed.statusReason}
        </p>
      )}
      {purchase.openOrder ? (
        <Link className="btn btn-primary w-100" to={`/orders/${purchase.openOrder.orderCode}`}>
          Xem đơn đang chờ
        </Link>
      ) : (
        <button
          type="button"
          className="btn btn-primary w-100"
          disabled={!purchase.hasOpenClass || busy}
          onClick={onBuy}
        >
          {!purchase.hasOpenClass
            ? "Chưa có lớp mở"
            : busy
              ? "Đang tạo đơn…"
              : purchase.free
                ? "Nhận miễn phí"
                : "Mua khóa học"}
        </button>
      )}
      <small className="sc-buy-foot">
        Thanh toán bằng chuyển khoản ngân hàng qua mã QR, trung tâm xác nhận trong giờ hành chính.
      </small>
    </aside>
  );
}

/** Xem trước tên tuần và bài học (khóa) trước khi mua. */
export function LockedPreview({ weeks }) {
  if (!weeks?.length) return null;
  return (
    <section className="sc-preview" aria-labelledby="sc-preview-title">
      <header className="sc-section-head">
        <h2 id="sc-preview-title">Nội dung khóa học</h2>
      </header>
      <ol className="sc-preview-weeks">
        {weeks.map((week) => (
          <li key={week.weekNumber}>
            <h3>
              <span>Tuần {week.weekNumber}</span>
              {week.title}
            </h3>
            <ul>
              {week.lessons.map((lesson, index) => (
                <li key={index}>
                  <Icon name="lock" size={14} />
                  {lesson}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
