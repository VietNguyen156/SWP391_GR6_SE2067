import axiosClient from "./axiosClient";

export const grammarApi = {
  teacherList: async () => (await axiosClient.get("/teacher/grammar/topics")).data,
  teacherGet: async (id) => (await axiosClient.get(`/teacher/grammar/topics/${id}`)).data,
  createTopic: async (data) => (await axiosClient.post("/teacher/grammar/topics", data)).data,
  updateTopic: async (id, data) =>
    (await axiosClient.put(`/teacher/grammar/topics/${id}`, data)).data,
  deleteTopic: async (id) => axiosClient.delete(`/teacher/grammar/topics/${id}`),
  addContent: async (topicId, data) =>
    (await axiosClient.post(`/teacher/grammar/${topicId}/contents`, data)).data,
  updateContent: async (id, data) =>
    (await axiosClient.put(`/teacher/grammar/content/${id}`, data)).data,
  deleteContent: async (id) => axiosClient.delete(`/teacher/grammar/content/${id}`),
  get: async (id) => (await axiosClient.get(`/grammar/topics/${id}`)).data,
  complete: async (id) => (await axiosClient.post(`/grammar/${id}/complete`)).data,
};

export const flashcardApi = {
  teacherList: async () => (await axiosClient.get("/teacher/flashcards")).data,
  teacherGet: async (id) => (await axiosClient.get(`/teacher/flashcards/${id}`)).data,
  teacherCreate: async (data) => (await axiosClient.post("/teacher/flashcards", data)).data,
  teacherUpdate: async (id, data) =>
    (await axiosClient.put(`/teacher/flashcards/${id}`, data)).data,
  teacherDelete: async (id) => axiosClient.delete(`/teacher/flashcards/${id}`),
  get: async (id) => (await axiosClient.get(`/flashcards/${id}`)).data,
  progress: async (cardId, memoryStatus) =>
    (await axiosClient.put(`/flashcards/${cardId}/progress`, { memoryStatus })).data,
  personalCreate: async (data) => (await axiosClient.post("/student/flashcards", data)).data,
  personalUpdate: async (id, data) =>
    (await axiosClient.put(`/student/flashcards/${id}`, data)).data,
  personalDelete: async (id) => axiosClient.delete(`/student/flashcards/${id}`),
};

export const listeningApi = {
  teacherList: async () => (await axiosClient.get("/teacher/listening")).data,
  teacherGet: async (id) => (await axiosClient.get(`/teacher/listening/${id}`)).data,
  teacherCreate: async (data) => (await axiosClient.post("/teacher/listening", data)).data,
  teacherUpdate: async (id, data) => (await axiosClient.put(`/teacher/listening/${id}`, data)).data,
  teacherDelete: async (id) => axiosClient.delete(`/teacher/listening/${id}`),
  uploadAudio: async (file) => {
    const fd = new FormData();
    fd.append("audio", file);
    return (await axiosClient.post("/teacher/listening/upload-audio", fd, { timeout: 120000 }))
      .data;
  },
  studentGet: async (id) => (await axiosClient.get(`/listening/${id}`)).data,
  result: async (id) => {
    const response = await axiosClient.get(`/listening/${id}/result`);
    return response.status === 204 ? null : response.data;
  },
  submit: async (id, answers) =>
    (await axiosClient.post(`/listening/${id}/submit`, { answers })).data,
};

export const speakingApi = {
  teacherList: async () => (await axiosClient.get("/teacher/speaking")).data,
  teacherGet: async (id) => (await axiosClient.get(`/teacher/speaking/${id}`)).data,
  teacherCreate: async (data) => (await axiosClient.post("/teacher/speaking", data)).data,
  teacherUpdate: async (id, data) => (await axiosClient.put(`/teacher/speaking/${id}`, data)).data,
  teacherDelete: async (id) => axiosClient.delete(`/teacher/speaking/${id}`),
  submissions: async (id) => (await axiosClient.get(`/teacher/speaking/${id}/submissions`)).data,
  audio: async (submissionId) =>
    (
      await axiosClient.get(`/teacher/speaking/submissions/${submissionId}/audio`, {
        responseType: "blob",
      })
    ).data,
  grade: async (id, data) =>
    (await axiosClient.put(`/teacher/speaking/submissions/${id}/grade`, data)).data,
  studentGet: async (id) => (await axiosClient.get(`/speaking/${id}`)).data,
  studentSubmission: async (id) => {
    const response = await axiosClient.get(`/speaking/${id}/submission`);
    return response.status === 204 ? null : response.data;
  },
  studentAudio: async (submissionId) =>
    (await axiosClient.get(`/speaking/submissions/${submissionId}/audio`, { responseType: "blob" }))
      .data,
  submit: async (id, file) => {
    const fd = new FormData();
    fd.append("audio", file, file.name || `speaking-${id}.webm`);
    return (
      await axiosClient.post(`/speaking/${id}/submit`, fd, {
        timeout: 120000,
        headers: { Accept: "application/json" },
      })
    ).data;
  },
};

export const reviewApi = {
  /** Trang Ôn tập: { personalFlashcardSets, grammar, flashcardSets } — chỉ học liệu đã mở. */
  get: async () => (await axiosClient.get("/student/review")).data,
};
