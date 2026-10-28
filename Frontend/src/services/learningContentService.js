import axiosClient from "./axiosClient";
import { getMediaBlob } from "./mediaBlob";

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
  // Tệp / link đính kèm của từng phần giải thích (contentId)
  uploadAttachment: async (contentId, file, title, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    return (
      await axiosClient.post(`/teacher/grammar/content/${contentId}/attachments/file`, form, {
        timeout: 300000,
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
    ).data;
  },
  addLink: async (contentId, data) =>
    (await axiosClient.post(`/teacher/grammar/content/${contentId}/attachments/link`, data)).data,
  updateAttachment: async (id, data) =>
    (await axiosClient.put(`/teacher/grammar/attachments/${id}`, data)).data,
  reorderAttachments: async (contentId, ids) =>
    axiosClient.put(`/teacher/grammar/content/${contentId}/attachments/reorder`, { ids }),
  deleteAttachment: async (id) => axiosClient.delete(`/teacher/grammar/attachments/${id}`),
  /** File đính kèm dạng Blob (cần token nên không dùng thẳng URL trong src/href). */
  attachmentBlob: async (id, kind) => getMediaBlob(`/grammar/attachments/${id}/file`, kind),
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

export const readingApi = {
  teacherList: async () => (await axiosClient.get("/teacher/reading")).data,
  teacherGet: async (id) => (await axiosClient.get(`/teacher/reading/${id}`)).data,
  teacherCreate: async (data) => (await axiosClient.post("/teacher/reading", data)).data,
  teacherUpdate: async (id, data) => (await axiosClient.put(`/teacher/reading/${id}`, data)).data,
  teacherDelete: async (id) => axiosClient.delete(`/teacher/reading/${id}`),
  publish: async (id) => (await axiosClient.post(`/teacher/reading/${id}/publish`)).data,
  // Tệp đính kèm (cùng tên hàm với grammarApi để AttachmentManager / AttachmentList dùng chung)
  uploadAttachment: async (id, file, title, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    return (
      await axiosClient.post(`/teacher/reading/${id}/attachments/file`, form, {
        timeout: 300000,
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
    ).data;
  },
  updateAttachment: async (id, data) =>
    (await axiosClient.put(`/teacher/reading/attachments/${id}`, data)).data,
  reorderAttachments: async (id, ids) =>
    axiosClient.put(`/teacher/reading/${id}/attachments/reorder`, { ids }),
  deleteAttachment: async (id) => axiosClient.delete(`/teacher/reading/attachments/${id}`),
  attachmentBlob: async (id, kind) => getMediaBlob(`/reading/attachments/${id}/file`, kind),
  studentGet: async (id) => (await axiosClient.get(`/reading/${id}`)).data,
  result: async (id) => {
    const response = await axiosClient.get(`/reading/${id}/result`);
    return response.status === 204 ? null : response.data;
  },
  submit: async (id, answers) =>
    (await axiosClient.post(`/reading/${id}/submit`, { answers })).data,
};

export const speakingApi = {
  teacherList: async () => (await axiosClient.get("/teacher/speaking")).data,
  teacherGet: async (id) => (await axiosClient.get(`/teacher/speaking/${id}`)).data,
  teacherCreate: async (data) => (await axiosClient.post("/teacher/speaking", data)).data,
  teacherUpdate: async (id, data) => (await axiosClient.put(`/teacher/speaking/${id}`, data)).data,
  teacherDelete: async (id) => axiosClient.delete(`/teacher/speaking/${id}`),
  submissions: async (id) => (await axiosClient.get(`/teacher/speaking/${id}/submissions`)).data,
  audio: async (submissionId) =>
    getMediaBlob(`/teacher/speaking/submissions/${submissionId}/audio`, "audio"),
  grade: async (id, data) =>
    (await axiosClient.put(`/teacher/speaking/submissions/${id}/grade`, data)).data,
  studentGet: async (id) => (await axiosClient.get(`/speaking/${id}`)).data,
  studentSubmission: async (id) => {
    const response = await axiosClient.get(`/speaking/${id}/submission`);
    return response.status === 204 ? null : response.data;
  },
  studentAudio: async (submissionId) =>
    getMediaBlob(`/speaking/submissions/${submissionId}/audio`, "audio"),
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
  /** Danh sách flashcard dùng dữ liệu học liệu đã mở từ endpoint hiện có. */
  get: async () => (await axiosClient.get("/student/review")).data,
};
