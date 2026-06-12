import { api } from "./api";

export const farmService = {
  list: () => api.get("/farms/"),
  create: (payload) => api.post("/farms/", payload),
  update: (id, payload) => api.put(`/farms/${id}/`, payload),
  remove: (id) => api.delete(`/farms/${id}/`),
};
