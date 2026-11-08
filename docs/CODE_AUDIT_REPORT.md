# Báo cáo rà soát ExamHub Mini

Ngày: 06/11/2026. Phạm vi: toàn bộ backend/src, backend/prisma (schema và hai migration ban đầu), frontend/src, package manifest/lock, Vite, cấu hình lint và các mẫu môi trường mới bổ sung. Không đọc node_modules/dist để khảo sát source. Không hiển thị giá trị .env, thay tài khoản demo, chạy E2E, truy vấn/ghi/xóa database thật hoặc tạo commit.

## 1. Tổng quan dự án

- Backend: Node.js ES Modules, Express 4, Prisma Client/CLI 6.19.3, MySQL, JWT và bcryptjs. Prisma được khai báo tại package.json gốc; các dependency HTTP/auth ở backend/package.json. Phải cài dependency ở cả thư mục gốc lẫn backend.
- Frontend: React 19, Vite 8, React Router 7, Axios và fetch; AuthContext quản lý đăng nhập. Zustand có dependency nhưng source hiện không sử dụng.
- Module thực tế: auth, môn học, ngân hàng câu hỏi, quản lý đề, lượt làm bài, kết quả sinh viên và quản trị. HomePage là dashboard theo vai trò, không có trang dashboard riêng.
- Express mặc định :5000; Vite mặc định :5173; API có prefix /api. CORS sử dụng FRONTEND_URL. Tên database được cấu hình qua DATABASE_URL, chưa đối chiếu server MySQL thật.
- Không có seed trong source đã khảo sát. Thư mục exam-hub lồng bên trong không có source được liệt kê. Workspace không phải Git repository nên không có Git diff/baseline để so sánh các thay đổi có trước phiên làm việc.

## 2. Danh sách lỗi phát hiện

Vị trí dùng tên hàm/khối code để tránh số dòng thay đổi sau chỉnh sửa.

