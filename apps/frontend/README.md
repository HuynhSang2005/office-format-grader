# Office Format Grader - Frontend

## Hướng dẫn cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 18
- Bun >= 1.0

### Cài đặt dependencies
```bash
bun install
```

### Chạy ứng dụng ở chế độ phát triển
```bash
bun run dev
```

### Build ứng dụng cho production
```bash
bun run build
```

### Kiểm tra lint
```bash
bun run lint
```

### Kiểm tra type
```bash
bun run type-check
```

### Chạy test
```bash
bun run test
```

### Định dạng code
```bash
bun run format
```

## Cấu trúc thư mục
```
src/
├── config/              # Cấu hình ứng dụng
├── routes/              # Routing (TanStack Router)
├── components/          # Components theo tính năng
├── hooks/               # Custom hooks
├── lib/                 # Thư viện và utilities
├── schemas/             # Zod schemas
├── stores/              # Zustand stores
├── types/               # TypeScript types
├── utils/               # Utility functions
├── styles/              # Styles và theme
└── tests/               # Test files
```

## Biến môi trường
- `VITE_API_URL`: URL của backend API
- `VITE_APP_NAME`: Tên ứng dụng
- `VITE_DEBUG`: Chế độ debug

## Công nghệ sử dụng
- React 18
- Vite
- TypeScript
- TanStack Router & Query
- Mantine UI
- Zod
- Zustand
- Jotai
- Axios
- React Hook Form