const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("examhub_token");
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || "Yêu cầu thất bại");
    error.code = payload.code;
    error.resultId = payload.data?.resultId;
    throw error;
  }

  return payload.data;
}

export const examApi = {
  getPublished: () => request("/exams"),

  getDetail: (examId) =>
    request(`/exams/${examId}`),

  start: (examId) =>
    request(`/exams/${examId}/start`, {
      method: "POST"
    }),

  saveAnswers: (attemptId, answers) =>
    request(`/attempts/${attemptId}/answers`, {
      method: "PUT",
      body: JSON.stringify({ answers })
    }),

  submit: (attemptId) =>
    request(`/attempts/${attemptId}/submit`, {
      method: "POST"
    }),

  getMyResults: () =>
    request("/attempts/my-results"),

  getResultDetail: (resultId) =>
    request(`/attempts/results/${resultId}`),

  getAttempt: (attemptId) =>
    request(`/attempts/${attemptId}`),
};
