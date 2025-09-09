<p align="center">
  <img src="https://bun.sh/logo.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/honojs/hono/main/docs/images/hono-title.png" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://vitejs.dev/logo.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/colinhacks/zod/master/logo.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.worldvectorlogo.com/logos/prisma-2.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.worldvectorlogo.com/logos/sqlite.svg" height="70" />
</p>

<h1 align="center">
  Office Format Grader — Monorepo
</h1>

<p align="center"><strong>Web tool full-stack chấm điểm file Office (Word và PowerPoint)</strong></p>

---

## 🎯 Mục tiêu

- Cung cấp **API Backend** để upload, chấm điểm theo rubric (mặc định hoặc custom), export kết quả Excel, thống kê dashboard.  
- Cung cấp **Frontend UI** để người dùng thao tác trực quan: đăng nhập, upload file, chấm điểm, xem kết quả, export.  
- Monorepo quản lý cả hai app trong cùng workspace.

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

