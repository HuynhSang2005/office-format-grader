# 🧩 Office Format Analyzer – Pet Project

Office Format Analyzer là một dự án cá nhân với mục tiêu xây dựng một công cụ có khả năng **quét, phân tích và trích xuất nội dung cũng như định dạng** từ các file Microsoft Office như `.docx`, `.pptx`, `.xlsx`. Dự án được chia thành hai phần chính:

---

## 🛠️ Backend API (Hoàn thành)

Thư mục `BE/` chứa toàn bộ mã nguồn của API backend, được xây dựng bằng:

- **Runtime:** Bun.js
- **Framework:** Hono
- **Ngôn ngữ:** TypeScript

### Các chức năng chính:
- Trích xuất nội dung văn bản và bảng từ file Word, PowerPoint, Excel
- Phân tích định dạng sâu (`mode=full`) cho `.docx` và `.pptx`
- Trả về dữ liệu có cấu trúc dạng JSON
- Stateless và modular, dễ tích hợp về sau

➡️ Xem chi tiết tại [`BE/README.md`](./BE/README.md)

---

## 🎨 Frontend UI (Sắp triển khai)

Thư mục `FE/` hiện tại mới được khởi tạo. Trong tương lai, frontend sẽ được phát triển để:

- Tải lên và xem nội dung file trực tiếp trên giao diện web
- Hiển thị cấu trúc và định dạng theo dạng trực quan
- Tương tác với API hiện có từ backend

---

## 🚀 Mục Tiêu Tổng Quan

- 🔍 Phân tích file Office không cần cài đặt phần mềm Office
- 💡 Học và thực hành xử lý định dạng văn bản, parsing XML
- 🧱 Thực hành thiết kế hệ thống chia tách rõ ràng giữa BE và FE
- 📦 Có thể phát triển thành công cụ nội bộ hoặc open-source demo

---

## 📌 Ghi chú

Dự án đang được phát triển với tinh thần học hỏi và khám phá công nghệ mới. Mọi đóng góp hoặc phản hồi đều được chào đón!

> Nguyễn Huỳnh Sang – 2025
