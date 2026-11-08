import { Skeleton } from "../../components/UI";

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { examApi } from "../../services/examApi";
import "./StudentExam.css";

export default function ExamIntroPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadExam() {
      try {
        const data = await examApi.getDetail(id);
        if (!cancelled) setExam(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadExam();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleStart() {
    if (starting) return;

    setStarting(true);
    setError("");

    try {
      const attempt = await examApi.start(id);

      navigate(`/student/attempts/${attempt.attemptId}`, {
        state: { attempt }
      });
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  }

  if (loading) {
    return <main className="student-page"><Skeleton count={2}/></main>;
  }

  if (!exam) {
    return (
      <main className="student-page">
        <div className="student-error">{error || "Không tìm thấy đề thi"}</div>
        <Link to="/student/exams">Quay lại danh sách</Link>
      </main>
    );
  }

  return (
    <main className="student-page student-intro">
      <Link to="/student/exams" className="student-back">
        ← Quay lại danh sách đề thi
      </Link>

      <section className="student-intro-card">
        <span className="student-subject">{exam.subject?.name}</span>

        <h1>{exam.title}</h1>
        <p>{exam.description || "Bài kiểm tra trắc nghiệm trực tuyến."}</p>

        <div className="student-intro-stats">
          <div>
            <strong>{exam.durationMinutes}</strong>
            <span>Phút làm bài</span>
          </div>

          <div>
            <strong>{exam.totalQuestions}</strong>
            <span>Câu hỏi</span>
          </div>

          <div>
            <strong>10</strong>
            <span>Điểm tối đa</span>
          </div>
        </div>

        <div className="student-instructions">
          <h2>Hướng dẫn làm bài</h2>
          <ol>
            <li>Thời gian bắt đầu tính khi nhấn nút bắt đầu.</li>
            <li>Mỗi câu hỏi chỉ chọn một đáp án.</li>
            <li>Câu chưa trả lời được tính là không đúng.</li>
            <li>Hệ thống lưu câu trả lời trong quá trình làm bài.</li>
            <li>Khi hết thời gian, bài thi sẽ được kết thúc.</li>
          </ol>
        </div>

        {error && (
          <div className="student-error" role="alert">{error}</div>
        )}

        <button
          className="student-primary-button"
          onClick={handleStart}
          disabled={starting || exam.totalQuestions === 0}
        >
          {starting ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
        </button>
      </section>
    </main>
  );
}