| Mức độ | File / vị trí | Lỗi và hậu quả | Nguyên nhân | Trạng thái |
|---|---|---|---|---|
| CRITICAL | backend/src/controllers/attempt.controller.js, imports | Backend không thể parse/khởi động | Khai báo hideCorrectAnswers hai lần | Đã sửa |
| CRITICAL | backend/prisma/migrations, ExamAttempt/Result | Database dựng bằng migration thiếu activeKey, answers, questionSnapshot, attemptId và unique/FK; API lượt thi/kết quả lỗi | Schema đã phát triển nhưng migration chưa cập nhật | Đã thêm migration; CHƯA áp dụng/đối chiếu database thật |
| CRITICAL | backend/src/services/attempt.service.js, gradeAttempt | Có thể chấm từ answers cũ khi lưu và nộp đồng thời | Đọc answers trước khi giữ khóa hàng | Đã khóa hàng trước đọc, giữ transaction, unique và retry P2034 |
| HIGH | frontend/src/pages/ExamManagementPage.jsx, import CSS | Frontend build lỗi | CSS nằm trong pages/student nhưng import từ pages | Đã sửa |
| HIGH | frontend/src/services/{adminExamApi,adminResultApi,examApi}.js | API bị 401 dù đã đăng nhập | AuthContext lưu examhub_token, services đọc token | Đã thống nhất; hai service admin dùng Axios chung |
| HIGH | frontend/src/pages/ExamManagementPage.jsx, openQuestions | Không mở/thêm/xóa được câu hỏi của đề từ giao diện | Backend trả data.questions, UI đọc data.examQuestions | Đã sửa và lấy trạng thái đề mới nhất từ response |
| HIGH | frontend/src/pages/student/TakeExamPage.jsx, submitExam | Lỗi lưu trước đó làm những lần nộp tiếp tục thất bại | Chờ lại Promise đã reject mà không phục hồi | Đã sửa; nộp thủ công thử lưu lại và mở khóa khi lỗi |
| HIGH | frontend/src/pages/student/TakeExamPage.jsx, submitExam | Hết giờ không chuyển sang kết quả dù Backend đã chấm | Luôn gọi save trước submit; save hết giờ trả 409 và resultId bị bỏ | Tự động nộp gọi submit sau hàng đợi, xử lý resultId khi lưu thủ công gặp hết giờ |
| HIGH | backend/src/controllers/attempt.controller.js, startExam | Bắt đầu hai tab có thể nhận 500 | Unique activeKey có nhưng không xử lý P2002 | Đã trả attemptId của lượt thắng cuộc; trả 409 nếu lượt vừa kết thúc |
| HIGH | backend/src/controllers/question.controller.js, updateQuestion | Sửa câu thuộc đề đã xuất bản/đóng; đổi môn làm đề chứa câu khác môn | Thiếu kiểm tra liên kết đề | Đã chặn sửa câu thuộc PUBLISHED/CLOSED, chặn đổi môn khi đang gắn đề |
| HIGH | frontend/src/pages/HomePage.jsx | Không có lối vào chức năng sau đăng nhập | Dashboard vẫn hiển thị thông báo chức năng chưa được làm | Đã thêm link theo vai trò |
| MEDIUM | backend/src/services/attempt.service.js; các controller danh sách kết quả | Đóng tab, hết giờ rồi vào lịch sử không thấy kết quả | Không có điểm kích hoạt chấm bù tại lịch sử | Đã chấm bù bài hợp lệ đã hết giờ khi tải lịch sử hoặc danh sách ADMIN |
| MEDIUM | backend/src/controllers/attempt.controller.js, startExam | Bài cũ hết giờ được chấm nhưng ngay lập tức tạo lượt mới | Tiếp tục chạy sau gradeAttempt | Đã trả lượt cũ/kết quả để xem lại |
| MEDIUM | backend/src/controllers/exam.controller.js, create/update | Tên đề 192–200 ký tự qua validate nhưng DB từ chối | MySQL String là VARCHAR(191), validate cho phép 200 | Đã thống nhất giới hạn 191 |
| MEDIUM | frontend/src/api/axios.js | Cấu hình URL chỉ tác động một số services | Axios chung hardcode URL | Đã dùng VITE_API_URL thống nhất |
| MEDIUM | frontend/src/services/examApi.js | Request treo có thể giữ trạng thái lưu/nộp vô hạn | fetch không có timeout | Đã thêm timeout 15 giây và giữ code/resultId của lỗi |
| MEDIUM | backend/src/controllers/result.controller.js | Lấy cả ngân hàng câu hỏi hiện tại khi xem kết quả; snapshot sai kiểu gây lỗi map | Query dư và chỉ kiểm tra null | Bỏ query câu hiện tại; kiểm tra Array; thông báo khi kết quả cũ không có snapshot |
| MEDIUM | backend/src/server.js; frontend/src/contexts/AuthContext.jsx | Thiếu env chỉ lỗi lúc đăng nhập; lỗi mạng /me xóa token hợp lệ | Không validate env; catch không phân biệt 401 | Đã fail sớm không in giá trị, chỉ xóa token khi /me trả 401 |
| MEDIUM | backend/src/app.js | JSON quá lớn/chuỗi quá dài trả lỗi 500; log lỗi có thể chứa dữ liệu không cần thiết | Error handler chung | Đã trả 413/400 và chỉ log loại/mã lỗi |
| MEDIUM | frontend/src/components/ProtectedRoute.jsx | Trang quản lý/danh sách thiếu lối quay lại dashboard | Không có điều hướng chung | Đã thêm link Trang chủ ngoài trang đang làm bài |
| LOW | frontend/src/pages/QuestionManagementPage.jsx; App.css | Không lọc câu theo môn; trang CRUD thiếu khoảng đệm | UI chưa hoàn thiện | Đã thêm lọc đơn giản và CSS tối thiểu |
| LOW | frontend/src/pages/student/TakeExamPage.jsx | Gán ref lúc render gây cảnh báo React | submitRef.current được gán trực tiếp | Đã chuyển vào effect |

