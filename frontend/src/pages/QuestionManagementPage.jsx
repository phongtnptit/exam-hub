import { Icon, Notice, Skeleton } from "../components/UI";
import { useConfirm } from "../components/useConfirm";
    import { useEffect, useState } from "react";
    import api from "../api/axios";

    const initialForm = {
    subjectId: "",
    content: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: ""
    };

    function QuestionManagementPage() {
  const confirm = useConfirm();
    const [filterSubjectId, setFilterSubjectId] = useState("");
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [form, setForm] = useState({ ...initialForm });

    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const fetchQuestions = async () => {
        const response = await api.get("/questions");
        setQuestions(response.data.data);
    };

    useEffect(() => {
        const loadData = async () => {
        try {
            const [questionsResponse, subjectsResponse] =
            await Promise.all([
                api.get("/questions"),
                api.get("/subjects")
            ]);

            setQuestions(questionsResponse.data.data);
            setSubjects(subjectsResponse.data.data);
        } catch (err) {
            setError(
            err.response?.data?.message ||
                "Không thể tải dữ liệu"
            );
        } finally {
            setLoading(false);
        }
        };

        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
        ...prev,
        [name]: value
        }));
    };

    const resetForm = () => {
        setForm({ ...initialForm });
        setEditingId(null);
    };

    const handleEdit = (question) => {
        setEditingId(question.id);

        setForm({
        subjectId: String(question.subjectId),
        content: question.content,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || ""
        });

        setError("");
        setMessage("");

        window.scrollTo({
        top: 0,
        behavior: "smooth"
        });
    };

    const handleDelete = async (question) => {
        const confirmed = await confirm(
            `Bạn có chắc muốn xóa câu hỏi ID ${question.id} không?\n\n${question.content}`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            setSubmitting(true);

            await api.delete(`/questions/${question.id}`);

            if (editingId === question.id) {
            resetForm();
            }

            await fetchQuestions();

            setMessage("Xóa câu hỏi thành công");
        } catch (err) {
            setError(
            err.response?.data?.message ||
                "Không thể xóa câu hỏi"
            );
        } finally {
            setSubmitting(false);
        }
        };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!form.subjectId) {
        setError("Vui lòng chọn môn học");
        return;
        }

        const requiredFields = [
        "content",
        "optionA",
        "optionB",
        "optionC",
        "optionD"
        ];

        if (requiredFields.some((field) => !form[field].trim())) {
        setError("Nội dung câu hỏi và các đáp án không được để trống");
        return;
        }

        try {
        setSubmitting(true);

        const payload = {
            subjectId: Number(form.subjectId),
            content: form.content.trim(),
            optionA: form.optionA.trim(),
            optionB: form.optionB.trim(),
            optionC: form.optionC.trim(),
            optionD: form.optionD.trim(),
            correctAnswer: form.correctAnswer,
            explanation: form.explanation.trim()
        };

        if (editingId !== null) {
            await api.put(`/questions/${editingId}`, payload);
            setMessage("Cập nhật câu hỏi thành công");
        } else {
            await api.post("/questions", payload);
            setMessage("Thêm câu hỏi thành công");
        }

        resetForm();
        await fetchQuestions();
        } catch (err) {
        setError(
            err.response?.data?.message ||
            "Không thể lưu câu hỏi"
        );
        } finally {
        setSubmitting(false);
        }
    };

    const inputStyle = {
        display: "block",
        width: "100%",
        padding: "10px",
        marginTop: "6px",
        boxSizing: "border-box"
    };

    return (
        <div className="container management-page">
        <div className="page-heading"><div><span className="eyebrow">QUESTION BANK</span><h1>Ngân hàng câu hỏi</h1><p>Xây dựng và quản lý nội dung câu hỏi trắc nghiệm.</p></div><a className="button-link" href="#content">+ Thêm câu hỏi</a></div>

        <h2>
            {editingId !== null
            ? "Chỉnh sửa câu hỏi"
            : "Thêm câu hỏi trắc nghiệm"}
        </h2>

        <form className="management-form" onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
            <label htmlFor="subjectId">Môn học</label>

            <select
                id="subjectId"
                name="subjectId"
                value={form.subjectId}
                onChange={handleChange}
                required
                style={inputStyle}
            >
                <option value="">-- Chọn môn học --</option>

                {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                    {subject.name}
                </option>
                ))}
            </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
            <label htmlFor="content">Nội dung câu hỏi</label>

            <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={3}
                required
                style={inputStyle}
            />
            </div>

            {["A", "B", "C", "D"].map((option) => (
            <div
                key={option}
                className={`answer-field ${form.correctAnswer === option ? "is-correct" : ""}`}
                style={{ marginBottom: "12px" }}
            >
                <label htmlFor={`option${option}`}>
                Đáp án {option}
                </label>

                <input
                id={`option${option}`}
                name={`option${option}`}
                type="text"
                value={form[`option${option}`]}
                onChange={handleChange}
                required
                style={inputStyle}
                />
            </div>
            ))}

            <div style={{ marginBottom: "12px" }}>
            <label htmlFor="correctAnswer">
                Đáp án đúng
            </label>

            <select
                id="correctAnswer"
                name="correctAnswer"
                value={form.correctAnswer}
                onChange={handleChange}
                style={inputStyle}
            >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
            </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
            <label htmlFor="explanation">
                Giải thích đáp án
            </label>

            <textarea
                id="explanation"
                name="explanation"
                value={form.explanation}
                onChange={handleChange}
                rows={3}
                style={inputStyle}
            />
            </div>

            <div
            style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap"
            }}
            >
            <button
                type="submit"
                disabled={submitting || subjects.length === 0}
            >
                {submitting
                ? "Đang lưu..."
                : editingId !== null
                    ? "Lưu thay đổi"
                    : "Thêm câu hỏi"}
            </button>

            {editingId !== null && (
                <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                >
                Hủy chỉnh sửa
                </button>
            )}
            </div>
        </form>

        {subjects.length === 0 && !loading && (
            <p>Vui lòng tạo môn học trước khi thêm câu hỏi.</p>
        )}

        {message && (
            <Notice type="success">{message}</Notice>
        )}

        {error && (
            <Notice>{error}</Notice>
        )}

        <h2>Danh sách câu hỏi</h2>
        <label htmlFor="question-subject-filter">Lọc theo môn học </label>
        <select id="question-subject-filter" value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)}>
          <option value="">Tất cả môn học</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>

        {loading ? (
            <Skeleton />
        ) : (
            <div style={{ overflowX: "auto" }}>
            <table className="management-table"
                border="1"
                cellPadding="12"
                style={{
                width: "100%",
                borderCollapse: "collapse"
                }}
            >
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Môn học</th>
                    <th>Nội dung câu hỏi</th>
                    <th>Đáp án đúng</th>
                    <th>Thao tác</th>
                </tr>
                </thead>

                <tbody>
                {questions.filter((q) => !filterSubjectId || q.subjectId === Number(filterSubjectId)).length === 0 ? (
                    <tr>
                    <td
                        colSpan={5}
                        style={{ textAlign: "center" }}
                    >
                        Chưa có câu hỏi phù hợp
                    </td>
                    </tr>
                ) : (
                    questions.filter((question) => !filterSubjectId || question.subjectId === Number(filterSubjectId)).map((question) => (
                    <tr key={question.id}>
                        <td>{question.id}</td>

                        <td>
                        {question.subject?.name ||
                            "Không xác định"}
                        </td>

                        <td>{question.content}{question.explanation && <details><summary>Giải thích đáp án</summary><p>{question.explanation}</p></details>}</td>

                        <td>
                        <span className="answer-badge">{question.correctAnswer}</span>
                        </td>

                        <td>
                        <div
                            style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap"
                            }}
                        >
                            <button
                            type="button"
                            onClick={() => handleEdit(question)}
                            disabled={submitting}
                            ><Icon name="edit" size={16}/> Sửa</button>

                            <button
                            type="button"
                            onClick={() => handleDelete(question)}
                            disabled={submitting}
                            style={{
                                backgroundColor: "#dc2626",
                                color: "white"
                            }}
                            ><Icon name="trash" size={16}/> Xóa</button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        )}
        </div>
    );
    }

    export default QuestionManagementPage;