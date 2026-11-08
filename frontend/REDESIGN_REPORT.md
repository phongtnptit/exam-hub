# ExamHub Mini — Báo cáo redesign

## Phạm vi

Đã khảo sát toàn bộ 12 page component, route, auth context, ProtectedRoute, Axios client, ba API service và CSS hiện có. Chỉ sửa frontend. Không sửa backend, database, Prisma, endpoint, request body hoặc response contract. Không tạo commit Git.

Giao diện dùng hệ màu Indigo / Slate, Be Vietnam Pro, CSS variables, sidebar theo vai trò, header và responsive ở các mốc 600/850/1000/1200px. Font tải qua Google Fonts; khi không có mạng sử dụng font hệ thống dự phòng.

## File đã sửa

- `src/App.jsx`: tích hợp layout dùng chung và provider hộp thoại xác nhận; giữ các URL và guard theo vai trò.
- `src/App.css`, `src/index.css`: thu gọn style nền, loại các layout trang chủ cũ không còn dùng.
- `src/components/ProtectedRoute.jsx`: giữ nguyên kiểm tra auth/role; giao phần điều hướng cho layout.
- `src/pages/HomePage.jsx`: dashboard riêng cho ADMIN và STUDENT.
- `src/pages/LoginPage.jsx`, `src/pages/RegisterPage.jsx`: branding và layout đăng nhập/đăng ký; giữ nguyên auth handler.
- `src/pages/SubjectManagementPage.jsx`: form, bảng, icon, skeleton, toast, xác nhận xóa.
- `src/pages/QuestionManagementPage.jsx`: form A/B/C/D, highlight đáp án đúng, badge, giải thích có thể mở rộng, empty state đúng với bộ lọc, toast và xác nhận xóa.
- `src/pages/ExamManagementPage.jsx`: giao diện quản lý, skeleton, toast và xác nhận các thao tác quan trọng; giữ các điều kiện DRAFT/PUBLISHED.
- `src/pages/AdminResultsPage.jsx`: KPI, điểm cao nhất, phân bố điểm, badge điểm, skeleton.
- `src/pages/student/ExamListPage.jsx`: card, trạng thái xuất bản, skeleton và empty state.
- `src/pages/student/ExamIntroPage.jsx`: skeleton và style giới thiệu thi.
- `src/pages/student/TakeExamPage.jsx`: progress, điều hướng câu hỏi có nhãn, trạng thái autosave và modal xác nhận. Giữ save queue, restore answers, server deadline, clock offset, auto submit và submit handler.
- `src/pages/student/ResultHistoryPage.jsx`: KPI cá nhân và trạng thái tải/rỗng.
- `src/pages/student/ResultDetailPage.jsx`: progress kết quả và liên kết điều hướng.
- `index.html`, `public/favicon.svg`: ngôn ngữ tiếng Việt, tiêu đề, mô tả, font và favicon.
- `.gitignore`, `.oxlintignore`: bỏ qua output build kiểm tra và mã bundle khi lint.

## File và component mới

- `src/redesign.css`: design tokens, layout, theme các trang, responsive và reduced motion.
- `src/components/DashboardLayout.jsx`: sidebar, active navigation, menu mobile, header, profile, đăng xuất, không gian thi tập trung.
- `src/components/navigation.js`: khai báo menu ADMIN/STUDENT dùng chung.
- `src/components/AuthBrand.jsx`: branding dùng chung cho đăng nhập/đăng ký.
- `src/components/UI.jsx`: Icon, Skeleton, EmptyState, Notice, Toast, Progress, StatCard, ScoreChart, FeedbackProvider. Dialog dùng native dialog với focus và Escape; toast có nút đóng.
- `src/components/useConfirm.js`: context/hook xác nhận bất đồng bộ.

Không thêm thư viện hoặc thay đổi package.json/package-lock.json. Biểu đồ dùng CSS conic-gradient và cột CSS, có nhãn và số liệu văn bản.

## Widget và nguồn dữ liệu

