# Cấu hình địa chỉ Local và Production

**Ngày cập nhật:** 17/08/2026

## 1. Địa chỉ đang sử dụng

| Thành phần     | Chạy local                                               | Chạy production                     |
| ---------------- | --------------------------------------------------------- | ------------------------------------ |
| Giao diện       | `http://localhost:5173` hoặc `http://localhost:5174` | `https://chat.atmin.io.vn`         |
| REST API         | `http://localhost:8080/api/v1`                          | `https://chat.atmin.io.vn/api/v1`  |
| WebSocket/SockJS | `http://localhost:8080/ws-chat`                         | `https://chat.atmin.io.vn/ws-chat` |
| Cơ sở dữ liệu     | MySQL `localhost:3306/server_test_ai_db`              | PostgreSQL trên Supabase          |

## 2. Client tự chọn địa chỉ như thế nào?

File `client/src/infra/serverUrl.ts` là nguồn cấu hình duy nhất:

- Chạy `npm run dev`: Vite đặt `import.meta.env.DEV=true`, Client dùng `http://localhost:8080`.
- Chạy `npm run build`: Client tự dùng origin đang mở. Link Render gọi API Render; domain thật gọi API trên domain thật.
- Nếu cần ghi đè tạm thời, đặt biến `VITE_SERVER_ORIGIN`.

Không sửa trực tiếp `api.ts` hoặc `useChatWebSocket.ts`; cả hai đều đọc từ `serverUrl.ts`.

## 3. Server tự chọn cấu hình như thế nào?

Server có hai profile tách biệt:

- `application-local.yml`: MySQL localhost và CORS cho Vite 5173/5174.
- `application-cloud.yml`: PostgreSQL Supabase và CORS cho `https://chat.atmin.io.vn`.

Trên máy cá nhân, profile mặc định là `local`. Trên Render phải thêm:

```text
SPRING_PROFILES_ACTIVE=cloud
```

## 4. Biến môi trường bắt buộc trên Render

```text
SPRING_PROFILES_ACTIVE=cloud
DB_URL=jdbc:postgresql://<SUPABASE_POOLER_HOST>:5432/postgres?sslmode=require
DB_USERNAME=postgres.<PROJECT_REF>
DB_PASSWORD=<mật khẩu database Supabase>
JWT_SECRET_KEY=<chuỗi bí mật dài>
AI_KEY=<khóa Gemini>
CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
CLOUDINARY_API_KEY=<Cloudinary API key>
CLOUDINARY_API_SECRET=<Cloudinary API secret>
```

Lấy `SUPABASE_POOLER_HOST` và `DB_USERNAME` tại **Supabase > Connect > Session pooler**. Không dùng Direct connection và không mua IPv4 add-on. Render tự cấp biến `PORT`; Server đã đọc biến này và vẫn dùng cổng 8080 khi chạy local.

## 5. Cách quay lại chạy local

Không cần comment hoặc sửa domain. Chỉ cần:

1. Server dùng `SPRING_PROFILES_ACTIVE=local` (đây là giá trị mặc định).
2. Chạy Client bằng `npm run dev`.
3. Mở `http://localhost:5173` và `http://localhost:5174`.

## 6. Lưu ý bảo mật

- Không commit `server/.env`.
- Không đưa khóa JWT, Gemini, Cloudinary hoặc mật khẩu Supabase vào mã nguồn.
- File `.env.example` chỉ chứa tên biến và ví dụ, không chứa giá trị thật.

## 7. Các file đã chuẩn bị để Render tự build

- `Dockerfile`: build React, chép giao diện vào Spring Boot và tạo image Java 21 tối giản.
- `.dockerignore`: loại Holiday, khóa bí mật, thư viện và file build khỏi gói gửi lên Render.
- `/health`: địa chỉ kiểm tra Server đang hoạt động, đặt làm Render Health Check.
- Cookie refresh tự dùng `Secure=false` ở local và `Secure=true` trên domain HTTPS production.

Render chỉ cần kết nối repository GitHub ở thư mục gốc, chọn **Docker** và gói **Free**; không đặt Root Directory thành `client` hoặc `server`.

## 8. Kiến trúc miễn phí, đơn giản

- Render Free chạy chung React, Spring Boot và WebSocket trong một Docker container.
- Supabase Free cung cấp PostgreSQL qua Session pooler IPv4.
- Cloudinary Free giữ ảnh đại diện; Gemini Free phục vụ bot trong hạn mức miễn phí.
- Không cần Netlify, Redis hoặc database trả phí cho bản chat hai người.
- Render Free có thể ngủ khi không có truy cập; lần mở đầu tiên sau khi ngủ sẽ chậm hơn bình thường.
