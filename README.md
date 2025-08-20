<p align="center">
  <img src="https://bun.sh/logo.svg" width="60" />
  &nbsp;
  <img src="https://raw.githubusercontent.com/honojs/hono/main/docs/images/hono-title.png" height="60" />
  &nbsp;
  <img src="https://vite.dev/logo.svg" width="70" />
  &nbsp;
  <img src="./FE/public/assets/react.png" width="70"/>
  &nbsp;
  <img src="./FE/public/assets/tanstack.png" width="70" />
</p>

<h1 align="center">
  Office Format Grader AI 📄 ➜ 🤖
</h1>

<p align="center">
  Ứng dụng AI giúp phân tích và chấm điểm các file Microsoft Office (.docx, .pptx) một cách tự động và chính xác.
</p>

---

## 📌 Giới Thiệu

**Office Format Analyzer** là hệ thống 2 thành phần:

- **Backend**: xử lý file Office, phân tích cấu trúc định dạng (text, bảng, heading, layout...), tạo output JSON chuẩn để gửi tới GenAI (Gemini 2.5).
- **Frontend**: giao diện web giúp người dùng tải lên bài làm và rubric, nhận điểm số + nhận xét từ AI.

> ✅ Mục tiêu: hỗ trợ học sinh – sinh viên nộp bài `.docx` / `.pptx` và được **chấm điểm tự động**, có phản hồi tức thì, tiết kiệm thời gian giảng viên.

---

## 🧱 Cấu Trúc Repo

```bash
office-format-analyzer/
├── BE/           # Backend API - phân tích định dạng + chấm điểm AI
├── FE/           # Frontend React - giao diện upload và hiển thị kết quả
└── README.md     # (Bạn đang ở đây)
````

---

## 🛠️ Công Nghệ Chính

| Layer        | Stack                                                                 |
| ------------ | --------------------------------------------------------------------- |
| **Backend**  | Bun.js, Hono, TypeScript, adm-zip, xml2js, Gemini 2.5 Flash (via API) |
| **Frontend** | React + Vite, TailwindCSS v4, Mantine UI, TanStack Router & Query     |
| **Runtime**  | Bun.js cho cả frontend lẫn backend (siêu tốc và đồng bộ)              |

---

## 🚀 Cách Chạy Dự Án (Local)

### 1. Backend (BE/)

```bash
cd BE/
bun install
bun run start
```

Truy cập API tại: `http://localhost:3000/api`


---

### 2. Frontend (FE/)

```bash
cd FE/
bun install
bun run dev
```

Mở trình duyệt tại: `http://localhost:5173`

> ⚙️ Cấu hình biến môi trường `.env` cho FE:

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 📌 Tiến Trình Hiện Tại

* ✅ Đã hoàn thiện toàn bộ API (BE): phân tích định dạng + chấm điểm với GenAI
* ✅ FE đã dựng UI, hiển thị kết quả AI rõ ràng, dễ dùng
* 🔄 Đang tiếp tục phát triển các tính năng nâng cao (biểu đồ điểm, drag folder...)

---

## 💡 Định Hướng Tương Lai

* [ ] Thêm chức năng nhập nhiều bài tập, trả về bảng điểm tổng hợp
* [ ] Cho phép chọn loại rubric nâng cao (có trọng số từng mục)
* [ ] Tạo dashboard dành cho giáo viên
* [ ] Triển khai full-stack lên Vercel / Railway

---

<p align="center">
  <i>Dự án giáo dục bởi Nguyễn Huỳnh Sang ✨ — Tích hợp GenAI để tự động hoá chấm điểm tài liệu.</i>
</p>

