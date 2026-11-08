import { EmptyState, Skeleton, StatCard } from "../../components/UI";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { examApi } from "../../services/examApi";
import "./StudentExam.css";

export default function ResultHistoryPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    examApi.getMyResults()
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="student-page">
      <div className="student-heading">
        <h1>Lịch sử làm bài</h1>
        <p>Xem điểm số và các bài thi đã hoàn thành.</p>
      </div>

      {!loading && !error && <div className="stats-grid compact-stats"><StatCard label="Bài thi đã hoàn thành" value={results.length}/><StatCard label="Điểm trung bình" value={results.length ? (results.reduce((s,r)=>s+Number(r.score),0)/results.length).toFixed(1)+"/10" : "—"}/><StatCard label="Điểm cao nhất" value={results.length ? Math.max(...results.map(r=>Number(r.score))).toFixed(1)+"/10" : "—"}/></div>}
      {loading && <Skeleton />}

      {error && <div className="student-error">{error}</div>}

      {!loading && !error && results.length === 0 && (
        <EmptyState>Bạn chưa có kết quả làm bài nào</EmptyState>
      )}

      {!loading && !error && (
        <div className="student-history-list">
          {results.map((result) => (
            <article className="student-history-item" key={result.id}>
              <div>
                <span className="student-subject">
                  {result.exam?.subject?.name}
                </span>
                <h2>{result.exam?.title}</h2>
                <p>
                  Nộp lúc:{" "}
                  {new Date(result.submittedAt).toLocaleString("vi-VN")}
                </p>
              </div>

              <div className="student-history-score">
                <strong>{result.score.toFixed(1)}/10</strong>
                <span>
                  {result.correct}/{result.total} câu đúng
                </span>
                <Link to={`/student/results/${result.id}`}>
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
