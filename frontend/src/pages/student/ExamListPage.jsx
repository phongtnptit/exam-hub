import { EmptyState, Skeleton } from "../../components/UI";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { examApi } from "../../services/examApi";
import "./StudentExam.css";

export default function ExamListPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadExams() {
      try {
        const data = await examApi.getPublished();

        if (!cancelled) {
          setExams(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadExams();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = exams.filter((exam) => {
    const text = `${exam.title} ${exam.subject?.name || ""}`;
    return text.toLowerCase().includes(keyword.toLowerCase());
  });

  return (
    <main className="student-page">
      <div className="student-heading">
        <div>
          <span className="student-eyebrow">EXAMHUB MINI</span>
          <h1>Danh sách đề thi</h1>
          <p>Chọn đề thi để xem thông tin và bắt đầu làm bài.</p>
        </div>
      </div>

      <div className="student-toolbar">
        <input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên đề thi hoặc môn học..."
          aria-label="Tìm kiếm đề thi"
        />
      </div>

      {loading && <Skeleton />}

      {error && (
        <div className="student-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState>Không tìm thấy đề thi phù hợp</EmptyState>
      )}

      {!loading && !error && (
        <div className="student-exam-grid">
          {filtered.map((exam) => (
            <article className="student-exam-card" key={exam.id}>
              <span className="student-subject">
                {exam.subject?.name || "Chưa phân loại"}
              </span>

              <span className="available-badge">● Đã xuất bản</span><h2>{exam.title}</h2>

              <p>{exam.description || "Bài kiểm tra trắc nghiệm trực tuyến."}</p>

              <div className="student-exam-meta">
                <span>⏱ {exam.durationMinutes} phút</span>
                <span>
                  ◫ {exam._count?.examQuestions ?? 0} câu hỏi
                </span>
              </div>

              <Link
                className="student-primary-button"
                to={`/student/exams/${exam.id}`}
              >
                Xem đề thi
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
