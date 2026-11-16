import { useEffect, useState } from "react";
import { useToast } from "../../components/common/Toast";
import { adminOrderApi } from "../../services/orderService";
import { formatMoney } from "../../utils/format";

const monthLabel = (month) => {
  const [year, value] = month.split("-");
  return `${value}/${year}`;
};

/** Doanh thu tính từ hồ sơ nhận tiền, không tính đơn chuyển đổi dữ liệu cũ. */
export default function AdminRevenuePage() {
  const toast = useToast();
  const [range, setRange] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const params = { from: range.from || undefined, to: range.to || undefined };

  useEffect(() => {
    let active = true;
    setError("");
    adminOrderApi
      .revenue({ from: range.from || undefined, to: range.to || undefined })
      .then((result) => active && setData(result))
      .catch((e) => active && setError(e.response?.data?.message || "Không thể tải doanh thu"));
    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await adminOrderApi.exportRevenue(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `giao-dich${range.from ? `-${range.from}` : ""}${range.to ? `-${range.to}` : ""}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể xuất CSV");
    } finally {
      setExporting(false);
    }
  }

  const maxMonth = Math.max(1, ...(data?.monthly || []).map((m) => m.net));

  return (
    <>
      <header className="admin-page-header">
        <h1>Doanh thu</h1>
      </header>

      <div className="admin-filters ao-filters">
        <label className="ao-date">
          <span>Từ</span>
          <input
            className="form-control"
            type="date"
            value={range.from}
            max={range.to || undefined}
            onChange={(event) => setRange((r) => ({ ...r, from: event.target.value }))}
          />
        </label>
        <label className="ao-date">
          <span>Đến</span>
          <input
            className="form-control"
            type="date"
            value={range.to}
            min={range.from || undefined}
            onChange={(event) => setRange((r) => ({ ...r, to: event.target.value }))}
          />
        </label>
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={exporting}
          onClick={exportCsv}
        >
          {exporting ? "Đang xuất…" : "Xuất CSV"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!data ? (
        !error && <div className="spinner-border text-primary" />
      ) : (
        <>
          <div className="admin-overview-grid ar-cards">
            <article className="admin-report-card green">
              <span>Doanh thu thực nhận</span>
              <strong>{formatMoney(data.netRevenue)}</strong>
            </article>
            <article className="admin-report-card">
              <span>Đơn đã thanh toán</span>
              <strong>{data.paidOrders}</strong>
            </article>
            <article className="admin-report-card orange">
              <span>Chờ xác nhận</span>
              <strong>{formatMoney(data.awaitingAmount)}</strong>
              <small>{data.awaitingCount} đơn</small>
            </article>
          </div>

          <section className="ar-panel">
            <h2>Theo tháng</h2>
            {data.monthly.length ? (
              <ol className="ar-chart" aria-label="Doanh thu theo tháng">
                {data.monthly.map((month) => (
                  <li key={month.month}>
                    <span className="ar-bar-value">{formatMoney(month.net)}</span>
                    <span
                      className="ar-bar"
                      style={{ height: `${Math.max(2, (month.net / maxMonth) * 100)}%` }}
                      title={`${monthLabel(month.month)}: ${formatMoney(month.net)} · ${month.orders} đơn`}
                    />
                    <span className="ar-bar-label">{monthLabel(month.month)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="content-empty">Chưa có giao dịch trong khoảng này.</div>
            )}
          </section>

          <section className="ar-panel">
            <h2>Theo khóa học</h2>
            <div className="table-responsive admin-table-wrap">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Khóa học</th>
                    <th className="text-end">Số đơn</th>
                    <th className="text-end">Thực nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCourse.map((row) => (
                    <tr key={row.courseId}>
                      <td>
                        <strong>{row.courseTitle}</strong>
                      </td>
                      <td className="text-end">{row.orders}</td>
                      <td className="text-end">
                        <strong>{formatMoney(row.net)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.byCourse.length && <div className="content-empty m-3">Chưa có dữ liệu.</div>}
            </div>
          </section>
        </>
      )}
    </>
  );
}
