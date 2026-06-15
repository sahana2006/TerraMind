import { api } from "./api";

export const weatherService = {
  getCurrentWeather: (farmId) => api.get(`/weather/current/${farmId}/`),
  getForecast: (farmId) => api.get(`/weather/forecast/${farmId}/`),
};
