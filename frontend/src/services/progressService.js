import axiosClient from "./axiosClient";

export const progressApi = {
  overall: async () => (await axiosClient.get("/student/progress")).data,
  course: async (id) => (await axiosClient.get(`/student/courses/${id}/progress`)).data,
  history: async () => (await axiosClient.get("/student/history")).data,
  statistics: async () => (await axiosClient.get("/student/statistics")).data,
  teacherDashboard: async () => (await axiosClient.get("/teacher/dashboard")).data,
};
