import { ScoreChart, Skeleton } from "../components/UI";

import { useEffect, useMemo, useState } from "react";
import { adminResultApi } from "../services/adminResultApi";
import "./AdminResultsPage.css";

function formatDate(value) {
  return new Date(value).toLocaleString("vi-VN");
}

export default function AdminResultsPage() {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    adminResultApi.getAll()
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message || err.message
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return results.filter((result) => {
      const text = [
        result.user?.fullName,
        result.user?.email,
        result.exam?.title,
        result.exam?.subject?.name
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }, [results, keyword]);

  const averageScore = results.length
    ? (
        results.reduce((sum, item) => sum + item.score, 0) /
        results.length
      ).toFixed(1)
    : "—";

  async function openDetail(id) {
    setDetailLoading(true);
    setError("");
    setSelected(null);

    try {
      const data = await adminResultApi.getDetail(id);
      setSelected(data);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <main className="admin-results-page">
      <header>
        <h1>Kết quả thi của sinh viên</h1>
        <p>Theo dõi điểm số và xem chi tiết bài làm.</p>
      </header>

      <div className="admin-results-stats">
        <div>
          <span>Tổng lượt đã chấm</span>
          <strong>{loading || error ? "—" : results.length}</strong>
        </div>
        <div>
          <span>Điểm trung bình</span>
          <strong>{loading || error ? "—" : averageScore + (results.length ? "/10" : "")}</strong>
        </div>
        <div>
          <span>Sinh viên đã tham gia</span>
          <strong>
            {loading || error ? "—" : new Set(results.map((r) => r.user?.id).filter(id => id != null)).size}
          </strong>
        </div>
      </div>

      {!loading && !error && <><div className="highest-score">Điểm cao nhất: <strong>{results.length ? Math.max(...results.map(r=>Number(r.score))).toFixed(1)+"/10" : "Chưa có dữ liệu"}</strong></div><ScoreChart results={results}/></>}
      <div className="admin-results-toolbar">
        <input
          type="search"
          aria-label="T?m ki?m k?t qu? thi"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm sinh viên, email, đề thi..."
        />
      </div>

      {error && (
        <div className="admin-results-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : (
        <div className="admin-results-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Đề thi</th>
                <th>Điểm</th>
                <th>Số câu đúng</th>
                <th>Thời gian nộp</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((result) => (
                <tr key={result.id}>
                  <td>
                    <strong>{result.user?.fullName}</strong>
                    <small>{result.user?.email}</small>
                  </td>
                  <td>
                    {result.exam?.title}
                    <small>{result.exam?.subject?.name}</small>
                  </td>
                  <td>
                    <span className="score-badge">{result.score.toFixed(1)}/10</span>
                  </td>
                  <td>{result.correct}/{result.total}</td>
                  <td>{formatDate(result.submittedAt)}</td>
                  <td>
                    <button
                      onClick={() => openDetail(result.id)}
                    >
                      Xem bài
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>Không có kết quả phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detailLoading && <Skeleton count={1}/>}

      {selected && (
        <section className="admin-result-detail">
          <div className="admin-result-detail-header">
            <div>
              <h2>{selected.student.fullName}</h2>
              <p>{selected.exam.title}</p>
              <strong>Điểm: {selected.score.toFixed(1)}/10</strong>
            </div>

            <button onClick={() => setSelected(null)}>
              Đóng
            </button>
          </div>

          {selected.reviewAvailable === false && <p>Kết quả cũ chưa lưu bản chụp câu hỏi; chỉ có thể xem điểm tổng kết.</p>}
          {selected.questions.map((question, index) => (
            <article key={question.id}>
              <h3>Câu {index + 1}: {question.content}</h3>

              <p>
                Sinh viên chọn:{" "}
                <strong>{question.selectedAnswer ?? "Bỏ trống"}</strong>
              </p>

              <p>
                Đáp án đúng:{" "}
                <strong>{question.correctAnswer}</strong>
              </p>

              {question.explanation && (
                <p>Giải thích: {question.explanation}</p>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
