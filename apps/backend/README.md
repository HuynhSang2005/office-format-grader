# Office Format Grader Code - Hệ thống chấm điểm tài liệu Office

Hệ thống chấm điểm tự động cho file PowerPoint (.pptx) và Word (.docx) sử dụng Bun + Hono + TypeScript + Prisma.

## 🚀 Công nghệ sử dụng

- **Runtime**: Bun
- **Framework**: Hono  
- **Database**: Prisma ORM + SQLite (dev)
- **Language**: TypeScript
- **Authentication**: JWT

## 📁 Cấu trúc thư mục

```
/src
├── app.ts                     # Cấu hình chính ứng dụng Hono
├── index.ts                   # Entry point
├── /prisma
│   └── schema.prisma         # Database schema
├── /core
│   └── logger.ts             # Logger với thông báo tiếng Việt
├── /config
│   ├── constants.ts          # Các hằng số hệ thống
│   └── /presets
│       ├── defaultRubric.pptx.json   # Rubric mặc định cho PPTX
│       └── defaultRubric.docx.json   # Rubric mặc định cho DOCX
├── /services
│   ├── archive.service.ts    # Dịch vụ giải nén file Office (ZIP và RAR)
│   ├── excel.service.ts      # Dịch vụ xuất kết quả ra Excel
│   └── ...                   # Các services khác
├── /types
│   ├── archive.types.ts      # Types cho chức năng archive
│   ├── features-docx.ts      # Features cho DOCX
│   ├── features-pptx.ts      # Features cho PPTX
│   └── index.ts              # Export tất cả types
├── /schemas
│   ├── archive.schema.ts     # Zod schemas cho archive
│   ├── rubric.schema.ts      # Schemas cho rubric
│   └── index.ts              # Export tất cả schemas
```

## 🛠️ Cài đặt và chạy

### Yêu cầu hệ thống
- Bun >= 1.0.0
- Node.js >= 18 (để chạy Prisma)

### Các bước cài đặt

1. **Clone và cài đặt dependencies**:
```bash
bun install
```

2. **Cấu hình môi trường**:
```bash
cp .env.example .env
# Chỉnh sửa file .env theo nhu cầu
```

3. **Khởi tạo database**:
```bash
bunx prisma migrate dev
```

4. **Chạy server development**:
```bash
bun run dev
```

Server sẽ chạy tại: http://localhost:3000

## 🧪 Kiểm tra hoạt động

### Health Check
```bash
curl -X GET http://localhost:3000/health
```

### API endpoints cơ bản
- `GET /` - Thông tin API
- `GET /health` - Kiểm tra trạng thái server
- `POST /export` - Xuất kết quả chấm điểm ra file Excel (yêu cầu xác thực)

## 📊 Database Models

### User
- `id`: String (Primary Key)
- `email`: String (Unique)
- `password`: String

### GradeResult  
- `id`: String (Primary Key)
- `userId`: String (Foreign Key)
- `filename`: String
- `fileType`: String ("PPTX" hoặc "DOCX")
- `totalPoints`: Float
- `byCriteria`: String (JSON)
- `gradedAt`: DateTime

## 📁 Quản lý file

Hệ thống chỉ sử dụng thư mục `temp` để lưu trữ file tạm thời trong quá trình xử lý:
- File được upload sẽ được lưu vào thư mục `temp`
- Sau khi xử lý và chấm điểm xong, file sẽ được tự động xóa
- Không còn sử dụng thư mục `uploads` vì file không cần lưu trữ vĩnh viễn
- Hệ thống tự động dọn dẹp file tạm sau 3 giờ (thay vì 24 giờ như trước)

## 🚀 Batch Grading

Hệ thống hỗ trợ chấm điểm hàng loạt file cùng lúc:
- Xử lý đồng thời nhiều file (configurable concurrency)
- Xử lý lỗi từng file riêng biệt
- Trả về kết quả chi tiết cho từng file
- Tự động dọn dẹp tài nguyên sau khi xử lý

## 📤 Xuất file Excel

Hệ thống hỗ trợ xuất kết quả chấm điểm ra file Excel:
- Xuất kết quả của một hoặc nhiều file
- Bao gồm chi tiết điểm theo từng tiêu chí
- API endpoint: `POST /export` (yêu cầu xác thực)
- Định dạng file đầu ra: `.xlsx`

## 🔧 Scripts có sẵn

```bash
bun run dev          # Chạy development server
bun run build        # Build production
bun run start        # Chạy production server
bun run db:migrate   # Chạy database migrations
bun run db:generate  # Generate Prisma client
bun run db:studio    # Mở Prisma Studio
bun test             # Chạy tests
bun manual-cleanup.ts # Chạy dọn dẹp thủ công
```

## 📋 Tính năng chính (sẽ được triển khai)

- ✅ Cấu trúc dự án cơ bản
- ✅ Chức năng giải nén file Office (PPTX/DOCX)
- ✅ Upload và xử lý file PPTX/DOCX  
- ✅ Hệ thống chấm điểm theo rubric
- ⏳ Authentication với JWT
- ✅ Xuất kết quả ra Excel
- ✅ API endpoints đầy đủ

## 🔐 Bảo mật

- JWT với HttpOnly cookies
- Validation đầu vào với Zod
- Rate limiting (sẽ triển khai)
- File type và size validation

## 📝 Ghi chú

- Logger hệ thống sử dụng tiếng Việt để dễ đọc
- Hỗ trợ path aliases (@core/*, @services/*, v.v.)
- Database mặc định là SQLite, có thể chuyển sang PostgreSQL
- Rubric có thể tùy chỉnh qua file JSON

## 📞 Hỗ trợ

Nếu gặp vấn đề khi cài đặt hoặc sử dụng, vui lòng tạo issue trong repository.
