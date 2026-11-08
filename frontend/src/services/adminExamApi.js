
import api from "../api/axios";

function unwrap(response) {
  return response.data.data;
}

export const adminExamApi = {
  getExams: async () =>
    unwrap(await api.get("/exams/admin")),

  createExam: async (data) =>
    unwrap(await api.post("/exams", data)),

  updateExam: async (id, data) =>
    unwrap(await api.put(`/exams/${id}`, data)),

  deleteExam: async (id) =>
    unwrap(await api.delete(`/exams/${id}`)),

  getExamQuestions: async (id) =>
    unwrap(await api.get(`/exams/${id}/questions`)),

  addQuestion: async (examId, questionId) =>
    unwrap(
      await api.post(`/exams/${examId}/questions`, {
        questionId
      })
    ),

  removeQuestion: async (examId, questionId) =>
    unwrap(
      await api.delete(
        `/exams/${examId}/questions/${questionId}`
      )
    ),

  publishExam: async (id) =>
    unwrap(await api.patch(`/exams/${id}/publish`)),

  getSubjects: async () =>
    unwrap(await api.get("/subjects")),

  getQuestions: async () =>
    unwrap(await api.get("/questions")),

  closeExam: async (id) =>
    unwrap(await api.patch(`/exams/${id}/close`)),

};
