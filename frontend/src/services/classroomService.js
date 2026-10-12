import axiosClient from "./axiosClient";
export const classroomApi = {
  teacherList: async () => (await axiosClient.get("/teacher/classes")).data,
  teacherGet: async (id) => (await axiosClient.get(`/teacher/classes/${id}`)).data,
  create: async (payload) => (await axiosClient.post("/teacher/classes", payload)).data,
  update: async (id, payload) => (await axiosClient.put(`/teacher/classes/${id}`, payload)).data,
  remove: async (id) => axiosClient.delete(`/teacher/classes/${id}`),
  students: async (id) => (await axiosClient.get(`/teacher/classes/${id}/students`)).data,
  submissions: async (id) => (await axiosClient.get(`/teacher/classes/${id}/submissions`)).data,
  join: async (id) => (await axiosClient.post(`/classes/${id}/join`)).data,
  studentList: async () => (await axiosClient.get("/student/classes")).data,
  courseClasses: async (courseId) =>
    (await axiosClient.get(`/student/courses/${courseId}/classes`)).data,
  studentGet: async (id) => (await axiosClient.get(`/student/classes/${id}`)).data,
  studentProgress: async (id) => (await axiosClient.get(`/student/classes/${id}/progress`)).data,
  adminList: async () => (await axiosClient.get("/admin/classes")).data,
};
