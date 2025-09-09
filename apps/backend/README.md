<p align="center">
  <img src="https://bun.sh/logo.svg" height="80" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/honojs/hono/main/docs/images/hono-title.png" height="80" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/colinhacks/zod/master/logo.svg" height="80" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.worldvectorlogo.com/logos/prisma-2.svg" height="80" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.worldvectorlogo.com/logos/sqlite.svg" height="80" />
</p>

<h1 align="center">
  Office Format Grader — Backend API
</h1>

<p align="center"><strong>Chấm điểm file Microsoft Office theo rubric • Build bằng Bun.js + Hono + Zod + JWT (jose) + Prisma + SQLite</strong></p>

<p align="center"><strong>Build bằng Bun.js + Hono + Zod + JWT (jose) + Prisma + SQLite</strong></p>

---

## 🎯 Mục Tiêu

API này được xây dựng để:
- **Chấm điểm file `.docx` và `.pptx`** theo rubric mặc định hoặc rubric tùy chỉnh.  
- Hỗ trợ upload đơn, upload hàng loạt (tối đa 60 file), upload file nén `.zip` hoặc `.rar`.  
- Lưu trữ file chưa chấm và quản lý metadata.  
- **Xuất kết quả sang Excel** với chi tiết theo rubric.  
- Tích hợp Dashboard để theo dõi kết quả, phân phối điểm, thống kê số liệu.  

---

## ✨ Tính Năng Chính

- **Upload**: `.pptx`, `.docx`, `.zip`, `.rar`  
- **Grade**: rubric mặc định hoặc rubric tùy chỉnh (batch/chọn lọc)  
- **Export**: file Excel có thể gồm chi tiết theo tiêu chí  
- **Auth**: đăng nhập qua JWT lưu trong cookie HttpOnly  
- **Dashboard**: thống kê tổng quan, top kết quả, phân phối điểm  
- **Cleanup**: tự động dọn file tạm và metadata theo cron job  

---

## 🛠️ Công Nghệ

<div align="center">
  
