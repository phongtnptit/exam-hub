import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";

import SubjectManagementPage from "./pages/SubjectManagementPage";
import QuestionManagementPage from "./pages/QuestionManagementPage";

import ExamListPage from "./pages/student/ExamListPage";
import ExamIntroPage from "./pages/student/ExamIntroPage";
import TakeExamPage from "./pages/student/TakeExamPage";
import ResultHistoryPage from "./pages/student/ResultHistoryPage";
import ResultDetailPage from "./pages/student/ResultDetailPage";
import ExamManagementPage from "./pages/ExamManagementPage";
import AdminResultsPage from "./pages/AdminResultsPage";

import "./App.css";
import DashboardLayout from "./components/DashboardLayout";
import { FeedbackProvider } from "./components/UI";
import "./redesign.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FeedbackProvider>
          <Routes>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<HomePage />} />

          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route
              path="/admin/subjects"
              element={<SubjectManagementPage />}
            />

            <Route
              path="/admin/questions"
              element={<QuestionManagementPage />}
            />

            <Route
              path="/admin/exams"
              element={<ExamManagementPage />}
            />

            <Route
              path="/admin/results"
              element={<AdminResultsPage />}
            />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
            <Route
              path="/student/exams"
              element={<ExamListPage />}
            />

            <Route
              path="/student/exams/:id"
              element={<ExamIntroPage />}
            />

            <Route
              path="/student/attempts/:attemptId"
              element={<TakeExamPage />}
            />

            <Route
              path="/student/results"
              element={<ResultHistoryPage />}
            />

            <Route
              path="/student/results/:id"
              element={<ResultDetailPage />}
            />
          </Route>

            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
