# Cấu hình địa chỉ Local và Production

**Ngày cập nhật:** 17/08/2026

## 1. Địa chỉ đang sử dụng

| Thành phần | Chạy local | Chạy production |
|---|---|---|
| Giao diện | `http://localhost:5173` hoặc `http://localhost:5174` | `https://chat.atmin.io.vn` |
| REST API | `http://localhost:8080/api/v1` | `https://chat.atmin.io.vn/api/v1` |
| WebSocket/SockJS | `http://localhost:8080/ws-chat` | `https://chat.atmin.io.vn/ws-chat` |
| MySQL | `localhost:3306/server_test_ai_db` | MySQL nội bộ do Railway cung cấp |

## 2. Client tự chọn địa chỉ như thế nào?

File `client/src/infra/serverUrl.ts` là nguồn cấu hình duy nhất:

- Chạy `npm run dev`: Vite đặt `import.meta.env.DEV=true`, Client dùng `http://localhost:8080`.
- Chạy `npm run build`: Client dùng domain thật `https://chat.atmin.io.vn`.
- Nếu cần ghi đè tạm thời, đặt biến `VITE_SERVER_ORIGIN`.

Không sửa trực tiếp `api.ts` hoặc `useChatWebSocket.ts`; cả hai đều đọc từ `serverUrl.ts`.

## 3. Server tự chọn cấu hình như thế nào?

Server có hai profile tách biệt:

- `application-local.yml`: MySQL localhost và CORS cho Vite 5173/5174.
- `application-cloud.yml`: MySQL Railway và CORS cho `https://chat.atmin.io.vn`.

Trên máy cá nhân, profile mặc định là `local`. Trên Railway phải thêm:

```text
SPRING_PROFILES_ACTIVE=cloud
```

## 4. Biến môi trường bắt buộc trên Railway

```text
SPRING_PROFILES_ACTIVE=cloud
DB_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
JWT_SECRET_KEY=<chuỗi bí mật dài>
AI_KEY=<khóa Gemini>
CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
CLOUDINARY_API_KEY=<Cloudinary API key>
CLOUDINARY_API_SECRET=<Cloudinary API secret>
```

Railway tự cấp biến `PORT`; Server đã đọc biến này và vẫn dùng cổng 8080 khi chạy local.

## 5. Cách quay lại chạy local

Không cần comment hoặc sửa domain. Chỉ cần:

1. Server dùng `SPRING_PROFILES_ACTIVE=local` (đây là giá trị mặc định).
2. Chạy Client bằng `npm run dev`.
3. Mở `http://localhost:5173` và `http://localhost:5174`.

## 6. Lưu ý bảo mật

- Không commit `server/.env`.
- Không đưa khóa JWT, Gemini, Cloudinary hoặc mật khẩu MySQL vào mã nguồn.
- File `.env.example` chỉ chứa tên biến và ví dụ, không chứa giá trị thật.

## 7. Các file đã chuẩn bị để Railway tự build

- `Dockerfile`: build React, chép giao diện vào Spring Boot và tạo image Java 21 tối giản.
- `.dockerignore`: loại Holiday, khóa bí mật, thư viện và file build khỏi gói gửi lên Railway.
- `/health`: địa chỉ kiểm tra Server đang hoạt động, có thể đặt làm Railway Health Check.
- Cookie refresh tự dùng `Secure=false` ở local và `Secure=true` trên domain HTTPS production.

Railway chỉ cần kết nối repository GitHub ở thư mục gốc; không đặt Root Directory thành `client` hoặc `server`.
