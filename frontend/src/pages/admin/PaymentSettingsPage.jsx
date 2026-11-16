import { useEffect, useState } from "react";
import { useToast } from "../../components/common/Toast";
import { adminOrderApi } from "../../services/orderService";
import { formatDateTime } from "../../utils/format";

// Khớp kiểm tra phía backend (PaymentDto.SettingsRequest).
const RULES = {
  bankBin: [/^\d{6}$/, "Mã BIN gồm đúng 6 chữ số (VD: 970436 = Vietcombank)."],
  accountNo: [/^\d{6,19}$/, "Số tài khoản gồm 6–19 chữ số."],
  accountName: [/^[A-Z ]+$/, "Tên chủ tài khoản in hoa, không dấu (VD: NGUYEN VAN A)."],
  transferPrefix: [/^[A-Z0-9]{1,6}$/, "Tiền tố 1–6 ký tự in hoa hoặc số."],
};
const EMPTY = {
  bankBin: "",
  bankName: "",
  accountNo: "",
  accountName: "",
  transferPrefix: "TP",
  orderExpiryHours: 48,
  note: "",
};

/** Bỏ dấu tiếng Việt và viết hoa để tên chủ tài khoản khớp định dạng ngân hàng. */
const toAccountName = (value) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "D")
    .toUpperCase()
    .replace(/[^A-Z ]/g, "");

export default function PaymentSettingsPage() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(null);
  const [state, setState] = useState({ loading: true, saving: false, error: "" });

  useEffect(() => {
    adminOrderApi
      .settings()
      .then((data) => {
        setSaved(data);
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? EMPTY[k]])),
        });
        setState({ loading: false, saving: false, error: "" });
      })
      .catch((e) =>
        setState({
          loading: false,
          saving: false,
          error:
            e.response?.status === 404
              ? ""
              : e.response?.data?.message || "Không thể tải cài đặt thanh toán",
        }),
      );
  }, []);

  const errors = Object.fromEntries(
    Object.entries(RULES)
      .filter(([key, [pattern]]) => form[key] !== "" && !pattern.test(form[key]))
      .map(([key, [, message]]) => [key, message]),
  );
  const hours = Number(form.orderExpiryHours);
  if (!Number.isInteger(hours) || hours < 1 || hours > 720)
    errors.orderExpiryHours = "Thời hạn từ 1 đến 720 giờ.";
  const complete = form.bankBin && form.bankName.trim() && form.accountNo && form.accountName;
  const set =
    (key, transform = (v) => v) =>
    (event) =>
      setForm((f) => ({ ...f, [key]: transform(event.target.value) }));

  async function submit(event) {
    event.preventDefault();
    setState((s) => ({ ...s, saving: true, error: "" }));
    try {
      const data = await adminOrderApi.saveSettings({
        ...form,
        bankName: form.bankName.trim(),
        accountName: form.accountName.trim().replace(/\s+/g, " "),
        orderExpiryHours: hours,
        note: form.note.trim() || null,
      });
      setSaved(data);
      toast.success("Đã lưu cài đặt thanh toán. Đơn mới sẽ dùng tài khoản này.");
      setState((s) => ({ ...s, saving: false }));
    } catch (e) {
      setState((s) => ({
        ...s,
        saving: false,
        error: e.response?.data?.message || "Không thể lưu cài đặt",
      }));
    }
  }

  if (state.loading) return <div className="spinner-border text-primary" />;

  return (
    <>
      <header className="admin-page-header">
        <h1>Cài đặt thanh toán</h1>
      </header>
      {state.error && <div className="alert alert-danger">{state.error}</div>}

      <div className="ps-layout">
        <form className="ar-panel ps-form" onSubmit={submit} noValidate>
          <div className="ps-row">
            <Field label="Mã BIN ngân hàng" error={errors.bankBin}>
              <input
                className={`form-control ${errors.bankBin ? "is-invalid" : ""}`}
                inputMode="numeric"
                maxLength={6}
                required
                value={form.bankBin}
                onChange={set("bankBin", (v) => v.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="Tên ngân hàng">
              <input
                className="form-control"
                maxLength={100}
                required
                value={form.bankName}
                onChange={set("bankName")}
              />
            </Field>
          </div>
          <Field label="Số tài khoản" error={errors.accountNo}>
            <input
              className={`form-control ${errors.accountNo ? "is-invalid" : ""}`}
              inputMode="numeric"
              maxLength={19}
              required
              value={form.accountNo}
              onChange={set("accountNo", (v) => v.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="Tên chủ tài khoản" error={errors.accountName}>
            <input
              className={`form-control ${errors.accountName ? "is-invalid" : ""}`}
              maxLength={100}
              required
              value={form.accountName}
              onChange={set("accountName", toAccountName)}
            />
          </Field>
          <div className="ps-row">
            <Field label="Tiền tố nội dung CK" error={errors.transferPrefix}>
              <input
                className={`form-control ${errors.transferPrefix ? "is-invalid" : ""}`}
                maxLength={6}
                required
                value={form.transferPrefix}
                onChange={set("transferPrefix", (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              />
            </Field>
            <Field label="Hạn chuyển khoản (giờ)" error={errors.orderExpiryHours}>
              <input
                className={`form-control ${errors.orderExpiryHours ? "is-invalid" : ""}`}
                type="number"
                min="1"
                max="720"
                required
                value={form.orderExpiryHours}
                onChange={set("orderExpiryHours")}
              />
            </Field>
          </div>
          <Field label="Lưu ý hiển thị cho học viên">
            <textarea
              className="form-control"
              rows={2}
              maxLength={1000}
              value={form.note || ""}
              onChange={set("note")}
            />
          </Field>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={state.saving || !complete || Object.keys(errors).length > 0}
          >
            {state.saving ? "Đang lưu…" : "Lưu cài đặt"}
          </button>
          {saved?.updatedAt && (
            <small className="ps-meta">
              Cập nhật {formatDateTime(saved.updatedAt)}
              {saved.updatedByName ? ` bởi ${saved.updatedByName}` : ""}
            </small>
          )}
        </form>

        <aside className="ar-panel ps-preview">
          <h2>QR mẫu đã lưu</h2>
          {saved?.sampleQrImageUrl ? (
            <>
              <img
                src={saved.sampleQrImageUrl}
                alt="Mã QR mẫu 10.000 đ, nội dung TPTEST01"
                width="240"
                height="240"
              />
              <p>
                10.000 đ · nội dung <code>TPTEST01</code>. Quét thử bằng ứng dụng ngân hàng để kiểm
                tra tên chủ tài khoản trước khi nhận đơn thật.
              </p>
            </>
          ) : (
            <p>Lưu cài đặt để xem mã QR mẫu.</p>
          )}
        </aside>
      </div>
    </>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="ps-field">
      <span className="form-label">{label}</span>
      {children}
      {error && <span className="invalid-feedback d-block">{error}</span>}
    </label>
  );
}
