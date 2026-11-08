import { Notice, Skeleton } from "../components/UI";
import { useConfirm } from "../components/useConfirm";

import { useEffect, useState } from "react";
import { adminExamApi } from "../services/adminExamApi";
import "./student/ExamManagementPage.css";

const initialForm = {
  subjectId: "",
  title: "",
  description: "",
  durationMinutes: 30
};

function getError(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Có lỗi xảy ra"
  );
}

export default function ExamManagementPage() {
  const confirm = useConfirm();
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [selectedExam, setSelectedExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const [examData, subjectData, questionData] =
        await Promise.all([
          adminExamApi.getExams(),
          adminExamApi.getSubjects(),
          adminExamApi.getQuestions()
        ]);

      setExams(Array.isArray(examData) ? examData : []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
      setQuestions(Array.isArray(questionData) ? questionData : []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function editExam(exam) {
    if (exam.status !== "DRAFT") return;

    setEditingId(exam.id);

    setForm({
      subjectId: String(exam.subjectId),
      title: exam.title,
      description: exam.description || "",
      durationMinutes: exam.durationMinutes
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function handleSave(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        subjectId: Number(form.subjectId),
        title: form.title.trim(),
        description: form.description.trim(),
        durationMinutes: Number(form.durationMinutes)
      };

      if (
        !payload.subjectId ||
        !payload.title ||
        !Number.isInteger(payload.durationMinutes) ||
        payload.durationMinutes < 1
      ) {
        throw new Error("Thông tin đề thi không hợp lệ");
      }

      if (editingId !== null) {
        await adminExamApi.updateExam(editingId, payload);
        setMessage("Cập nhật đề thi thành công");
      } else {
        await adminExamApi.createExam(payload);
        setMessage("Tạo đề thi thành công");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }


  async function handleDelete(exam) {
    if (busy || exam.status !== "DRAFT") return;

    if (!await confirm(`Xóa đề thi "${exam.title}"?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await adminExamApi.deleteExam(exam.id);

      if (selectedExam?.id === exam.id) {
        setSelectedExam(null);
        setExamQuestions([]);
        setSelectedQuestionId("");
      }

      if (editingId === exam.id) {
        resetForm();
      }

      setMessage("Xóa đề thi thành công");
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function openQuestions(exam) {
    setError("");

    try {
      const data = await adminExamApi.getExamQuestions(exam.id);

      const items = Array.isArray(data)
        ? data
        : data?.questions;

      if (!Array.isArray(items)) {
        throw new Error(
          "Dữ liệu câu hỏi trả về không đúng định dạng"
        );
      }

      setSelectedExam({ ...exam, ...data.exam, subjectId: data.exam?.subject?.id ?? exam.subjectId });
      setExamQuestions(items);
      setSelectedQuestionId("");
    } catch (err) {
      setError(getError(err));
    }
  }

  async function handleAddQuestion() {
    if (
      busy ||
      !selectedExam ||
      selectedExam.status !== "DRAFT" ||
      !selectedQuestionId
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await adminExamApi.addQuestion(
        selectedExam.id,
        Number(selectedQuestionId)
      );

      await openQuestions(selectedExam);
      await loadData();

      setMessage("Thêm câu hỏi thành công");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveQuestion(questionId) {
    if (
      busy ||
      !selectedExam ||
      selectedExam.status !== "DRAFT"
    ) {
      return;
    }

    if (!await confirm("Xóa câu hỏi khỏi đề thi?")) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await adminExamApi.removeQuestion(
        selectedExam.id,
        questionId
      );

      await openQuestions(selectedExam);
      await loadData();

      setMessage("Đã xóa câu hỏi khỏi đề");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(exam) {
    if (busy || exam.status !== "DRAFT") return;

    if (!await confirm(`Xuất bản đề "${exam.title}"?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await adminExamApi.publishExam(exam.id);

      await loadData();

      if (selectedExam?.id === exam.id) {
        setSelectedExam({
          ...exam,
          status: "PUBLISHED"
        });
      }

      if (editingId === exam.id) {
        resetForm();
      }

      setMessage("Xuất bản đề thi thành công");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCloseExam(exam) {
    if (busy || exam.status !== "PUBLISHED") return;

    if (!await confirm(`Đóng đề thi "${exam.title}"?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await adminExamApi.closeExam(exam.id);

      await loadData();

      if (selectedExam?.id === exam.id) {
        setSelectedExam({
          ...exam,
          status: "CLOSED"
        });
      }

      setMessage("Đã đóng đề thi");
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  const availableQuestions = questions.filter((question) => {
    if (!selectedExam) return false;

    const alreadyAdded = examQuestions.some(
      (item) => item.questionId === question.id
    );

    return (
      question.subjectId === selectedExam.subjectId &&
      !alreadyAdded
    );
  });

  return (
    <main className="exam-admin-page">
      <header className="exam-admin-header">
        <h1>Quản lý đề thi</h1>
        <p>
          Tạo đề thi, quản lý câu hỏi,
          xuất bản và đóng đề thi.
        </p>
      </header>

      {error && (
        <div className="exam-admin-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <Notice type="success">{message}</Notice>
      )}

      <section className="exam-admin-panel">
        <h2>
          {editingId !== null
            ? "Chỉnh sửa đề thi"
            : "Tạo đề thi mới"}
        </h2>

        <form
          onSubmit={handleSave}
          className="exam-admin-form"
        >
          <label>
            Môn học
            <select
              required
              disabled={busy}
              value={form.subjectId}
              onChange={(e) =>
                setForm({
                  ...form,
                  subjectId: e.target.value
                })
              }
            >
              <option value="">Chọn môn học</option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tên đề thi
            <input
              required
              disabled={busy}
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
              placeholder="Nhập tên đề thi"
            />
          </label>

          <label>
            Mô tả
            <textarea
              rows={3}
              disabled={busy}
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
              placeholder="Nhập mô tả đề thi"
            />
          </label>

          <label>
            Thời gian làm bài (phút)
            <input
              type="number"
              min="1"
              step="1"
              required
              disabled={busy}
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  durationMinutes: e.target.value
                })
              }
            />
          </label>

          <div className="exam-admin-actions">
            <button type="submit" disabled={busy}>
              {busy
                ? "Đang xử lý..."
                : editingId !== null
                  ? "Lưu thay đổi"
                  : "Tạo đề thi"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={resetForm}
              >
                Hủy chỉnh sửa
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="exam-admin-panel">
        <h2>Danh sách đề thi</h2>

        {loading ? (
          <Skeleton />
        ) : (
          <div className="exam-admin-table-wrap">
            <table className="exam-admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Đề thi</th>
                  <th>Môn học</th>
                  <th>Thời gian</th>
                  <th>Số câu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.id}</td>

                    <td>{exam.title}</td>

                    <td>
                      {exam.subject?.name || "Không xác định"}
                    </td>

                    <td>
                      {exam.durationMinutes} phút
                    </td>

                    <td>
                      {exam._count?.examQuestions ?? 0}
                    </td>

                    <td>
                      <span
                        className={`exam-status ${exam.status}`}
                      >
                        {exam.status}
                      </span>
                    </td>

                    <td>
                      <div className="exam-admin-row-actions">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openQuestions(exam)}
                        >
                          Câu hỏi
                        </button>

                        {exam.status === "DRAFT" && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => editExam(exam)}
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handlePublish(exam)}
                            >
                              Xuất bản
                            </button>

                            <button
                              type="button"
                              className="danger"
                              disabled={busy}
                              onClick={() => handleDelete(exam)}
                            >
                              Xóa
                            </button>
                          </>
                        )}

                        {exam.status === "PUBLISHED" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleCloseExam(exam)}
                          >
                            Đóng đề
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {exams.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      Chưa có đề thi nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedExam && (
        <section className="exam-admin-panel">
          <h2>
            Câu hỏi của đề: {selectedExam.title}
          </h2>

          <p>
            Trạng thái:{" "}
            <strong>{selectedExam.status}</strong>
          </p>

          {selectedExam.status === "DRAFT" && (
            <div className="exam-admin-add-question">
              <select
                aria-label="Ch?n c?u h?i ?? th?m v?o ?? thi"
                value={selectedQuestionId}
                disabled={busy}
                onChange={(e) =>
                  setSelectedQuestionId(e.target.value)
                }
              >
                <option value="">
                  Chọn câu hỏi để thêm
                </option>

                {availableQuestions.map((question) => (
                  <option
                    key={question.id}
                    value={question.id}
                  >
                    #{question.id} —{" "}
                    {question.content.slice(0, 80)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={busy || !selectedQuestionId}
                onClick={handleAddQuestion}
              >
                Thêm câu hỏi
              </button>
            </div>
          )}

          <div className="exam-admin-question-list">
            {examQuestions.map((item, index) => (
              <div
                className="exam-admin-question"
                key={item.id}
              >
                <div>
                  <strong>
                    Câu {index + 1}
                  </strong>

                  <p>
                    {item.question?.content ||
                      "Không có nội dung"}
                  </p>
                </div>

                {selectedExam.status === "DRAFT" && (
                  <button
                    type="button"
                    className="danger"
                    disabled={busy}
                    onClick={() =>
                      handleRemoveQuestion(item.questionId)
                    }
                  >
                    Xóa khỏi đề
                  </button>
                )}
              </div>
            ))}

            {examQuestions.length === 0 && (
              <p>Đề thi chưa có câu hỏi.</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
