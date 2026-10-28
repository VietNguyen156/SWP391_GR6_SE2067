import axiosClient from "./axiosClient";

export const questionApi = {
  list: async () => (await axiosClient.get("/teacher/questions")).data,
  get: async (id) => (await axiosClient.get(`/teacher/questions/${id}`)).data,
  create: async (payload) => (await axiosClient.post("/teacher/questions", payload)).data,
  update: async (id, payload) => (await axiosClient.put(`/teacher/questions/${id}`, payload)).data,
  remove: async (id) => axiosClient.delete(`/teacher/questions/${id}`),
};
