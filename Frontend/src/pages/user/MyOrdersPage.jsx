import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../../services/orderService";
import { formatDateTime, formatMoney } from "../../utils/format";
import { orderStatusLabel, orderStatusTone } from "../../utils/orderStatus";

/** Tab "Đơn hàng": các đơn mua khóa học của học viên. */
export default function MyOrdersPage() {
  const [state, setState] = useState({ loading: true, items: [], error: "" });

  useEffect(() => {
    orderApi
      .mine()
      .then((items) => setState({ loading: false, items, error: "" }))
      .catch((e) =>
        setState({
          loading: false,
          items: [],
          error: e.response?.data?.message || "Không thể tải đơn hàng",
        }),
      );
  }, []);

  return (
    <main className="container py-5 content-shell">
      <div className="mb-4">
        <h1 className="h2 fw-bold">Đơn hàng</h1>
      </div>
      {state.error && <div className="alert alert-danger">{state.error}</div>}
      {state.loading ? (
        <div className="spinner-border text-primary" />
      ) : state.items.length ? (
        <ul className="od-list">
          {state.items.map((order) => (
            <li key={order.id}>
              <Link to={`/orders/${order.orderCode}`}>
                <span className="od-list-main">
                  <strong>{order.courseTitle}</strong>
                  <small>
                    {order.orderCode} · {formatDateTime(order.createdAt)}
                  </small>
                </span>
                <span className="od-list-amount">
                  {formatMoney(order.amount, { freeLabel: "Miễn phí" })}
                </span>
                <span className={`od-status is-${orderStatusTone(order.status)}`}>
                  {orderStatusLabel(order.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="content-empty">
          Bạn chưa có đơn hàng nào. <Link to="/courses">Xem các khóa học</Link>
        </div>
      )}
    </main>
  );
}
