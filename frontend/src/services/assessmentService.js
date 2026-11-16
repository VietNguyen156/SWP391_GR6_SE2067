import axiosClient from "./axiosClient";

export const questionApi = {
  list: async () => (await axiosClient.get("/teacher/questions")).data,
  get: async (id) => (await axiosClient.get(`/teacher/questions/${id}`)).data,
  create: async (payload) => (await axiosClient.post("/teacher/questions", payload)).data,
  update: async (id, payload) => (await axiosClient.put(`/teacher/questions/${id}`, payload)).data,
  remove: async (id) => axiosClient.delete(`/teacher/questions/${id}`),
};

export const quizApi = {
  teacherList: async () => (await axiosClient.get("/teacher/quizzes")).data,
  teacherGet: async (id) => (await axiosClient.get(`/teacher/quizzes/${id}`)).data,
  create: async (payload) => (await axiosClient.post("/teacher/quizzes", payload)).data,
  update: async (id, payload) => (await axiosClient.put(`/teacher/quizzes/${id}`, payload)).data,
  remove: async (id) => axiosClient.delete(`/teacher/quizzes/${id}`),
  get: async (id) => (await axiosClient.get(`/quizzes/${id}`)).data,
  start: async (id) => (await axiosClient.post(`/quizzes/${id}/start`)).data,
  answer: async (attemptId, payload) =>
    (await axiosClient.post(`/attempts/${attemptId}/answers`, payload)).data,
  submit: async (attemptId) => (await axiosClient.post(`/attempts/${attemptId}/submit`)).data,
};

export const resultApi = {
  list: async () => (await axiosClient.get("/student/results")).data,
  get: async (id) => (await axiosClient.get(`/student/results/${id}`)).data,
};
