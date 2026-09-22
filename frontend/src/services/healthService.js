import api from "./axiosClient";
export const getHealth = async () => (await api.get("/health")).data;

