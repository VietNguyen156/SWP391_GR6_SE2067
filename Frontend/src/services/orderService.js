import axiosClient from "./axiosClient";

/** Mua khóa học (học viên). Số tiền luôn do backend đọc từ DB, không gửi từ client. */
export const orderApi = {
  create: async (courseId) => (await axiosClient.post("/student/orders", { courseId })).data,
  mine: async () => (await axiosClient.get("/student/orders")).data,
  get: async (code) => (await axiosClient.get(`/student/orders/${code}`)).data,
  reportPaid: async (id, { note, proof }) => {
    const form = new FormData();
    if (note) form.append("note", note);
    if (proof) form.append("proof", proof);
    return (await axiosClient.post(`/student/orders/${id}/report-paid`, form)).data;
  },
  cancel: async (id) => (await axiosClient.post(`/student/orders/${id}/cancel`)).data,
  purchase: async (courseId) =>
    (await axiosClient.get(`/student/courses/${courseId}/purchase`)).data,
};

/** Đơn hàng, doanh thu, cài đặt thanh toán (admin). */
export const adminOrderApi = {
  list: async (params) => (await axiosClient.get("/admin/orders", { params })).data,
  counts: async () => (await axiosClient.get("/admin/orders/counts")).data,
  get: async (id) => (await axiosClient.get(`/admin/orders/${id}`)).data,
  proof: async (id) =>
    (await axiosClient.get(`/admin/orders/${id}/proof`, { responseType: "blob" })).data,
  confirm: async (id, payload) =>
    (await axiosClient.post(`/admin/orders/${id}/confirm`, payload)).data,
  reject: async (id, reason) =>
    (await axiosClient.post(`/admin/orders/${id}/reject`, { reason })).data,
  revenue: async (params) => (await axiosClient.get("/admin/revenue", { params })).data,
  exportRevenue: async (params) =>
    (await axiosClient.get("/admin/revenue/export", { params, responseType: "blob" })).data,
  settings: async () => (await axiosClient.get("/admin/payment-settings")).data,
  saveSettings: async (payload) => (await axiosClient.put("/admin/payment-settings", payload)).data,
  setPrice: async (courseId, price) =>
    (await axiosClient.put(`/admin/courses/${courseId}/price`, { price })).data,
};