## 3. Những file đã sửa / thêm

Backend:

- `backend/src/app.js`: xử lý lỗi kích thước/body/snapshot cũ, log không chứa toàn bộ lỗi.
- `backend/src/server.js`: kiểm tra sự hiện diện DATABASE_URL/JWT_SECRET.
- `backend/src/middlewares/auth.middleware.js`: validate userId trong JWT.
- `backend/src/controllers/attempt.controller.js`: bỏ import trùng, xử lý bắt đầu trùng và lượt hết giờ.
- `backend/src/services/attempt.service.js`: khóa hàng trước đọc, retry transaction, chấm bù bài hết giờ khi quay lại; không tự suy diễn snapshot cũ.
- `backend/src/controllers/question.controller.js`: bảo vệ câu đang thuộc đề công bố/đóng và việc đổi môn.
- `backend/src/controllers/exam.controller.js`: giới hạn tên 191 ký tự.
- `backend/src/controllers/result.controller.js`: chấm bù lịch sử, dùng snapshot và báo khả năng xem chi tiết.
- `backend/src/controllers/admin-result.controller.js`: chấm bù danh sách và báo khả năng xem chi tiết.
- `backend/prisma/migrations/20261106090000_complete_attempt_storage/migration.sql`: migration bổ sung cột, unique và FK; không xóa dữ liệu.
- `backend/package.json`: scripts Prisma validate/generate và unit test. Prisma vẫn dùng dependency tại thư mục gốc như cấu trúc ban đầu.
- `backend/package-lock.json`: đã được npm xác nhận lại ở chế độ offline, không nâng dependency chủ động.
- `backend/.env.example`: mẫu cấu hình, không sao chép bí mật thật.
- `backend/tests/attempt.service.test.js`: ba kiểm tra cô lập bằng dữ liệu giả, không kết nối DB.

Frontend:

- `frontend/src/api/axios.js`: URL từ môi trường, tiếp tục đọc examhub_token.
- `frontend/src/services/adminExamApi.js`, `frontend/src/services/adminResultApi.js`: tái sử dụng Axios chung.
- `frontend/src/services/examApi.js`: key token, timeout và dữ liệu lỗi.
- `frontend/src/contexts/AuthContext.jsx`: không xóa token khi lỗi mạng/500.
- `frontend/src/components/ProtectedRoute.jsx`: đường về dashboard.
- `frontend/src/pages/ExamManagementPage.jsx`: CSS, response questions và trạng thái đề.
- `frontend/src/pages/student/TakeExamPage.jsx`: phục hồi hàng đợi lỗi, nộp hết giờ, xử lý kết quả và ref effect.
- `frontend/src/pages/HomePage.jsx`: link chức năng theo vai trò.
- `frontend/src/pages/QuestionManagementPage.jsx`: lọc câu theo môn.
- `frontend/src/pages/student/ResultDetailPage.jsx`, `frontend/src/pages/AdminResultsPage.jsx`: thông báo kết quả cũ thiếu snapshot.
- `frontend/src/App.css`: bố cục/dashboard/navigation tối thiểu.
- `frontend/.env.example`: URL API mẫu.

Tài liệu: `docs/CODE_AUDIT_REPORT.md`.

## 4. Những vấn đề chưa xử lý / giới hạn

