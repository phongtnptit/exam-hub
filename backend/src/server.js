
import "dotenv/config";
import app from "./app.js";

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  throw new Error("Thiếu DATABASE_URL hoặc JWT_SECRET trong backend/.env");
}

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`ExamHub Backend running at http://localhost:${PORT}`);
});
