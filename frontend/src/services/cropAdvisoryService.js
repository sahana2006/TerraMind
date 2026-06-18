import { api } from "./api";

export const cropAdvisoryService = {
  predict: (payload) => api.post("/crop-advisory/predict/", payload),
  history: () => api.get("/crop-advisory/history/"),
};