1. **Chưa kiểm tra database thật và chưa áp dụng migration.** Không thể khẳng định schema đang chạy trùng schema.prisma. Nếu trước đây đã db push/thêm cột thủ công, migration mới có thể gặp trùng cột/index. Phải đối chiếu trước, không chạy migrate reset hoặc force-reset. Đây là điều kiện còn thiếu để demo.
2. **Dữ liệu lịch sử thiếu snapshot:** không có cách chứng minh nội dung/đáp án gốc. Migration không bịa snapshot hoặc nối Result cũ với attempt bằng suy đoán. Điểm tổng kết Result cũ vẫn hiển thị; chi tiết báo chưa có snapshot. Bài hết giờ thiếu snapshot được bỏ qua khi chấm bù để không làm hỏng cả danh sách; nộp riêng trả 409 rõ lý do. Không thay/xóa dữ liệu cũ.
3. **Chưa kiểm thử E2E/MySQL concurrency:** các kiểm tra giả không chứng minh được hành vi khóa, deadlock hay mạng thực tế. Cần thực hiện checklist bên dưới.
4. Bốn cảnh báo lint còn lại: `react/set-state-in-effect` ở SubjectManagementPage và ExamManagementPage; `react/immutability` ở biến cờ cleanup của TakeExamPage; `react/only-export-components` ở AuthContext. Không có lỗi Rules of Hooks. Hai cảnh báo effect gắn với tải dữ liệu; biến cancelled dùng để ngăn cập nhật sau unmount; export hook cùng provider chỉ ảnh hưởng Fast Refresh. Không tách/rewrite module chỉ để làm sạch cảnh báo.
5. Không thêm scheduler: bài đóng tab sẽ được chấm khi mở lại lượt thi, bắt đầu lại hoặc tải lịch sử/admin results; không chấm chủ động đúng mili giây nếu không có request. Trả lời sau deadline luôn bị từ chối và giao diện khóa khi đồng hồ về 0.
6. Hai tab dùng cùng một attempt; không thiết kế đồng bộ đáp án trực tiếp giữa tab. Mỗi lần lưu là toàn bộ answers, vì vậy tab cũ có thể ghi đè lựa chọn ở tab khác. Demo dùng một tab để làm bài; kiểm tra nhiều tab chủ yếu xác nhận không tạo hai lượt hoạt động. Không thêm Redis/version/chống gian lận.
7. Các thao tác quản trị đồng thời từ nhiều tab vẫn có thể dùng trạng thái đọc trước ở một số CRUD. Chưa triển khai khóa toàn bộ module ADMIN; không phải mục tiêu của demo một quản trị viên. Snapshot bảo vệ điểm của lượt đã bắt đầu.
8. Xóa câu đang thuộc bất kỳ đề nào vẫn bị FK chặn (409), kể cả DRAFT; muốn xóa câu, gỡ khỏi đề trước. Đây là lựa chọn bảo toàn dữ liệu đơn giản đã có, không thay cascade.
9. JWT lưu localStorage, logout xóa token phía trình duyệt; không bổ sung cơ chế thu hồi JWT server. Phù hợp phạm vi đồ án, không đánh giá là production-ready.

## 5. Kết quả kiểm tra không phá hủy dữ liệu

| Lệnh / kiểm tra | Kết quả |
|---|---|
| `node --version` | v24.16.0 |
| `node --check` cho toàn bộ backend/src/**/*.js | Thành công sau sửa |
| Import backend/src/app.js bằng Node, không listen và không query DB | Thành công |
| `npm.cmd run build` trong frontend | Thành công, 103 module |
| `npm.cmd run lint` trong frontend | Exit 0, còn 4 warning đã nêu |
| `npm.cmd ls --depth=0` ở frontend/backend | Thành công, không thiếu dependency đã khai báo |
| `npm.cmd install --package-lock-only --ignore-scripts --offline --prefix backend` cuối cùng | Thành công, lock được xác nhận; không chạy install scripts |
| Prisma validate từ thư mục gốc ban đầu | Thất bại vì không load backend/.env từ cwd gốc; không phải lỗi schema |
| `..\node_modules\.bin\prisma.cmd validate --schema prisma/schema.prisma` trong backend | Thành công, Prisma 6.19.3 |
| `..\node_modules\.bin\prisma.cmd generate --schema prisma/schema.prisma` trong backend | Thành công, chỉ sinh Client cục bộ, không ghi DB |
| `node --test backend/tests/attempt.service.test.js` | 3/3 pass; kiểm tra snapshot không lộ đáp án, dữ liệu answers sai kiểu, điểm 3.3 cho 1/3 câu, EXPIRED vẫn có Result, activeKey null và nộp lặp cùng result |
| Đối chiếu routes/import/JSON | Hoàn tất bằng source và build; bảng hợp đồng bên dưới |
| Kết nối MySQL, migrate status/deploy, API thật, trình duyệt, E2E | CHƯA CHẠY theo phạm vi yêu cầu |

