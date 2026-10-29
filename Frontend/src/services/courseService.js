import axiosClient from "./axiosClient";

export async function getTeacherCourses() {
  return (await axiosClient.get("/teacher/courses")).data;
}
export async function getTeacherCourse(id) {
  return (await axiosClient.get(`/teacher/courses/${id}`)).data;
}
export async function createCourse(payload) {
  return (await axiosClient.post("/teacher/courses", payload)).data;
}
export async function updateCourse(id, payload) {
  return (await axiosClient.put(`/teacher/courses/${id}`, payload)).data;
}
export async function deleteCourse(id) {
  return axiosClient.delete(`/teacher/courses/${id}`);
}
export async function getTeacherLesson(id) {
  return (await axiosClient.get(`/teacher/lessons/${id}`)).data;
}
export async function createLesson(payload) {
  return (await axiosClient.post("/teacher/lessons", payload)).data;
}
export async function updateLesson(id, payload) {
  return (await axiosClient.put(`/teacher/lessons/${id}`, payload)).data;
}
export async function deleteLesson(id) {
  return axiosClient.delete(`/teacher/lessons/${id}`);
}
export async function getCourses() {
  return (await axiosClient.get("/courses")).data;
}
export async function getCourse(id) {
  return (await axiosClient.get(`/courses/${id}`)).data;
}
export async function getLesson(id) {
  return (await axiosClient.get(`/lessons/${id}`)).data;
}
export async function startLesson(id) {
  return (await axiosClient.post(`/lessons/${id}/start`)).data;
}
export async function reorderWeekLessons(weekId, ids) {
  await axiosClient.put(`/teacher/weeks/${weekId}/lessons/reorder`, { ids });
}
export async function completeLesson(id) {
  return (await axiosClient.post(`/lessons/${id}/complete`)).data;
}
export async function getTeacherCurriculum(courseId) {
  return (await axiosClient.get(`/teacher/curriculum/courses/${courseId}`)).data;
}
export async function createCourseWeek(courseId, payload) {
  return (await axiosClient.post(`/teacher/curriculum/courses/${courseId}/weeks`, payload)).data;
}
export async function updateCourseWeek(id, payload) {
  return (await axiosClient.put(`/teacher/curriculum/weeks/${id}`, payload)).data;
}
export async function deleteCourseWeek(id) {
  return axiosClient.delete(`/teacher/curriculum/weeks/${id}`);
}
export async function getStudentCurriculum(courseId) {
  return (await axiosClient.get(`/courses/${courseId}/curriculum`)).data;
}
