import { api } from "./api";

export const diseaseService = {
  predict(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    return api.post("/disease/predict/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