PowerShell chặn npm.ps1 nên dùng npm.cmd, không thay ExecutionPolicy. Python alias không thực thi được; dùng Node để chỉnh file. Hai lần thử bổ sung dependency Prisma vào backend theo chế độ offline không đủ npm cache; đã giữ cấu trúc dependency Prisma tại package gốc và xác nhận lại backend lock thành công. Không cần mạng cho các kiểm tra cuối.

### Đối chiếu API

Mọi response nghiệp vụ dùng `{ success, data }`; lỗi dùng `{ success: false, message }`, đôi khi có code/data.resultId. Các service unwrap đúng data. Backend kiểm tra JWT và role ở route, không dựa vào Frontend.

| Method / URL (prefix /api) | Quyền | Input / response data đã đối chiếu |
|---|---|---|
| POST /auth/register | Công khai | fullName,email,password → user,token; role luôn STUDENT; bcrypt cost 12 |
| POST /auth/login | Công khai | email,password → user,token |
| GET /auth/me | Đăng nhập | user, không passwordHash |
| GET /subjects | Công khai | Mảng môn |
| POST /subjects; PUT /subjects/:id; DELETE /subjects/:id | ADMIN | name,description; subject hoặc message; FK/trùng tên trả 409 |
| GET /questions | ADMIN | Mảng câu, subject |
| POST /questions; PUT /questions/:id | ADMIN | subjectId,content,optionA/B/C/D,correctAnswer,explanation; dữ liệu câu |
| DELETE /questions/:id | ADMIN | Chặn FK 409 nếu đang thuộc đề |
| GET /exams/admin | ADMIN | Mảng đề, subject, _count.examQuestions |
| POST /exams; PUT /exams/:id; DELETE /exams/:id | ADMIN | subjectId,title,description,durationMinutes; sửa/xóa chỉ DRAFT |
| GET /exams/:id/questions | ADMIN | `{ exam, totalQuestions, questions }`; item chứa questionId và question |
| POST /exams/:id/questions | ADMIN | questionId; kiểm tra cùng môn, DRAFT và unique |
| DELETE /exams/:id/questions/:questionId | ADMIN | Chỉ DRAFT, transaction sắp lại vị trí |
| PATCH /exams/:id/publish | ADMIN | DRAFT có ít nhất 1 câu → PUBLISHED |
| PATCH /exams/:id/close | ADMIN | PUBLISHED → CLOSED; response chỉ message |
| GET /exams; GET /exams/:id | Đăng nhập | Chỉ PUBLISHED; list có _count; detail có totalQuestions; không có đáp án |
| POST /exams/:id/start | STUDENT | Không nhận điểm/đáp án từ client; tạo/resume attemptId; snapshot chỉ trả nội dung công khai |
| GET /attempts/:attemptId | STUDENT, chủ sở hữu | attemptId,status,answers,questions,serverTime,expiresAt; hết giờ/kết thúc trả resultId |
| PUT /attempts/:attemptId/answers | STUDENT, chủ sở hữu | answers object, ID có trong snapshot, A/B/C/D; chặn sau deadline; 409 EXAM_EXPIRED kèm resultId |
| POST /attempts/:attemptId/submit | STUDENT, chủ sở hữu | Chấm answers đã lưu, không dùng điểm client; trả resultId,score,total,correct,incorrect |
| GET /attempts/my-results | STUDENT | Chỉ kết quả req.user.id, mảng kèm exam/subject; chấm bù lượt hết giờ hợp lệ |
| GET /attempts/results/:id | STUDENT, chủ sở hữu | Snapshot, selectedAnswer,correctAnswer,explanation, điểm; kết quả người khác trả 404 |
| GET /admin/results; GET /admin/results/:id | ADMIN | List có user/exam/score; detail có student/exam/questions |

