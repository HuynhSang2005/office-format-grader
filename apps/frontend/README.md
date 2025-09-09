<p align="center">
  <img src="https://bun.sh/logo.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://vitejs.dev/logo.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://tanstack.com/images/logos/logo-color-100.png" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/TanStack/query/main/media/emblem-light.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/colinhacks/zod/master/logo.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://mantine.dev/favicon.svg" height="70" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://github.com/user-attachments/assets/35943980-4a94-4f31-a5ef-041aaecf279c" height="90" /> 
</p>

<h1 align="center">
  Office Format Grader — Frontend (Vite + React + TS)
</h1>

<p align="center"><strong>Frontend gọn nhẹ - nhanh - hiệu năng tốt để upload, chấm điểm theo rubric, dashboard quản lý, xem lịch sử và export Excel</strong></p>

---

## 🔎 Tổng quan

- SPA viết bằng **Vite + React + TypeScript**.
- UI với **Mantine**. State cục bộ bằng **Zustand**. Dữ liệu server với **TanStack Query**.
- Routing dùng **TanStack Router** (code-splitting qua `*.lazy.tsx`).
- Validate dữ liệu bằng **Zod**. Form bằng **react-hook-form**.
- Giao tiếp API qua **axios/ky wrapper**. Export Excel bằng **exceljs**. Biểu đồ bằng **Recharts/Tremor**.

---

## 📦 Tech stack

<div align="center">

| Nhóm | Công nghệ |
|---|---|
| Build/runtime | Bun, Vite |
| UI | React 18, Mantine UI |
| Router | TanStack Router |
| Data fetching | TanStack Query |
| Form/Validation | react-hook-form, Zod |
| State client | Zustand, Jotai (một số tiện ích) |
| Charts | Recharts, @tremor/react |
| Export | exceljs |
| HTTP | axios (lib `api-client.ts`) |
| Test | Vitest, Testing Library |
| Lint/Format | Biome, ESLint (opt-in), Lefthook pre-commit |

</div>

> Scripts, deps và cấu trúc xác nhận từ `package.json`, `src/`, `lefthook.yml`.

---

## ⚙️ Cài đặt

```bash
# Yêu cầu: Bun >= 1.2 và  Node >= 22.0
bun install
````

Tạo file `.env` (tham khảo `.env.example`):

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Office Format Grader
VITE_DEBUG=false
```

> Các key đúng như file mẫu trong repo.&#x20;

---

## ▶️ Chạy và build

```bash
# Dev
bun run dev

# Build production
bun run build

# Preview build
bun run preview
```

Chất lượng mã:

```bash
bun run lint         # Biome lint
bun run type-check   # tsc --noEmit
bun run test         # Vitest
bun run format       # Biome format --write
```

> Các script này có sẵn trong `package.json`.&#x20;

---

## 🗂️ Cấu trúc thư mục

```text
src/
├─ routes/                # Route tree (TanStack Router) + code-splitting *.lazy.tsx
│  ├─ _auth/              # Các trang sau đăng nhập: dashboard, grade, upload, history, ...
│  └─ login.lazy.tsx      # Trang đăng nhập
├─ components/            # UI theo domain: criteria, grade, layout, file, ...
├─ hooks/                 # TanStack Query hooks + hooks nghiệp vụ (upload, grade, export...)
├─ lib/                   # api-client, query-client, query-sync, zod-resolver
├─ schemas/               # Zod schemas (auth, upload, grade, criteria, dashboard, ...)
├─ stores/                # Zustand stores (auth, user, ui, rubric)
├─ styles/                # Mantine theme, CSS entry
└─ types/, utils/         # Kiểu dữ liệu và helpers
```

> Danh mục và file tương ứng lấy từ cây thư mục repo.&#x20;

---

## 🔐 Auth và cấu hình API

* FE đọc `VITE_API_URL` để gọi backend qua `src/lib/api-client.ts`.
* Trạng thái đăng nhập lưu ở **Zustand** (`src/stores/auth.store.ts`, `user.store.ts`).
* Router nhóm các route cần login trong `_auth` layout.
* Query Client khởi tạo tại `src/lib/query-client.ts`. App entry ở `src/main.tsx` và `src/App.tsx`.&#x20;

---

## 🧭 Routing chính

Các tuyến quan trọng (đã code-split):

* `/login` — Đăng nhập.
* `/_auth/dashboard` — Tổng quan thống kê.
* `/_auth/upload` và `/_auth/upload/batch` — Upload đơn/hàng loạt.
* `/_auth/grade` và `/_auth/grade/:resultId` — Chấm điểm và xem kết quả.
* `/_auth/history` — Lịch sử chấm.
* `/_auth/export` — Export Excel.
* `/_auth/criteria/...` — Quản lý rubric: create/edit/preview/validate/list.
* `/_auth/profile`, `/_auth/settings`, `/_auth/ungraded`, `/_auth/rubric/builder`.&#x20;

---

## 🔌 Data fetching & cache

* Mọi tương tác server dùng **TanStack Query** với key rõ ràng.
* Ví dụ: `useDashboardStats`, `useGradeResult`, `use-upload`, `use-ungraded-files`, `use-export-excel`, `use-criteria`, …
* Các schema Zod bảo vệ lớp biên khi parse response.&#x20;

---

## 🧩 Form & Validation

* Tổ hợp **react-hook-form** + **Zod** (`src/lib/zod-resolver.ts`) cho form builder, rubric form, upload, …
* Các test mô tả ràng buộc: độ dài tên tiêu chí, số lượng levels, max points, level codes unique, … trong `components/criteria/__tests__`.&#x20;

---

## 📈 Dashboard & Charts

* Dùng **Recharts** và **@tremor/react** để render phân phối điểm, top results, tần suất theo ngày.
* Hook `useDashboardStats` nhận filter như `gradedDays`, `uploadDays`, `page`, `limit`, … để query.&#x20;

---

## 🧪 Kiểm thử

* **Vitest** + **@testing-library/react** cho component và hooks.
* Test sẵn cho criteria form, custom rubric manager, layout, upload, grade, export, v.v.
* Setup nằm tại `src/tests/` và `vitest.config.ts`.&#x20;

Chạy toàn bộ:

```bash
bun run test
```

---

## 🧰 Dev tips

* Bật **lefthook** để pre-commit `lint`, `type-check`, `test`.&#x20;
* Tùy biến theme tại `src/styles/theme.ts`.
* Đồng bộ cache Query ↔ Router tại `src/lib/query-sync.ts`.&#x20;

---

## 🚀 Triển khai

* Build ra `dist/` bằng `bun run build`.
* Dùng bất kỳ static host nào hỗ trợ SPA (Nginx, Vercel, Netlify).
* Đặt `VITE_API_URL` trỏ về backend production có CORS hợp lệ.

---
