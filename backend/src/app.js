import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import questionRoutes from "./routes/question.routes.js";
import examRoutes from "./routes/exam.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import resultRoutes from "./routes/result.routes.js";
import adminResultRoutes from "./routes/admin-result.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ExamHub API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exams", attemptRoutes);
app.use("/api/attempts", resultRoutes);
app.use("/api/admin/results", adminResultRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

app.use((err, req, res, next) => {
  console.error("API error:", err.code || err.name || "UnknownError");

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "JSON không hợp lệ"
    });
  }

  if (err.message === "INVALID_QUESTION_SNAPSHOT") {
    return res.status(409).json({ success: false, message: "Lượt thi cũ không có bản chụp câu hỏi hợp lệ nên không thể chấm lại." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Dữ liệu gửi lên quá lớn (tối đa 100 KB)" });
  }
  if (err.code === "P2000") {
    return res.status(400).json({ success: false, message: "Nội dung vượt quá độ dài cho phép" });
  }
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

export default app;