Route tĩnh /exams/admin và /attempts/my-results đứng trước route động tương ứng. Các endpoint câu hỏi và kết quả ADMIN đều được bảo vệ. GET công khai môn học chỉ đọc dữ liệu danh mục, không có đáp án.

### Prisma / migration

Schema có User.email unique, Subject.name unique, ExamQuestion unique (examId,questionId) và (examId,position), ExamAttempt.activeKey nullable unique và Result.attemptId nullable unique. Chỉ Exam → ExamQuestion cascade delete; các FK bắt buộc còn lại bảo vệ dữ liệu liên quan. Result.attemptId nullable để giữ dữ liệu trước cơ chế attempt; FK mới dùng SET NULL phù hợp quan hệ optional.

Migration mới chỉ ADD COLUMN, CREATE UNIQUE INDEX và ADD FOREIGN KEY; không chạy trong phiên này. Các cột mới bắt đầu NULL, không backfill dữ liệu lịch sử không đủ căn cứ. Không sửa migration cũ hay schema tùy tiện.

## 6. Mức độ sẵn sàng demo

**BLOCKED — còn thiếu xác nhận schema/database thực tế.** Source đã qua build, syntax, import, schema validate và kiểm tra giả; chưa thể tuyên bố website chạy hoàn chỉnh. Cần đối chiếu DB với migration trước, xử lý drift nếu có, sau đó chuyển sang kiểm thử tổng thể. Đây không phải kết luận rằng MySQL đang lỗi; chưa có bằng chứng để xác nhận trạng thái của nó.

### Chuẩn bị và khởi động (chưa thực thi migration)

Cài nếu máy chưa có dependency:

