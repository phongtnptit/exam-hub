
import api from "../api/axios";

export const adminResultApi = {
  getAll: async () => {
    const response = await api.get("/admin/results");
    return response.data.data;
  },

  getDetail: async (id) => {
    const response = await api.get(`/admin/results/${id}`);
    return response.data.data;
  }
};
