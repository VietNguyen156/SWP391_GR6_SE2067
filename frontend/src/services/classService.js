import api from "./axiosClient";
export const getMentorClasses = () => api.get("/mentor/classes").then(r => r.data);
export const createClass = data => api.post("/mentor/classes", data).then(r => r.data);
export const getStudents = id => api.get(`/mentor/classes/${id}/students`).then(r => r.data);
export const addStudent = (id, email) => api.post(`/mentor/classes/${id}/students`, { email }).then(r => r.data);
export const getMyClasses = () => api.get("/student/classes").then(r => r.data);
