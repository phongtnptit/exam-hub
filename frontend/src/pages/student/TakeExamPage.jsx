import { Progress, Skeleton } from "../../components/UI";
import { useConfirm } from "../../components/useConfirm";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { examApi } from "../../services/examApi";
import "./StudentExam.css";

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function TakeExamPage() {
  const confirm = useConfirm();
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const answersRef = useRef({});
  const saveQueueRef = useRef(Promise.resolve());
  const submitLockRef = useRef(false);
  const submitRef = useRef(null);

  const saveAnswers = useCallback((nextAnswers) => {
    setSaving(true);

    const task = saveQueueRef.current
      .catch(() => {})
      .then(() => examApi.saveAnswers(attemptId, nextAnswers));

    saveQueueRef.current = task;

    task.finally(() => {
      if (saveQueueRef.current === task) {
        setSaving(false);
      }
    }).catch(() => {});

    return task;
  }, [attemptId]);

  const submitExam = useCallback(async (automatic = false) => {
    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      await saveQueueRef.current.catch(() => {});

      // Đồng bộ lần cuối trước khi nộp.
      if (!automatic) {
        try {
          await examApi.saveAnswers(attemptId, answersRef.current);
        } catch (err) {
          if (err.resultId) {
            navigate('/student/results/' + err.resultId, { replace: true });
            return;
          }
          // Cho phép thử lại nếu đáp án mới chưa lưu được.
          throw err;
        }
      }

      const result = await examApi.submit(attemptId);

      navigate(`/student/results/${result.resultId}`, {
        replace: true
      });
    } catch (err) {
      setError(
        automatic
          ? `Không thể hoàn tất bài thi: ${err.message}`
          : err.message
      );
      submitLockRef.current = false;
      setSubmitting(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => { submitRef.current = submitExam; }, [submitExam]);

  useEffect(() => {
    let cancelled = false;

    async function loadAttempt() {
      try {
        const data = await examApi.getAttempt(attemptId);

        if (cancelled) return;

        if (data.status !== "IN_PROGRESS") {
          if (data.resultId) {
            navigate(`/student/results/${data.resultId}`, {
              replace: true
            });
          } else {
            setError("Lượt làm bài đã kết thúc.");
          }
          return;
        }

        const restoredAnswers = data.answers ?? {};

        answersRef.current = restoredAnswers;
        setAnswers(restoredAnswers);
        setAttempt(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAttempt();

    return () => {
      cancelled = true;
    };
  }, [attemptId, navigate]);

  useEffect(() => {
    if (!attempt) return;

    const expiresAt = new Date(attempt.expiresAt).getTime();
    const serverTime = new Date(attempt.serverTime).getTime();
    const clockOffset = serverTime - Date.now();

    const updateClock = () => {
      const now = Date.now() + clockOffset;
      const seconds = Math.max(
        0,
        Math.ceil((expiresAt - now) / 1000)
      );

      setRemaining(seconds);

      if (seconds === 0) {
        submitRef.current?.(true);
      }
    };

    updateClock();

    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, [attempt]);

  function handleAnswer(questionId, value) {
    if (submitting || remaining <= 0) return;

    const nextAnswers = {
      ...answersRef.current,
      [String(questionId)]: value
    };

    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    saveAnswers(nextAnswers).catch((err) => {
      setError(`Không lưu được đáp án: ${err.message}`);
    });
  }

  if (loading) {
    return (
      <main className="student-page">
        <Skeleton count={2}/>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="student-page">
        <div className="student-error">
          {error || "Không thể tải bài thi."}
        </div>
      </main>
    );
  }

  const questions = attempt.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter(
    (question) => answers[String(question.id)]
  ).length;

  return (
    <main className="student-page">
      <div className="student-take-header">
        <div>
          <span className="student-eyebrow">ĐANG LÀM BÀI</span>
          <h1>{attempt.title}</h1>
          <p>
            Đã trả lời {answeredCount}/{questions.length} câu
          </p>
        </div>

        <div
          className={
            remaining <= 300
              ? "student-timer student-timer-warning"
              : "student-timer"
          }
          role="timer"
        >
          <small>Thời gian còn lại</small>
          <strong>{formatTime(remaining)}</strong>
        </div>
      </div>

      <div className="exam-progress"><span>Tiến độ làm bài <strong>{answeredCount}/{questions.length}</strong></span><Progress value={questions.length ? answeredCount/questions.length*100 : 0} label="Tiến độ trả lời"/></div>
      <div className="student-take-layout">
        <section className="student-question-panel">
          {currentQuestion && (
            <>
              <div className="student-question-number">
                Câu {currentIndex + 1} / {questions.length}
              </div>

              <h2>{currentQuestion.content}</h2>

              <div className="student-options">
                {["A", "B", "C", "D"].map((option) => (
                  <label
                    key={option}
                    className={
                      answers[String(currentQuestion.id)] === option
                        ? "student-option selected"
                        : "student-option"
                    }
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={
                        answers[String(currentQuestion.id)] === option
                      }
                      disabled={submitting || remaining <= 0}
                      onChange={() =>
                        handleAnswer(currentQuestion.id, option)
                      }
                    />
                    <strong>{option}.</strong>
                    <span>{currentQuestion[`option${option}`]}</span>
                  </label>
                ))}
              </div>

              <div className="student-question-actions">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => i - 1)}
                >
                  Câu trước
                </button>

                <button
                  type="button"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((i) => i + 1)}
                >
                  Câu tiếp theo
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="student-question-sidebar">
          <h3>Danh sách câu hỏi</h3>

          <div className="student-question-grid">
            {questions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                aria-label={`Câu ${index + 1}, ${answers[String(question.id)] ? "đã trả lời" : "chưa trả lời"}`}
                aria-current={currentIndex === index ? "step" : undefined}
                onClick={() => setCurrentIndex(index)}
                className={[
                  "student-question-jump",
                  answers[String(question.id)] ? "answered" : "",
                  currentIndex === index ? "active" : ""
                ].join(" ")}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="question-legend"><span>● Đã trả lời</span><span>○ Chưa trả lời</span></div><p className="student-save-status" role="status">
            {saving ? "Đang lưu đáp án..." : "Đáp án được lưu tự động"}
          </p>

          <button
            className="student-primary-button student-submit-button"
            type="button"
            disabled={submitting}
            onClick={async () => {
              if (
                await confirm(
                  `Bạn đã trả lời ${answeredCount}/${questions.length} câu. Xác nhận nộp bài?`
                )
              ) {
                submitExam();
              }
            }}
          >
            {submitting ? "Đang nộp bài..." : "Nộp bài"}
          </button>
        </aside>
      </div>

      {error && (
        <div className="student-error" role="alert">
          {error}
        </div>
      )}
    </main>
  );
}
