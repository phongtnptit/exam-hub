import { Icon, Notice, Skeleton } from "../components/UI";
import { useConfirm } from "../components/useConfirm";
import { useEffect, useState } from "react";
import api from "../api/axios";

function SubjectManagementPage() {
  const confirm = useConfirm();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      setError("");

      const response = await api.get("/subjects");
      setSubjects(response.data.data);
    } catch {
      setError("Không thể tải danh sách môn học");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setName(subject.name);
    setDescription(subject.description || "");

    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (subject) => {
    const confirmed = await confirm(
        `Bạn có chắc muốn xóa môn học "${subject.name}" không?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
        setSubmitting(true);

        await api.delete(`/subjects/${subject.id}`);

        if (editingId === subject.id) {
        resetForm();
        }

        setMessage("Xóa môn học thành công");

        await fetchSubjects();
    } catch (err) {
        setError(
        err.response?.data?.message ||
            "Không thể xóa môn học"
        );
    } finally {
        setSubmitting(false);
    }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (name.trim().length < 2 || name.trim().length > 100) {
      setError("Tên môn học phải có từ 2 đến 100 ký tự");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        description: description.trim()
      };

      if (editingId !== null) {
        await api.put(`/subjects/${editingId}`, payload);

        setMessage("Cập nhật môn học thành công");
      } else {
        await api.post("/subjects", payload);

        setMessage("Thêm môn học thành công");
      }

      resetForm();
      await fetchSubjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể lưu môn học"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container management-page">
      <div className="page-heading"><div><span className="eyebrow">SUBJECT LIBRARY</span><h1>Quản lý môn học</h1><p>Tổ chức nội dung học tập theo từng môn học.</p></div><a className="button-link" href="#subject-name">+ Thêm môn học</a></div>

      <h2>
        {editingId !== null
          ? "Chỉnh sửa môn học"
          : "Thêm môn học"}
      </h2>

      <form className="management-form" onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="subject-name">Tên môn học</label>

          <input
            id="subject-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Lập trình Java"
            minLength={2}
            maxLength={100}
            required
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "6px"
            }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label htmlFor="subject-description">Mô tả</label>

          <textarea
            id="subject-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả môn học"
            rows={3}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "6px"
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          <button type="submit" disabled={submitting}>
            {submitting
              ? "Đang lưu..."
              : editingId !== null
                ? "Lưu thay đổi"
                : "Thêm môn học"}
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

      {message && (
        <Notice type="success">{message}</Notice>
      )}

      {error && (
        <Notice>{error}</Notice>
      )}

      <h2>Danh sách môn học</h2>

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
                <th>Tên môn học</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Chưa có môn học nào
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td>{subject.id}</td>
                    <td>{subject.name}</td>
                    <td>
                      {subject.description || "Không có mô tả"}
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
                        onClick={() => handleEdit(subject)}
                        disabled={submitting}
                        ><Icon name="edit" size={16}/> Sửa</button>

                        <button
                        type="button"
                        onClick={() => handleDelete(subject)}
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

export default SubjectManagementPage;