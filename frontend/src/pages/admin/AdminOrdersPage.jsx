import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OrderDrawer from "../../components/admin/OrderDrawer";
import { adminApi } from "../../services/adminService";
import { adminOrderApi } from "../../services/orderService";
import { formatDateTime, formatMoney } from "../../utils/format";
import { PAYMENT_METHOD_LABELS, orderStatusLabel, orderStatusTone } from "../../utils/orderStatus";

const TABS = [
  { key: "AWAITING_CONFIRMATION", label: "Chờ xác nhận" },
  { key: "PENDING", label: "Chờ chuyển khoản" },
  { key: "PAID", label: "Đã thanh toán" },
  { key: "CLOSED", label: "Từ chối / Hủy / Hết hạn" },
];
const PAGE_SIZE = 20;

/** Quản lý đơn mua khóa học: lọc theo tab trạng thái, tìm kiếm, khóa học, khoảng ngày. */
export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : TABS[0].key;
  const filters = {
    tab,
    q: params.get("q") || "",
    courseId: params.get("course") || "",
    from: params.get("from") || "",
    to: params.get("to") || "",
    page: Number(params.get("page")) || 0,
  };
  const [search, setSearch] = useState(filters.q);
  const [courses, setCourses] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  function update(patch) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries({ page: "", ...patch }).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key),
        );
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    adminApi
      .courses()
      .then(setCourses)
      .catch(() => {});
  }, []);

  const query = params.toString();
  useEffect(() => {
    let active = true;
    setError("");
    adminOrderApi
      .list({
        tab: filters.tab,
        q: filters.q || undefined,
        courseId: filters.courseId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: filters.page,
        size: PAGE_SIZE,
      })
      .then((result) => active && setData(result))
      .catch((e) => active && setError(e.response?.data?.message || "Không thể tải đơn hàng"));
    return () => {
      active = false;
    };
  }, [query, reloadKey]);

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <header className="admin-page-header">
        <h1>Đơn hàng</h1>
      </header>

      <div className="admin-filter-tabs ao-tabs" role="tablist" aria-label="Trạng thái đơn">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={tab === item.key ? "active" : ""}
            onClick={() => update({ tab: item.key })}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form
        className="admin-filters ao-filters"
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: search.trim() });
        }}
      >
        <input
          className="form-control"
          type="search"
          placeholder="Mã đơn, nội dung CK, tên hoặc email học viên…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Tìm đơn hàng"
        />
        <select
          className="form-select"
          value={filters.courseId}
          onChange={(event) => update({ course: event.target.value })}
          aria-label="Lọc theo khóa học"
        >
          <option value="">Tất cả khóa học</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <label className="ao-date">
          <span>Từ</span>
          <input
            className="form-control"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => update({ from: event.target.value })}
          />
        </label>
        <label className="ao-date">
          <span>Đến</span>
          <input
            className="form-control"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => update({ to: event.target.value })}
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Tìm
        </button>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}
      {!data ? (
        !error && <div className="spinner-border text-primary" />
      ) : (
        <div className="table-responsive admin-table-wrap">
          <table className="table align-middle mb-0 ao-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Học viên</th>
                <th>Khóa học</th>
                <th className="text-end">Số tiền</th>
                <th>Trạng thái</th>
                <th>{tab === "AWAITING_CONFIRMATION" ? "Báo chuyển lúc" : "Cập nhật"}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr
                  key={order.id}
                  tabIndex={0}
                  onClick={() => setOpenId(order.id)}
                  onKeyDown={(event) => event.key === "Enter" && setOpenId(order.id)}
                >
                  <td>
                    <strong>{order.orderCode}</strong>
                    <small>
                      {order.transferContent || PAYMENT_METHOD_LABELS[order.paymentMethod]}
                    </small>
                  </td>
                  <td>
                    <strong>{order.studentName}</strong>
                    <small>{order.studentEmail}</small>
                  </td>
                  <td>{order.courseTitle}</td>
                  <td className="text-end">
                    <strong>{formatMoney(order.amount)}</strong>
                  </td>
                  <td>
                    <span className={`od-status is-${orderStatusTone(order.status)}`}>
                      {orderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    {formatDateTime(
                      tab === "AWAITING_CONFIRMATION" ? order.studentReportedAt : order.updatedAt,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length && <div className="content-empty m-3">Không có đơn nào.</div>}
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <nav className="ao-pager" aria-label="Phân trang">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={filters.page === 0}
            onClick={() => update({ page: String(filters.page - 1) })}
          >
            Trước
          </button>
          <span>
            Trang {filters.page + 1}/{pages} · {data.total} đơn
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={filters.page + 1 >= pages}
            onClick={() => update({ page: String(filters.page + 1) })}
          >
            Sau
          </button>
        </nav>
      )}

      {openId && (
        <OrderDrawer
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => setReloadKey((key) => key + 1)}
        />
      )}
    </>
  );
}
