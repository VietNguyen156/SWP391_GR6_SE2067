import axiosClient from "./axiosClient";
import { getMediaBlob } from "./mediaBlob";

const BASE = "/teacher/test-bank";

/** CRUD + xuất bản/ẩn cho một loại nội dung của Ngân hàng đề thi (listening | reading | speaking). */
const crud = (type) => ({
  list: async () => (await axiosClient.get(`${BASE}/${type}`)).data,
  get: async (id) => (await axiosClient.get(`${BASE}/${type}/${id}`)).data,
  create: async (data) => (await axiosClient.post(`${BASE}/${type}`, data)).data,
  update: async (id, data) => (await axiosClient.put(`${BASE}/${type}/${id}`, data)).data,
  remove: async (id) => axiosClient.delete(`${BASE}/${type}/${id}`),
  publish: async (id) => (await axiosClient.post(`${BASE}/${type}/${id}/publish`)).data,
  hide: async (id) => (await axiosClient.post(`${BASE}/${type}/${id}/hide`)).data,
});

export const testBankApi = {
  listening: {
    ...crud("listening"),
    uploadAudio: async (file) => {
      const fd = new FormData();
      fd.append("audio", file);
      return (await axiosClient.post(`${BASE}/listening/upload-audio`, fd, { timeout: 120000 }))
        .data;
    },
  },
  reading: {
    ...crud("reading"),
    // Cùng tên hàm với readingApi/grammarApi để AttachmentManager / AttachmentList dùng chung.
    uploadAttachment: async (id, file, title, onProgress) => {
      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);
      return (
        await axiosClient.post(`${BASE}/reading/${id}/attachments/file`, form, {
          timeout: 300000,
          onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
        })
      ).data;
    },
    updateAttachment: async (id, data) =>
      (await axiosClient.put(`${BASE}/reading/attachments/${id}`, data)).data,
    reorderAttachments: async (id, ids) =>
      axiosClient.put(`${BASE}/reading/${id}/attachments/reorder`, { ids }),
    deleteAttachment: async (id) => axiosClient.delete(`${BASE}/reading/attachments/${id}`),
    attachmentBlob: async (id, kind) =>
      getMediaBlob(`${BASE}/reading/attachments/${id}/file`, kind),
  },
  speaking: crud("speaking"),
  // Bộ đề: nhóm nhiều câu hỏi của ngân hàng câu hỏi.
  "question-sets": crud("question-sets"),
};
