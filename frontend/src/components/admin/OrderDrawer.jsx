import { useEffect, useState } from "react";
import Icon from "../common/Icon";
import { useConfirm } from "../common/ConfirmDialog";
import { useToast } from "../common/Toast";
import { ORDERS_CHANGED } from "./AdminSidebar";
import { adminOrderApi } from "../../services/orderService";
import { formatDateTime, formatMoney, toDateTimeInput } from "../../utils/format";
import { PAYMENT_METHOD_LABELS, orderStatusLabel, orderStatusTone } from "../../utils/orderStatus";

const CONFIRMABLE = ["PENDING", "AWAITING_CONFIRMATION", "EXPIRED"];

/** Ngăn chi tiết đơn: thông tin, biên lai, lịch sử và thao tác xác nhận / từ chối. */
export default function OrderDrawer({ id, onClose, onChanged }) {
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  useEffect(() => {
    let active = true;
    adminOrderApi
      .get(id)
      .then((data) => active && setOrder(data))
      .catch((e) => active && setError(e.response?.data?.message || "Không thể tải đơn hàng"));
    return () => {
      active = false;
    };
  }, [id]);

  // Ảnh biên lai cần token nên tải qua axios rồi hiện bằng object URL.
  useEffect(() => {
    if (!order?.hasProof) return undefined;
    let url = "";
    let active = true;
    adminOrderApi
      .proof(order.id)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setProofUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [order?.id, order?.hasProof]);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function changed(next, message) {
    setOrder(next);
    toast.success(message);
    onChanged();
    window.dispatchEvent(new Event(ORDERS_CHANGED));
  }

  return (
    <div className="ao-backdrop" onMouseDown={onClose}>
      <aside
        className="ao-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ao-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="ao-close" onClick={onClose} aria-label="Đóng">
          <Icon name="close" />
        </button>
        {error && <div className="alert alert-danger">{error}</div>}
        {!order ? (
          !error && <div className="spinner-border text-primary" />
        ) : (
          <>
            <span className={`od-status is-${orderStatusTone(order.status)}`}>
              {orderStatusLabel(order.status)}
            </span>
            <h2 id="ao-drawer-title">Đơn {order.orderCode}</h2>

            <dl className="ao-info">
              <Row label="Học viên">
                {order.studentName}
                <small>{order.studentEmail}</small>
              </Row>
              <Row label="Khóa học">{order.courseTitle}</Row>
              <Row label="Số tiền đơn">
                <strong>{formatMoney(order.amount)}</strong>
              </Row>
              <Row label="Hình thức">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Row>
              {order.transferContent && (
                <Row label="Nội dung CK">
                  <code>{order.transferContent}</code>
                </Row>
              )}
              <Row label="Tạo lúc">{formatDateTime(order.createdAt)}</Row>
              {order.expiresAt && <Row label="Hạn chuyển">{formatDateTime(order.expiresAt)}</Row>}
              {order.studentReportedAt && (
                <Row label="Báo đã chuyển">{formatDateTime(order.studentReportedAt)}</Row>
              )}
              {order.studentNote && <Row label="Ghi chú HV">{order.studentNote}</Row>}
            </dl>

            {order.hasProof && (
              <section className="ao-section">
                <h3>Ảnh biên lai</h3>
                {proofUrl ? (
                  <a href={proofUrl} target="_blank" rel="noreferrer">
                    <img className="ao-proof" src={proofUrl} alt="Ảnh biên lai học viên gửi" />
                  </a>
                ) : (
                  <div className="spinner-border spinner-border-sm text-primary" />
                )}
              </section>
            )}

            {order.receipt && <ReceiptInfo receipt={order.receipt} />}

            {CONFIRMABLE.includes(order.status) && (
              <>
                <ConfirmForm
                  order={order}
                  onDone={(next) => changed(next, "Đã xác nhận thanh toán.")}
                />
                <RejectForm order={order} onDone={(next) => changed(next, "Đã từ chối đơn.")} />
              </>
            )}

            <section className="ao-section">
              <h3>Lịch sử trạng thái</h3>
              <ol className="ao-history">
                {(order.history || []).map((item, index) => (
                  <li key={index}>
                    <strong>
                      {item.fromStatus ? `${orderStatusLabel(item.fromStatus)} → ` : ""}
                      {orderStatusLabel(item.toStatus)}
                    </strong>
                    <small>
                      {formatDateTime(item.createdAt)} · {item.changedByName || "Hệ thống"}
                    </small>
                    {item.reason && <p>{item.reason}</p>}
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ReceiptInfo({ receipt }) {
  return (
    <section className="ao-section">
      <h3>Hồ sơ nhận tiền</h3>
      <dl className="ao-info">
        <Row label="Đã nhận">
          <strong>{formatMoney(receipt.receivedAmount)}</strong>
        </Row>
        {receipt.bankTransactionRef && <Row label="Mã GD">{receipt.bankTransactionRef}</Row>}
        <Row label="Nhận lúc">{formatDateTime(receipt.receivedAt)}</Row>
        <Row label="Xác nhận">
          {receipt.confirmedByName || "Hệ thống"} · {formatDateTime(receipt.confirmedAt)}
        </Row>
        {receipt.adminNote && <Row label="Ghi chú">{receipt.adminNote}</Row>}
      </dl>
    </section>
  );
}

function useSubmit(onDone) {
  const [state, setState] = useState({ busy: false, error: "" });
  async function run(action) {
    setState({ busy: true, error: "" });
    try {
      onDone(await action());
      setState({ busy: false, error: "" });
    } catch (e) {
      setState({ busy: false, error: e.response?.data?.message || "Thao tác thất bại" });
    }
  }
  return [state, run];
}

function ConfirmForm({ order, onDone }) {
  const confirm = useConfirm();
  const [form, setForm] = useState({
    receivedAmount: String(order.amount),
    bankTransactionRef: "",
    receivedAt: toDateTimeInput(new Date()),
    note: "",
  });
  const [state, run] = useSubmit(onDone);
  const amount = Number(form.receivedAmount);
  const validAmount = form.receivedAmount !== "" && Number.isInteger(amount) && amount >= 0;
  const mismatch = validAmount && amount !== order.amount;
  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    const ok = await confirm({
      title: "Xác nhận đã nhận tiền?",
      message: `Đơn ${order.orderCode} sẽ chuyển sang Đã thanh toán và học viên được chọn lớp. Đã nhận ${formatMoney(amount)}.`,
      confirmLabel: "Xác nhận",
    });
    if (!ok) return;
    run(() =>
      adminOrderApi.confirm(order.id, {
        receivedAmount: amount,
        bankTransactionRef: form.bankTransactionRef.trim() || null,
        receivedAt: form.receivedAt || null,
        note: form.note.trim() || null,
        force: mismatch,
      }),
    );
  }

  return (
    <form className="ao-section ao-form" onSubmit={submit}>
      <h3>Xác nhận đã nhận tiền</h3>
      {order.status === "EXPIRED" && (
        <p className="ao-hint">
          Đơn đã hết hạn — chỉ xác nhận khi sao kê có giao dịch chuyển muộn.
        </p>
      )}
      <label>
        <span>Số tiền nhận (đ)</span>
        <input
          className="form-control"
          type="number"
          min="0"
          step="1"
          required
          value={form.receivedAmount}
          onChange={set("receivedAmount")}
        />
      </label>
      {mismatch && (
        <div className="alert alert-warning mb-0">
          Lệch {formatMoney(Math.abs(amount - order.amount))} so với số tiền đơn{" "}
          {formatMoney(order.amount)}. Bắt buộc ghi chú lý do.
        </div>
      )}
      <div className="ao-form-row">
        <label>
          <span>Mã giao dịch ngân hàng</span>
          <input
            className="form-control"
            maxLength={100}
            value={form.bankTransactionRef}
            onChange={set("bankTransactionRef")}
            placeholder="FT2628…"
          />
        </label>
        <label>
          <span>Thời điểm nhận</span>
          <input
            className="form-control"
            type="datetime-local"
            value={form.receivedAt}
            max={toDateTimeInput(new Date())}
            onChange={set("receivedAt")}
          />
        </label>
      </div>
      <label>
        <span>Ghi chú{mismatch ? " (bắt buộc)" : ""}</span>
        <textarea
          className="form-control"
          rows={2}
          maxLength={2000}
          required={mismatch}
          value={form.note}
          onChange={set("note")}
        />
      </label>
      {state.error && <div className="alert alert-danger mb-0">{state.error}</div>}
      <button
        type="submit"
        className="btn btn-success"
        disabled={state.busy || !validAmount || (mismatch && !form.note.trim())}
      >
        {state.busy ? "Đang xác nhận…" : "Xác nhận thanh toán"}
      </button>
    </form>
  );
}

function RejectForm({ order, onDone }) {
  const [reason, setReason] = useState("");
  const [state, run] = useSubmit(onDone);
  return (
    <form
      className="ao-section ao-form"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => adminOrderApi.reject(order.id, reason.trim()));
      }}
    >
      <h3>Từ chối đơn</h3>
      <label>
        <span>Lý do (học viên sẽ thấy)</span>
        <textarea
          className="form-control"
          rows={2}
          maxLength={2000}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ví dụ: Không tìm thấy giao dịch với nội dung này trong sao kê"
        />
      </label>
      {state.error && <div className="alert alert-danger mb-0">{state.error}</div>}
      <button
        type="submit"
        className="btn btn-outline-danger"
        disabled={state.busy || !reason.trim()}
      >
        {state.busy ? "Đang từ chối…" : "Từ chối đơn"}
      </button>
    </form>
  );
}
