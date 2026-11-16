import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorState from "../../components/common/ErrorState";
import Icon from "../../components/common/Icon";
import LoadingState from "../../components/common/LoadingState";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/Toast";
import { orderApi } from "../../services/orderService";
import { formatDateTime, formatMoney } from "../../utils/format";
import {
  ORDER_STEPS,
  formatCountdown,
  orderStatusLabel,
  orderStatusTone,
  orderStep,
} from "../../utils/orderStatus";

const POLL_MS = 15000;
const MAX_PROOF_BYTES = 5 * 1024 * 1024;

/** Đơn mua khóa học: QR chuyển khoản, báo đã chuyển, theo dõi trạng thái. */
export default function OrderPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);

  const open = order?.status === "PENDING" || order?.status === "AWAITING_CONFIRMATION";

  useEffect(() => {
    let active = true;
    orderApi
      .get(code)
      .then((data) => active && setOrder(data))
      .catch((e) => active && setError(e.response?.data?.message || "Không tìm thấy đơn hàng"));
    return () => {
      active = false;
    };
  }, [code]);

  // Đơn còn mở: hỏi lại trạng thái mỗi 15 giây (admin xác nhận / từ chối / hết hạn).
  useEffect(() => {
    if (!open) return undefined;
    const timer = setInterval(() => {
      orderApi
        .get(code)
        .then(setOrder)
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [code, open]);

  async function cancel() {
    const ok = await confirm({
      title: "Hủy đơn hàng?",
      message: "Chỉ hủy khi bạn chưa chuyển khoản. Bạn có thể tạo đơn mới sau.",
      confirmLabel: "Hủy đơn",
      cancelLabel: "Giữ đơn",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      setOrder(await orderApi.cancel(order.id));
      toast.success("Đã hủy đơn hàng.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Không thể hủy đơn");
    } finally {
      setBusy(false);
    }
  }

  async function createNew() {
    setBusy(true);
    try {
      const next = await orderApi.create(order.courseId);
      if (next.status === "PAID") navigate(`/courses/${order.courseId}`);
      else navigate(`/orders/${next.orderCode}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Không thể tạo đơn mới");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <main className="container py-5">
        <ErrorState
          title="Không tìm thấy đơn hàng"
          message={error}
          actions={[{ label: "Đơn hàng của tôi", to: "/results?tab=orders" }]}
        />
      </main>
    );
  }
  if (!order) return <LoadingState />;

  const step = orderStep(order.status);
  const closed = ["REJECTED", "EXPIRED", "CANCELLED"].includes(order.status);

  return (
    <main className="container od-page">
      <Link className="od-back" to={`/courses/${order.courseId}`}>
        <Icon name="back" size={16} /> {order.courseTitle}
      </Link>
      <header className="od-head">
        <div>
          <span className="od-kicker">Đơn hàng {order.orderCode}</span>
          <h1>Mua khóa học {order.courseTitle}</h1>
        </div>
        <span className={`od-status is-${orderStatusTone(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </header>

      {step != null && (
        <ol className="od-steps" aria-label="Tiến trình thanh toán">
          {ORDER_STEPS.map((label, index) => (
            <li
              key={label}
              className={
                index < step || step === 3 ? "is-done" : index === step ? "is-current" : ""
              }
              aria-current={index === step ? "step" : undefined}
            >
              <span>
                {index < step || step === 3 ? <Icon name="check" size={14} /> : index + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      )}

      {order.status === "PENDING" && (
        <TransferPanel
          order={order}
          busy={busy}
          onReport={() => setReporting(true)}
          onCancel={cancel}
        />
      )}

      {order.status === "AWAITING_CONFIRMATION" && (
        <section className="od-card od-wait">
          <Icon name="clock" size={28} />
          <h2>Đang chờ trung tâm xác nhận</h2>
          <p>
            Bạn đã báo chuyển khoản lúc {formatDateTime(order.studentReportedAt)}. Trang sẽ tự cập
            nhật khi đơn được xác nhận, thường trong giờ hành chính.
          </p>
          {order.studentNote && <p className="od-note">Ghi chú của bạn: {order.studentNote}</p>}
          <OrderSummary order={order} />
        </section>
      )}

      {order.status === "PAID" && (
        <section className="od-card od-success">
          <Icon name="check" size={32} />
          <h2>Thanh toán thành công</h2>
          <p>Bạn đã có quyền học khóa {order.courseTitle}. Hãy chọn một lớp để bắt đầu.</p>
          <Link className="btn btn-primary" to={`/courses/${order.courseId}`}>
            Chọn lớp ngay
          </Link>
          <OrderSummary order={order} />
        </section>
      )}

      {closed && (
        <section className="od-card od-closed">
          <h2>
            {order.status === "REJECTED"
              ? "Đơn hàng bị từ chối"
              : order.status === "EXPIRED"
                ? "Đơn hàng đã hết hạn"
                : "Đơn hàng đã hủy"}
          </h2>
          <p>
            {order.status === "EXPIRED"
              ? "Đã quá thời hạn chuyển khoản. Nếu bạn đã chuyển tiền, hãy liên hệ trung tâm kèm mã đơn để được xác nhận."
              : order.statusReason
                ? `Lý do: ${order.statusReason}`
                : "Bạn có thể tạo đơn mới bất cứ lúc nào."}
          </p>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={createNew}>
            {busy ? "Đang tạo đơn…" : "Tạo đơn mới"}
          </button>
        </section>
      )}

      {reporting && (
        <ReportDialog
          order={order}
          onClose={() => setReporting(false)}
          onDone={(next) => {
            setOrder(next);
            setReporting(false);
            toast.success("Đã gửi thông báo chuyển khoản. Trung tâm sẽ xác nhận sớm.");
          }}
        />
      )}
    </main>
  );
}

function TransferPanel({ order, busy, onReport, onCancel }) {
  const toast = useToast();
  const [qrFailed, setQrFailed] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = formatCountdown(order.expiresAt, now);

  const fields = [
    { label: "Ngân hàng", value: order.bank?.bankName },
    { label: "Số tài khoản", value: order.bank?.accountNo, copy: true },
    { label: "Chủ tài khoản", value: order.bank?.accountName },
    {
      label: "Số tiền",
      value: formatMoney(order.amount),
      copy: true,
      copyValue: String(order.amount),
    },
    { label: "Nội dung chuyển khoản", value: order.transferContent, copy: true, strong: true },
  ];

  async function copy(field) {
    try {
      await navigator.clipboard.writeText(field.copyValue ?? field.value);
      toast.success(`Đã sao chép ${field.label.toLowerCase()}`);
    } catch {
      toast.error("Trình duyệt không cho phép sao chép, hãy chép thủ công.");
    }
  }

  return (
    <section className="od-transfer">
      <div className="od-card od-qr">
        {order.qrImageUrl && !qrFailed ? (
          <img
            src={order.qrImageUrl}
            alt={`Mã QR chuyển ${formatMoney(order.amount)} cho đơn ${order.orderCode}`}
            width="280"
            height="280"
            onError={() => setQrFailed(true)}
          />
        ) : (
          <p className="od-qr-fallback">
            Không tải được mã QR. Hãy chuyển khoản thủ công theo thông tin bên cạnh.
          </p>
        )}
        <p>Mở ứng dụng ngân hàng và quét mã. Số tiền và nội dung đã được điền sẵn.</p>
        <p className={`od-countdown ${left ? "" : "is-over"}`}>
          {left ? (
            <>
              Hạn chuyển khoản còn <strong>{left}</strong>
            </>
          ) : (
            "Đã quá hạn chuyển khoản"
          )}
          <small>Hết hạn lúc {formatDateTime(order.expiresAt)}</small>
        </p>
      </div>

      <div className="od-card">
        <h2>Thông tin chuyển khoản</h2>
        <dl className="od-fields">
          {fields.map((field) => (
            <div key={field.label} className={field.strong ? "is-strong" : ""}>
              <dt>{field.label}</dt>
              <dd>
                <span>{field.value || "—"}</span>
                {field.copy && field.value && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => copy(field)}
                    aria-label={`Sao chép ${field.label.toLowerCase()}`}
                  >
                    Sao chép
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="od-warning" role="note">
          <Icon name="shield" size={18} />
          <span>
            Ghi <strong>chính xác</strong> nội dung <strong>{order.transferContent}</strong> và đúng
            số tiền. Sai nội dung, trung tâm sẽ không đối chiếu được giao dịch của bạn.
          </span>
        </div>
        <div className="od-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={onReport}>
            Tôi đã chuyển khoản
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            disabled={busy}
            onClick={onCancel}
          >
            Hủy đơn
          </button>
        </div>
      </div>
    </section>
  );
}

function OrderSummary({ order }) {
  return (
    <dl className="od-summary">
      <div>
        <dt>Mã đơn</dt>
        <dd>{order.orderCode}</dd>
      </div>
      <div>
        <dt>Số tiền</dt>
        <dd>{formatMoney(order.amount, { freeLabel: "Miễn phí" })}</dd>
      </div>
      <div>
        <dt>Ngày tạo</dt>
        <dd>{formatDateTime(order.createdAt)}</dd>
      </div>
    </dl>
  );
}

function ReportDialog({ order, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [proof, setProof] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  function pickFile(event) {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_PROOF_BYTES) {
      setError("Ảnh biên lai tối đa 5MB.");
      event.target.value = "";
      setProof(null);
      return;
    }
    setError("");
    setProof(file);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      onDone(await orderApi.reportPaid(order.id, { note: note.trim(), proof }));
    } catch (e) {
      setError(e.response?.data?.message || "Không thể gửi thông báo");
      setSaving(false);
    }
  }

  return (
    <div className="confirm-backdrop" onMouseDown={() => !saving && onClose()}>
      <form
        className="confirm-dialog od-report"
        role="dialog"
        aria-modal="true"
        aria-labelledby="od-report-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id="od-report-title">Báo đã chuyển khoản</h2>
        <p>
          Đơn {order.orderCode} · {formatMoney(order.amount)}. Tải lên ảnh biên lai chuyển khoản để
          trung tâm đối chiếu và xác nhận.
        </p>
        {error && <div className="alert alert-danger w-100 mb-0">{error}</div>}
        <label className="w-100 text-start">
          <span className="form-label">Ghi chú (không bắt buộc)</span>
          <textarea
            className="form-control"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ví dụ: chuyển từ tài khoản Nguyễn Văn A lúc 9h15"
          />
        </label>
        <label className="w-100 text-start">
          <span className="form-label">Ảnh biên lai (bắt buộc · JPG, PNG, WEBP, tối đa 5MB)</span>
          <input
            className="form-control"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={pickFile}
          />
        </label>
        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={saving}
            onClick={onClose}
          >
            Để sau
          </button>
          {/* Chưa có ảnh biên lai thì chưa gửi được. */}
          <button type="submit" className="btn btn-primary" disabled={saving || !proof}>
            {saving ? "Đang gửi…" : "Gửi xác nhận"}
          </button>
        </div>
      </form>
    </div>
  );
}
