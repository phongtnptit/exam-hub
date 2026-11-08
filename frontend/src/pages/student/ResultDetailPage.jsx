import { Progress, Skeleton } from "../../components/UI";

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { examApi } from "../../services/examApi";
import "./StudentExam.css";

export default function ResultDetailPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    examApi.getResultDetail(id)
      .then((data) => {
        if (!cancelled) setResult(data);
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
  }, [id]);

  if (loading) {
    return <main className="student-page"><Skeleton count={2}/></main>;
  }

  if (!result) {
    return (
      <main className="student-page">
        <div className="student-error">{error}</div>
      </main>
    );
  }

  return (
    <main className="student-page">
      <Link to="/student/results" className="student-back">
        ← Lịch sử làm bài
      </Link>

      <section className="student-result-summary">
        <span className="student-eyebrow">KẾT QUẢ BÀI THI</span>
        <h1>{result.examTitle}</h1>
        <p>{result.subject}</p>

        <div className="student-score-number">
          {result.score.toFixed(1)}
          <span>/10</span>
        </div>

        <p>
          Trả lời đúng {result.correct}/{result.total} câu hỏi
        </p>
        <Progress value={result.total ? result.correct/result.total*100 : 0} label="Tỷ lệ trả lời đúng"/><div className="result-links"><Link className="button-link" to="/student/exams">Khám phá đề thi</Link><Link to="/student/results">Lịch sử kết quả →</Link></div>
      </section>

      <h2>Chi tiết đáp án</h2>
      {result.reviewAvailable === false && <p>Kết quả cũ chưa lưu bản chụp câu hỏi; chỉ có thể xem điểm tổng kết.</p>}

      <div className="student-review-list">
        {result.questions.map((question, index) => {
          const isCorrect =
            question.selectedAnswer === question.correctAnswer;

          return (
            <article className="student-review-card" key={question.id}>
              <div className="student-review-heading">
                <strong>Câu {index + 1}</strong>
                <span className={isCorrect ? "correct" : "incorrect"}>
                  {isCorrect ? "Đúng" : "Sai / Chưa trả lời"}
                </span>
              </div>

              <h3>{question.content}</h3>

              {["A", "B", "C", "D"].map((option) => {
                const correct = question.correctAnswer === option;
                const selected = question.selectedAnswer === option;

                return (
                  <div
                    key={option}
                    className={[
                      "student-review-option",
                      correct ? "correct-option" : "",
                      selected && !correct ? "wrong-option" : ""
                    ].join(" ")}
                  >
                    <strong>{option}.</strong>{" "}
                    {question[`option${option}`]}
                    {correct && " ✓ Đáp án đúng"}
                    {selected && !correct && " — Bạn đã chọn"}
                  </div>
                );
              })}

              {question.explanation && (
                <p className="student-explanation">
                  <strong>Giải thích:</strong> {question.explanation}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
