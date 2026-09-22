import api from "./axiosClient";
export const getPackages = () => api.get("/packages").then(r => r.data);
export const getMentorPackages = () => api.get("/mentor/packages").then(r => r.data);
export const createPackage = data => api.post("/mentor/packages", data).then(r => r.data);
export const purchasePackage = id => api.post(`/student/packages/${id}/purchase`).then(r => r.data);
export const getSubscriptions = () => api.get("/student/subscriptions").then(r => r.data);
export const getPendingPayments = () => api.get("/admin/payments").then(r => r.data);
export const confirmPayment = id => api.post(`/admin/payments/${id}/confirm`).then(r => r.data);
