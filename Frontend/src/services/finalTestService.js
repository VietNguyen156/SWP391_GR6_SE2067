import axiosClient from "./axiosClient";

const teacher = (courseId) => `/teacher/courses/${courseId}/test`;
const student = (courseId) => `/student/courses/${courseId}/test`;
const attempt = (attemptId) => `/student/test/attempts/${attemptId}`;

export const finalTestApi = {
  catalog: async (courseId) => (await axiosClient.get(`${teacher(courseId)}/catalog`)).data,
  teacherGet: async (courseId) => (await axiosClient.get(teacher(courseId))).data,
  saveDraft: async (courseId, body) => (await axiosClient.put(teacher(courseId), body)).data,
  publish: async (courseId) => (await axiosClient.post(`${teacher(courseId)}/publish`)).data,
  remove: async (courseId) => (await axiosClient.delete(teacher(courseId))).data,
  show: async (courseId) => (await axiosClient.post(`${teacher(courseId)}/show`)).data,
  hide: async (courseId) => (await axiosClient.post(`${teacher(courseId)}/hide`)).data,
  teacherAttempts: async (courseId) =>
    (await axiosClient.get(`${teacher(courseId)}/attempts`)).data,
  teacherAttempt: async (courseId, attemptId) =>
    (await axiosClient.get(`${teacher(courseId)}/attempts/${attemptId}`)).data,
  grade: async (courseId, attemptId, sectionId, score, feedback) =>
    (
      await axiosClient.post(
        `${teacher(courseId)}/attempts/${attemptId}/sections/${sectionId}/grade`,
        { score, feedback },
      )
    ).data,
  studentInfo: async (courseId) => (await axiosClient.get(student(courseId))).data,
  studentResults: async () => (await axiosClient.get("/student/tests/results")).data,
  start: async (courseId) => (await axiosClient.post(`${student(courseId)}/start`)).data,
  attempt: async (attemptId) => (await axiosClient.get(attempt(attemptId))).data,
  answer: async (attemptId, sectionId, questionKey, optionId) =>
    (
      await axiosClient.put(`${attempt(attemptId)}/sections/${sectionId}/answer`, {
        questionKey,
        optionId,
      })
    ).data,
  recording: async (attemptId, sectionId, file) => {
    const form = new FormData();
    form.append("file", file);
    return (await axiosClient.post(`${attempt(attemptId)}/sections/${sectionId}/recording`, form))
      .data;
  },
  submit: async (attemptId) => (await axiosClient.post(`${attempt(attemptId)}/submit`)).data,
};
