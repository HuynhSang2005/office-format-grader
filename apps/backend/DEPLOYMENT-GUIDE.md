# Hướng dẫn triển khai Office Format Grader (Backend)

Hướng dẫn này sẽ giúp bạn triển khai backend của Office Format Grader lên server production.

## 1. Yêu cầu hệ thống

- **Runtime**: Bun.js (>= 1.0.0)
- **Database**: SQLite (development) hoặc PostgreSQL (production)
- **Node.js**: >= 18 (cho Prisma)

## 2. Chuẩn bị môi trường

### 2.1. Cài đặt Bun.js

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2.2. Clone mã nguồn

```bash
git clone <your-repo-url>
cd office-vibe-code
```

## 3. Cấu hình

### 3.1. Tạo file môi trường

Sao chép file môi trường mẫu:

```bash
cp .env.production .env
```

Chỉnh sửa các giá trị trong file `.env`:

```env
# ==============================================================================
# PRODUCTION ENVIRONMENT
# ==============================================================================

# Database - Dùng SQLite cho development, PostgreSQL cho production
DATABASE_URL="file:./prod.db"
# Với PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# JWT Configuration - Thay đổi thành secret key an toàn
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
JWT_ALGORITHM="HS256"

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
ALLOWED_ORIGINS="https://your-frontend-domain.com,https://www.your-frontend-domain.com"

# File Upload Limits
MAX_FILE_SIZE=52428800  # 50MB in bytes
MAX_FILES_PER_BATCH=60

# Cleanup Configuration
CLEANUP_INTERVAL=3600000  # 1 hour in milliseconds
CLEANUP_OLDER_THAN_HOURS=3
METADATA_RETENTION_DAYS=14
METADATA_CLEANUP_SCHEDULE="0 2 * * *"  # 2AM daily

# Debug mode - Nên đặt là false trong production
DEBUG=false
```

## 4. Cài đặt dependencies và build

```bash
# Cài đặt dependencies
bun install

# Generate Prisma client
bunx prisma generate

# Chạy migration database (cho production)
bunx prisma migrate deploy

# Build project
bun run build
```

## 5. Khởi động server

```bash
# Khởi động server production
bun run start
```

Server sẽ chạy trên cổng được cấu hình trong file `.env` (mặc định là 3000).

## 6. Kiểm tra server

```bash
curl -X GET http://localhost:3000/health
```

Phản hồi thành công:
```json
{
  "status": "OK",
  "timestamp": "2025-04-05T10:00:00.000Z"
}
```

## 7. Cấu hình reverse proxy (nếu cần)

### 7.1. Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.2. Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

## 8. Scripts hữu ích

- `bun run dev` - Chạy server development với hot reload
- `bun run build` - Build project cho production
- `bun run start` - Khởi động server production
- `bunx prisma migrate dev` - Chạy migration trong development
- `bunx prisma migrate deploy` - Chạy migration trong production
- `bunx prisma studio` - Mở Prisma Studio để quản lý database
- `bun run cleanup:temp` - Dọn dẹp file tạm
- `bun run cleanup:metadata` - Dọn dẹp metadata cũ

## 9. Cấu hình HTTPS (khuyến nghị)

Để sử dụng HTTP/2, bạn cần cấu hình HTTPS. Cập nhật file `src/index.ts`:

```typescript
import { serve } from 'bun';


const server = serve({
  fetch: app.fetch,
  port: APP_CONFIG.DEFAULT_PORT,
  // Thêm cấu hình TLS để dùng HTTPS
  tls: {
    key: Bun.file('path/to/private-key.pem'),
    cert: Bun.file('path/to/certificate.pem'),
  },
});
```

## 10. Kiểm tra API endpoints

Các endpoints chính:

- `POST /auth/register` - Đăng ký người dùng mới
- `POST /auth/login` - Đăng nhập
- `POST /upload/files` - Upload file
- `POST /grade/hard` - Chấm điểm
- `GET /dashboard` - Dashboard thống kê
- `GET /criteria` - Danh sách tiêu chí chấm điểm

Tất cả endpoints đều trả về JSON, sẵn sàng cho tích hợp với frontend.