| Widget | Nguồn |
| --- | --- |
| Tổng môn học | GET /subjects |
| Tổng câu hỏi | GET /questions |
| Tổng đề, đề đã xuất bản, phân bố DRAFT/PUBLISHED/CLOSED | GET /exams/admin |
| Tổng lượt thi, điểm trung bình/cao nhất, sinh viên tham gia, kết quả gần đây và phân bố điểm ADMIN | GET /admin/results |
| Đề có thể làm, danh sách đề STUDENT | GET /exams |
| Bài đã làm, điểm trung bình/cao nhất, lịch sử gần đây và phân bố điểm STUDENT | GET /attempts/my-results |
| Tiến độ trả lời | Câu hỏi và đáp án của lượt thi hiện tại |
| Tiến độ đúng | correct / total của kết quả hiện có |

Không sinh dữ liệu demo trong ứng dụng. Dashboard dùng Promise.allSettled để lỗi một API không che các nguồn còn lại. Chỉ số không tải được hoặc chưa có điểm hiển thị dấu gạch và thông báo phù hợp. Kết quả STUDENT chỉ lấy từ API của tài khoản hiện tại. Nhóm điểm gồm [0,2), [2,4), [4,6), [6,8), [8,10]. Trung bình tính trên toàn bộ lượt thi API trả về.

## Kiểm tra

- Build: `npm.cmd run build -- --outDir dist-redesign --emptyOutDir false` thành công, 109 module.
- Build mặc định không ghi được thư mục dist cũ: Windows trả EPERM khi xóa dist/assets hoặc ghi dist/favicon.svg. Chưa đổi quyền, xóa cưỡng bức hoặc đổi cấu hình Vite để né lỗi này. Output đã kiểm tra nằm ở dist-redesign.
- Lint: `npm.cmd run lint` bằng Oxlint hiện có của dự án, exit 0, không lỗi. Không cài ESLint song song. Còn 4 cảnh báo ở AuthContext (Fast Refresh), SubjectManagementPage và ExamManagementPage (set-state-in-effect), TakeExamPage (immutability của biến cancelled). Giữ nguyên các logic này.
- Import/export và cú pháp JSX/CSS: qua production build.
- HTTP SPA fallback: cả 12 URL trang đăng nhập/đăng ký, dashboard, quản lý và các trang sinh viên trả HTTP 200 từ Vite. Đây là kiểm tra phục vụ HTML, không xác nhận auth/role hay API nghiệp vụ.
- Chưa kiểm thử trực quan trên trình duyệt/mobile: phiên làm việc không có công cụ browser/node_repl khả dụng.
- Chưa đăng nhập bằng tài khoản thật hoặc kiểm thử end-to-end với backend; không khẳng định luồng nghiệp vụ đã được xác nhận thực tế.

## Checklist cần kiểm tra với backend và tài khoản thật

1. Đăng nhập/đăng ký, đăng xuất; truy cập URL quản trị bằng STUDENT phải bị chặn.
2. Đối chiếu KPI dashboard với danh sách thật, cả khi dữ liệu rỗng và API lỗi.
3. Thêm/sửa/xóa môn, câu hỏi; kiểm tra lọc môn, hiển thị giải thích, xác nhận/hủy và lỗi backend.
4. Tạo/sửa đề nháp, thêm/bỏ câu, xuất bản, đóng đề; đảm bảo trạng thái giới hạn đúng thao tác.
5. Bắt đầu thi, chọn đáp án liên tiếp, chuyển câu, refresh trang và đối chiếu đáp án khôi phục.
6. Kiểm tra autosave khi mất mạng, thử nộp lại khi lỗi; kiểm tra timer theo deadline server.
7. Mở hộp thoại nộp rồi chờ hết giờ; bài phải tự nộp và điều hướng kết quả, không bị modal chặn.
8. Kiểm tra nộp thủ công, chấm điểm, đáp án đúng/sai, giải thích và lịch sử của đúng tài khoản.
9. Kiểm tra màn hình 360/390/768/1024/1440px: menu mobile mở/đóng, bảng cuộn trong khung, form không tràn, timer và nút nộp truy cập được.
10. Kiểm tra bàn phím, focus, Escape, reduced motion và font khi offline.

Chạy phát triển: `npm.cmd run dev`. Xem build đã kiểm tra: `npm.cmd run preview -- --outDir dist-redesign`.
