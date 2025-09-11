<p align="center">
  <img src="https://bun.sh/logo.svg" height="60" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/honojs/hono/main/docs/images/hono-title.png" height="60" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://vitejs.dev/logo.svg" height="60" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" height="60" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/colinhacks/zod/master/logo.svg" height="60" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.worldvectorlogo.com/logos/prisma-2.svg" height="60" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.worldvectorlogo.com/logos/sqlite.svg" height="60" />
</p>

<h1 align="center">
  Office Format Grader — Monorepo
</h1>

<p align="center"><strong>Web tool full-stack chấm điểm file Office (Word và PowerPoint)</strong></p>

---

## 🎯 Mục tiêu

Dự án **Office Format Grader** ra đời nhằm giải quyết bài toán **tự động chấm điểm và đánh giá chất lượng file Office (Word, PowerPoint)** dựa trên rubric. Thay vì phải chấm thủ công, công cụ này cho phép giảng viên hoặc người dùng nhanh chóng tải lên nhiều file, áp dụng rubric mặc định hoặc tùy chỉnh, và nhận lại điểm số cùng phản hồi chi tiết. Ngoài ra, kết quả có thể được **xuất ra Excel** để lưu trữ, phân tích và theo dõi tiến độ.  

Dự án được triển khai theo mô hình **monorepo**, trong đó backend và frontend được đặt trong cùng một workspace, giúp dễ dàng quản lý dependencies, đồng bộ script và phát triển full-stack liền mạch. Cấu trúc này không chỉ tối ưu cho phát triển cá nhân mà còn sẵn sàng để mở rộng và phát triển trong tương lai.

---

## 📂 Cấu trúc dự án

```text
office-format-grader/
├── apps/
│   ├── backend/     # Backend
│   └── frontend/    # Frontend
├── package.json     # Workspace config + root scripts
└── README.md        # README tổng quan
````

## 🎨 UI / UX Overview

Giao diện của **Office Format Grader** được thiết kế hiện đại, trực quan, tập trung vào trải nghiệm đơn giản và hiệu quả. Toàn bộ layout theo dạng **sidebar navigation** cố định bên trái, các trang chức năng hiển thị rõ ràng với Mantine UI và biểu đồ/tables dễ theo dõi.

### 🔑 Đăng nhập

<div align="center">
  <img src="public/screenshot/login.png" width="800" />
  <p>Màn hình đăng nhập đơn giản, hỗ trợ tài khoản demo để thử nghiệm nhanh.</p>
</div>

---


### 📊 Bảng điều khiển (Dashboard)

<div align="center">
  <img src="public/screenshot/dashboard.png" width="800" />
  <p>Hiển thị tổng số file đã chấm, file chưa chấm, số rubric custom, và điểm trung bình.</p>
  <p>Có khu vực Hành động nhanh: Upload file, xem lịch sử, truy cập rubric.</p>
</div>

---


### 📂 Upload tài liệu

<div align="center">
  <img src="public/screenshot/upload-single-file.png" width="800" />
  <p>Upload đơn lẻ: chọn một file .docx hoặc .pptx.</p>
</div>

<div align="center">
  <img src="public/screenshot/upload-multi-file.png" width="800" />
<p>Upload hàng loạt: chọn nhiều file cùng lúc.</p>
</div>

<div align="center">
  <img src="public/screenshot/upload-compressed-file.png" width="800" />
  <p>Upload file nén: hệ thống tự động giải nén và chấm điểm từng file.</p>
</div>

---


### 🕑 File chưa chấm & Lịch sử chấm

<div align="center">
  <img src="public/screenshot/ungrade.png" width="800" />
  <p>File chưa chấm: hiển thị danh sách chờ xử lý. Người dùng có thể chọn và bắt đầu chấm điểm.</p>
</div>

<div align="center">
  <img src="public/screenshot/history.png" width="800" />
  <p>Lịch sử chấm: hiển thị kết quả đã chấm với phân trang, cho phép xem chi tiết hoặc xóa.</p>
</div>

---


### 📑 Quản lý & tùy chỉnh tiêu chí (Rubric)

<div align="center">
  <img src="public/screenshot/criteria-custom.png" width="800" />
  <p>Danh sách toàn bộ tiêu chí chấm điểm (mặc định + tùy chỉnh).</p>
</div>

<div align="center">
  <img src="public/screenshot/criteria-list.png" width="800" />
  <p>Cho phép xem trước, sửa đổi, xóa, hoặc tạo rubric mới.</p>
</div>

<div align="center">
  <img src="public/screenshot/criteria-validate-json.png" width="800" />
  <p>Có tính năng kiểm tra rubric để đảm bảo hợp lệ trước khi sử dụng.</p>
</div>

---


### 📤 Xuất kết quả sang Excel

<div align="center">
  <img src="public/screenshot/export-excel.png" width="800" />
  <p>Chọn kết quả đã chấm để export.</p>
  <p>File .xlsx có thể bao gồm điểm, phần trăm, rubric áp dụng, thời gian chấm, và chi tiết tiêu chí nếu bật tùy chọn.</p>
</div>

---

## 📊 Tổng quan hệ thống

```mermaid
graph LR
  A["Frontend (Vite + React)"] -->|REST API| B["Backend (Bun + Hono)"]
  B --> C["Prisma ORM"]
  C --> D["Database: SQLite / PostgreSQL"]
  B --> E["Excel Export Service"]
  B --> F["Cleanup Cron Jobs"]