| Thành phần | Công nghệ |
|------------|-----------|
| Runtime | [**Bun.js**](https://bun.sh) |
| Framework | [**Hono**](https://hono.dev) |
| Ngôn ngữ | TypeScript |
| Validator | [**Zod**](https://zod.dev) |
| Auth | JWT ([**jose**](https://github.com/panva/jose)) |
| ORM | [**Prisma**](https://www.prisma.io/) |
| Database | SQLite (dev) / PostgreSQL (prod tuỳ chọn) |
| Excel Export | `xlsx` |
| File extractors | PPTX/DOCX custom extractors |
</div>

---

## 📂 Cấu Trúc Thư Mục

```bash
src/
├── routes/              # Các route chính (auth, upload, grade, export, dashboard, ungraded, analyze)
├── controllers/         # Điều khiển logic cho từng route
├── services/            # Business logic: grade, excel, storage, cleanup
├── middlewares/         # Middleware (auth, cors, logger)
├── cron-jobs/           # Tác vụ định kỳ dọn dẹp
├── config/              # Biến cấu hình, presets, constants
├── extractors/          # Bộ phân tích PPTX/DOCX
├── schemas/             # Zod schemas validate request
├── index.ts             # Entry server
└── app.ts               # Khởi tạo Hono app + middleware
```

---

## ⚙️ Cài Đặt & Chạy

### Yêu cầu

* Bun ≥ 1.2
* Node.js ≥ 22.0 (chạy prisma CLI)
* SQLite (dev) hoặc PostgreSQL (prod)

### Cài đặt

```bash
bun install
bunx prisma generate
bunx prisma migrate dev   # tạo DB dev
bun run dev               # start dev mode
bun run start             # start production
```

### Scripts bổ sung

```bash
bunx prisma studio        # mở giao diện quản lý DB
bun run cleanup:temp      # dọn file tạm
bun run cleanup:metadata  # dọn metadata
```

---

## ⏲️ Cron Jobs

* **Temp cleanup**: dọn thư mục `temp/` sau `CLEANUP_OLDER_THAN_HOURS`
* **Metadata cleanup**: dọn dữ liệu cũ sau `METADATA_RETENTION_DAYS` theo lịch `METADATA_CLEANUP_SCHEDULE`

---

## 📡 API Endpoints (tóm tắt)

### Auth

* `POST /auth/login` — đăng nhập, trả JWT
* `POST /auth/logout` — đăng xuất
* `GET /auth/me` — thông tin user

### Upload & Ungraded

* `POST /upload` — upload file đơn/batch/zip/rar
* `GET /ungraded` — danh sách file chưa chấm
* `DELETE /ungraded/:id` — xóa file chưa chấm

### Grade

* `POST /grade` — chấm rubric mặc định
* `POST /grade/custom` — chấm rubric tùy chỉnh
* `POST /grade/custom-selective` — chấm chọn lọc tiêu chí

### Export

* `POST /export/excel` — xuất kết quả sang Excel

### Dashboard

* `GET /dashboard` — thống kê tổng quan

### Debug

* `GET /debug/analyze/:fileId` — phân tích chi tiết file (debug extractor)

---

## 🔑 Cấu Hình & Bảo Mật

Tạo `.env` từ `.env.example` hoặc `.env.production`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="24h"
PORT=3000
ALLOWED_ORIGINS="http://localhost:5173"
MAX_FILE_SIZE=52428800
MAX_FILES_PER_BATCH=60
CLEANUP_INTERVAL=3600000
CLEANUP_OLDER_THAN_HOURS=3
METADATA_RETENTION_DAYS=14
METADATA_CLEANUP_SCHEDULE="0 2 * * *"
```

**Lưu ý:**

* Bắt buộc đổi `JWT_SECRET` khi deploy.
* Chỉ cho phép origin đáng tin cậy (CORS).
* File chưa chấm chỉ giữ trong thời gian ngắn.

---

## 🧱 Kiến Trúc & Luồng

```mermaid
graph TD
  U[Client Upload] -->|FormData| A[Hono API]
  A -->|Auth| B1[Auth Module]
  A -->|Upload| B2[Storage + Metadata]
  A -->|Grade| B3[Rubric Engine]
  A -->|Export| B4[Excel Service]
  A -->|Dashboard| B5[Dashboard Stats]
  B2 --> C1[Temp Folder]
  B2 --> C2[Metadata Store]
  B3 --> C3[Extractors DOCX/PPTX]
  B3 --> C4[Score Engine + Zod Validation]
  B4 --> C5[XLSX File]
  B5 --> C6[Aggregated Data]
````
---
## 🔐 Luồng Auth (JWT + HttpOnly)

```mermaid
sequenceDiagram
  participant Client
  participant Server
  participant DB as Database
  participant JWT as JWT (jose)

  Client->>Server: POST /auth/login (username + password)
  Server->>DB: Xác thực user
  DB-->>Server: User hợp lệ
  Server->>JWT: Tạo token (SignJWT)
  JWT-->>Server: Trả JWT
  Server-->>Client: Set-Cookie: token=JWT (HttpOnly)

  Note over Client,Server: Mọi request sau phải kèm cookie token

  Client->>Server: Request API (có cookie token)
  Server->>JWT: Verify token
  JWT-->>Server: Token hợp lệ
  Server-->>Client: Trả dữ liệu (200 OK)

  alt Token hết hạn hoặc sai
    JWT-->>Server: Lỗi verify
    Server-->>Client: 401 Unauthorized
  end

  Client->>Server: POST /auth/logout
  Server-->>Client: Clear-Cookie: token
````
---

## 📤📊 Luồng Upload & Grade

```mermaid
sequenceDiagram
  participant Client
  participant Server
  participant Validator as Zod Validator
  participant Storage as Temp Storage
  participant Metadata as Metadata Store
  participant Extractor as File Extractor
  participant Rubric as Rubric Engine

  Client->>Server: POST /upload (file.docx | file.pptx | zip/rar)
  Server->>Validator: Kiểm tra định dạng + kích thước
  Validator-->>Server: Hợp lệ
  Server->>Storage: Lưu file tạm
  Server->>Metadata: Ghi metadata file
  Server-->>Client: 200 OK (trả fileId)

  Note over Client,Server: Khi user yêu cầu chấm điểm

  Client->>Server: POST /grade { fileId, rubric }
  Server->>Metadata: Lấy thông tin file
  Server->>Extractor: Trích xuất nội dung & cấu trúc file
  Extractor-->>Server: JSON dữ liệu
  Server->>Rubric: Áp dụng rubric (mặc định hoặc custom)
  Rubric-->>Server: Điểm số + feedback
  Server-->>Client: Trả kết quả (score, feedback, rubricUsed)
```
---

## 🧪 Kiểm Thử Nhanh

```bash
# Upload file
curl -X POST -F "files=@bai.docx" http://localhost:3000/upload

# Chấm theo rubric mặc định
curl -X POST http://localhost:3000/grade -d '{ "fileId": "abc123" }'

# Xuất kết quả
curl -X POST http://localhost:3000/export/excel -d '{ "resultIds": ["abc123"], "includeDetails": true }'
```

---