```powershell
# D:\My_Project\exam-hub
npm.cmd ci
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Giữ nguyên backend/.env đang có; chỉ tham khảo .env.example nếu thiết lập máy mới. Không ghi đè tài khoản/bí mật hiện tại. VITE_API_URL đã bao gồm /api; FRONTEND_URL phải khớp origin Frontend.

Trước khi migrate, sao lưu theo quy trình đang dùng và kiểm tra schema qua công cụ MySQL của dự án: SHOW COLUMNS/SHOW INDEX của exam_attempts và results, đối chiếu _prisma_migrations. Không đưa mật khẩu vào lệnh/báo cáo. Nếu toàn bộ migration trước đã áp dụng và chưa có cột/index mới, lệnh bổ sung an toàn dự kiến là:

```powershell
cd D:\My_Project\exam-hub\backend
..\node_modules\.bin\prisma.cmd migrate status
# Chỉ chạy deploy sau khi xác nhận không có schema drift/trùng cột:
..\node_modules\.bin\prisma.cmd migrate deploy
npm.cmd run prisma:generate
npm.cmd run dev
```

Nếu cột/index đã tồn tại do db push/chỉnh thủ công, không chạy deploy mù quáng và không dùng migrate resolve --applied trước khi chứng minh toàn bộ cấu trúc khớp migration. Cần xử lý lịch sử migration tương ứng ở giai đoạn kiểm thử sau.

Terminal khác:

```powershell
cd D:\My_Project\exam-hub\frontend
npm.cmd run dev -- --port 5173 --strictPort
```

Backend mặc định http://localhost:5000, Frontend http://localhost:5173. `GET /api/health` chỉ xác nhận HTTP server, không chứng minh kết nối DB.

## 7. Checklist kiểm thử tổng thể (CHƯA thực hiện)

1. Xác nhận MySQL đang chạy, schema và migration đồng nhất; sinh Prisma Client. Khởi động Backend/Frontend, kiểm tra health, không có lỗi terminal/console.
2. Đăng nhập ADMIN bằng tài khoản demo đang có; refresh vẫn đăng nhập. Thử đăng nhập sai, body thiếu/sai kiểu. Không in password/token ra console.
3. Từ dashboard vào môn học: danh sách rỗng, thêm tên hợp lệ, trùng tên, sửa, xóa môn chưa dùng; môn có dữ liệu phải bị chặn 409.
4. Thêm câu với đủ A/B/C/D, đáp án và giải thích; thử trường trống/đáp án sai; lọc theo môn, sửa và xóa câu chưa sử dụng.
5. Tạo DRAFT, sửa tên/thời lượng; thử thời lượng ngoài 1–300; kiểm tra tên >191 bị từ chối; xóa một DRAFT chưa dùng.
6. Mở câu hỏi của DRAFT, thêm câu đúng môn; không thêm trùng/khác môn. Xóa câu ở đầu/giữa rồi thêm lại, xác nhận vị trí/số câu đúng. Không đổi môn câu/đề khi đã gắn câu.
7. Đề rỗng không xuất bản được. Xuất bản đề có câu; sửa/xóa đề hoặc sửa câu liên quan phải bị chặn. Kiểm tra qua API trực tiếp, không chỉ trạng thái nút UI.
8. Đăng ký STUDENT mới hoặc dùng tài khoản demo hiện có. Logout xong không truy cập trang bảo vệ; STUDENT gọi API ADMIN phải nhận 403. Thiếu/sai/hết hạn JWT phải 401.
9. Danh sách sinh viên chỉ có PUBLISHED, đúng tên/môn/thời lượng/số câu. Trang giới thiệu mở được; DRAFT/CLOSED không thể start qua API.
10. Nhấn bắt đầu hai lần hoặc hai tab: cùng attemptId còn hoạt động, không có hai activeKey cùng user:exam. Kiểm tra response không có correctAnswer/explanation.
11. Chọn đáp án, chuyển câu trước/sau và nhảy số câu; kiểm tra trạng thái đã trả lời. Đợi lưu xong rồi refresh: giữ attemptId, answers và deadline.
12. Ngắt mạng lúc lưu, kết nối lại rồi nộp thủ công: retry lưu được và nút nộp không bị khóa vĩnh viễn. Khi lưu cuối thất bại, hiện lỗi để thử lại, không âm thầm chấm thiếu lựa chọn mới.
13. Nộp thủ công: chuyển đến đúng resultId, thang 10 làm tròn một chữ số; số đúng/tổng/đáp án chọn/đúng/giải thích khớp snapshot. Thử bấm nộp nhiều lần, chỉ một Result cho attempt.
14. Với đề 1 phút: chọn vài câu, chờ deadline; radio khóa ở 0, tự nộp và xem kết quả EXPIRED. PUT answers sau hạn phải bị từ chối; POST submit sau hạn vẫn trả kết quả đã chấm.
15. Đóng tab trước deadline, đợi hết giờ rồi mở lịch sử: bài được chấm bù, activeKey được giải phóng. Bắt đầu từ trang giới thiệu khi còn active đã hết giờ dẫn về kết quả cũ; lần bắt đầu kế tiếp có thể tạo lượt mới.
16. Gửi lưu/nộp đồng thời và submit nhiều request trên MySQL: xác nhận không sai điểm do đọc answers cũ, không trùng Result và không sót activeKey. Unit test giả không thay thế bước này.
17. STUDENT khác thử ID attempt/result không thuộc mình: 404, không đọc/sửa/nộp được. ADMIN xem danh sách và chi tiết, thông tin sinh viên/đề/môn/điểm/thời điểm khớp.
18. ADMIN đóng PUBLISHED: không còn ở danh sách mở và không start mới; lượt đã bắt đầu vẫn được hoàn tất theo deadline/snapshot. Câu thuộc CLOSED không được sửa/xóa.
19. Kiểm tra kết quả cũ không có snapshot: vẫn xem điểm, có thông báo thiếu chi tiết; không lấy đáp án ngân hàng hiện tại để giả làm lịch sử.
20. Kiểm tra trang rỗng, URL/ID không hợp lệ, nút quay Trang chủ, layout trên laptop, console React và lỗi mạng. Chỉ đánh dấu hoàn tất demo sau khi toàn bộ bước chính đã được kiểm thử thật.