```

---

## 🔄 Luồng Tổng Hợp: FE ↔ BE (Upload → Grade → Export)

```mermaid
sequenceDiagram
  participant User as Người dùng (FE)
  participant FE as Frontend (React + Vite)
  participant BE as Backend (Bun + Hono)
  participant DB as Database (SQLite/Postgres)
  participant Excel as Excel Export Service

  User->>FE: Upload file (.docx/.pptx/.zip)
  FE->>BE: POST /upload (FormData)
  BE->>DB: Lưu metadata + đường dẫn file
  BE-->>FE: 200 OK (fileId)

  User->>FE: Yêu cầu chấm điểm
  FE->>BE: POST /grade { fileId, rubric }
  BE->>DB: Truy xuất metadata file
  BE->>BE: Trích xuất nội dung (Extractor)
  BE->>BE: Áp dụng rubric (mặc định hoặc custom)
  BE->>DB: Lưu kết quả chấm
  BE-->>FE: Score + Feedback + RubricUsed

  User->>FE: Xuất kết quả sang Excel
  FE->>BE: POST /export/excel { resultIds[], includeDetails }
  BE->>Excel: Tạo file .xlsx
  Excel-->>BE: Trả file Excel
  BE-->>FE: Download link / buffer Excel
  FE-->>User: Excel file sẵn sàng tải
```

---

## 🔑 Yêu cầu

* [Bun](https://bun.sh) ≥ 1.2
* Node.js ≥ 22.0 (dùng cho Prisma CLI và toolchain)

---

## 🚀 Quick Start

1. Cài đặt dependencies cho toàn bộ monorepo:

```bash
bun install
```

2. Tạo file `.env` từ `.env.example` cho cả hai app:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

3. Chạy setup ban đầu (migrate DB + tạo user mặc định):

```bash
bun run setup:initial
```

4. Khởi chạy cả backend và frontend trong môi trường dev:

```bash
bun run dev
```

* Backend mặc định chạy ở: `http://localhost:3000`
* Frontend mặc định chạy ở: `http://localhost:5173`

---

## 📜 Scripts

### Root Scripts

* `bun install` — Cài dependencies cho cả hai app
* `bun run dev` — Chạy dev mode cho cả FE & BE song song
* `bun run build` — Build cả hai app production
* `bun run test` — Chạy test cho cả hai app
* `bun run clean` — Xóa artifacts build

### Setup Scripts

* `bun run setup:dependencies` — Cài deps cho cả hai app
* `bun run setup:initial` — DB migrate + tạo user mặc định
* `bun run setup:all` — Setup đầy đủ (deps + DB + users)

### Backend Scripts

* `bun run dev:backend` — Start backend dev
* `bun run build:backend` — Build backend
* `bun run start:backend` — Start backend prod
* `bun run test:backend` — Test backend

### Frontend Scripts

* `bun run dev:frontend` — Start frontend dev
* `bun run build:frontend` — Build frontend
* `bun run preview:frontend` — Preview build FE
* `bun run test:frontend` — Test FE
* `bun run lint:frontend` — Lint FE
* `bun run type-check:frontend` — Check TS FE

---

## 🌍 Environment Variables

Mỗi app có `.env` riêng:

* `apps/backend/.env` — Biến môi trường backend (DB, JWT, cleanup, ...)
* `apps/frontend/.env` — Biến môi trường frontend (API URL, debug, ...)

Tham khảo `.env.example` trong từng thư mục app.

---

## ⚡ Initial Setup

Lần đầu setup dự án:

```bash
# 1. Copy env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 2. Setup DB + user
bun run setup:initial

# 3. Start dev mode
bun run dev
```
---

## 📘 Cảm nhận & Giá trị Học tập

Dự án **Office Format Grader** không chỉ là một sản phẩm thử nghiệm kỹ thuật mà còn mang lại nhiều ý nghĩa đối với quá trình học tập và phát triển cá nhân:

- **Hiểu về kiến trúc full-stack**: Từ thiết kế backend với Bun.js + Hono, JWT Auth, Prisma ORM đến xây dựng frontend bằng React + Vite, Mantine, Zustand ,TanStack Query/Router.  
- **Kinh nghiệm với monorepo**: Biết cách quản lý codebase nhiều ứng dụng trong cùng một workspace, đồng bộ script, môi trường, và quy trình CI/CD.  
- **Thực hành áp dụng best-practice**: Sử dụng Zod để validate dữ liệu, Zustand để quản lý state, lefthook cho pre-commit hook, testing với Vitest/Testing Library.  
- **Giá trị ứng dụng thực tiễn**: Giải quyết được một nhu cầu rõ ràng — chấm điểm file Word/PowerPoint tự động theo rubric, tiết kiệm công sức và tăng tính minh bạch.  
- **Tăng cường kỹ năng tự build webapp full-stack**: Trải nghiệm toàn bộ quy trình từ thiết kế database, xây dựng API, triển khai logic nghiệp vụ cho đến phát triển UI/UX hoàn chỉnh, tất cả đều do một mình tôi đảm nhiệm.  

👉 Đây là một **pet project quan trọng** giúp tôi vừa học vừa rèn kỹ năng, đồng thời tạo ra một nền tảng có thể mở rộng thành các ứng dụng phục vụ học tập và công việc trong tương lai.

