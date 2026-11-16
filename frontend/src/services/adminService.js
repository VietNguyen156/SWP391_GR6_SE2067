import axiosClient from "./axiosClient";

export const adminApi = {
  dashboard: async () => (await axiosClient.get("/admin/dashboard")).data,
  users: async () => (await axiosClient.get("/admin/users")).data,
  user: async (id) => (await axiosClient.get(`/admin/users/${id}`)).data,
  updateUserStatus: async (id, status) =>
    (await axiosClient.put(`/admin/users/${id}/status`, { status })).data,
  courses: async () => (await axiosClient.get("/admin/courses")).data,
  updateCourseStatus: async (id, status) =>
    (await axiosClient.put(`/admin/courses/${id}/status`, { status })).data,
  reports: async () => (await axiosClient.get("/admin/reports")).data,
};
