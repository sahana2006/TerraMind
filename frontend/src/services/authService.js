import axios from "axios";
import { API_BASE_URL, api } from "./api";

export const authService = {
  register(payload) {
    return api.post("/auth/register/", payload);
  },

  login(credentials) {
    return api.post("/auth/login/", credentials);
  },

  getProfile() {
    return api.get("/auth/profile/");
  },

  refresh(refreshToken) {
    return axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh: refreshToken });
  },
};
