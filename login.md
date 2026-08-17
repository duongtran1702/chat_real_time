# ChatRealTime — Tài liệu đăng nhập

## Mục tiêu

Đăng nhập sử dụng JWT không phiên (stateless) để React client và Spring Boot server hoạt động tách rời nhưng vẫn giữ phiên đăng nhập an toàn sau khi tải lại trang.

## Thành phần xác thực

| Thành phần | Nơi lưu | Mục đích |
| --- | --- | --- |
| Access token | Zustand, chỉ trong RAM | Gắn vào header của API và STOMP WebSocket. |
| Refresh token | Cookie `HttpOnly`, `SameSite=Lax` | Tạo access token mới mà JavaScript không thể đọc token này. |
| User hiện tại | `localStorage` | Chỉ phục vụ hiển thị tạm thời; không phải bằng chứng xác thực. |

## File và thư viện liên quan

| Tầng | File | Thư viện/công cụ |
| --- | --- | --- |
| Client | `features/auth/components/Login.tsx` | React form, `react-hot-toast`. |
| Client | `features/auth/components/AuthInit.tsx` | React `useEffect`, silent refresh. |
| Client | `features/auth/store/useAuthStore.ts` | Zustand. |
| Client | `infra/api.ts` | Axios interceptor và request queue. |
| Server | `modules/user/controller/AuthController.java` | Spring Web MVC, cookie HTTP. |
| Server | `modules/user/service/AuthService.java` | BCrypt và truy vấn JPA. |
| Server | `core/security/jwt/*` | JJWT, Spring Security filter. |
| Server | `core/security/SecurityConfig.java` | Spring Security stateless filter chain. |

Khi code lại, phải giữ nguyên contract JSON của login/refresh và gửi `withCredentials: true` trong Axios; nếu không refresh token cookie sẽ không được gửi từ client.

## API

### Đăng nhập

`POST /api/v1/auth/login`

```json
{
  "username": "user123",
  "password": "12345678"
}
```

Khi thành công, server:

- trả access token và thông tin người dùng trong JSON;
- gắn refresh token vào cookie `HttpOnly`;
- không trả mật khẩu hoặc refresh token vào JSON.

### Làm mới phiên ngầm

`POST /api/v1/auth/refresh`

Client gọi endpoint này lúc khởi động. Trình duyệt tự gửi cookie refresh token; nếu hợp lệ, server trả access token mới.

Axios cũng xếp hàng các request bị lỗi 401: chỉ một request refresh được chạy, sau đó các request còn lại chạy lại với token mới.

### Đăng xuất

`POST /api/v1/auth/logout`

Server xóa refresh cookie, client xóa access token trong RAM và thông tin hiển thị cục bộ.

## Luồng hoạt động

1. `AuthInit` chạy khi React khởi động.
2. Nếu chưa có access token, `AuthInit` gọi `/auth/refresh`.
3. Khi người dùng đăng nhập, `useAuthStore` lưu access token trong RAM và thông tin người dùng để hiển thị.
4. Axios tự gắn `Authorization: Bearer {accessToken}` vào REST request.
5. Khi WebSocket kết nối, client gửi access token trong STOMP CONNECT header.
6. Khi logout hoặc refresh thất bại, UI quay về màn hình đăng nhập.

## Tài khoản mẫu phát triển

`DatabaseSeeder` tạo các tài khoản sau nếu chưa có trong database:

| Username | Password |
| --- | --- |
| `user123` | `12345678` |
| `atmin123` | `atmin123` |

Chỉ dùng chúng ở môi trường phát triển. Không sử dụng mật khẩu mẫu hoặc `secure=false` cookie cho môi trường production.

## Lưu ý triển khai production

- Bật `Secure=true` cho refresh cookie khi dùng HTTPS.
- Đặt `JWT_SECRET_KEY` mạnh và riêng theo môi trường.
- Dùng HTTPS, origin cụ thể và thời hạn access token ngắn.
- Thêm giới hạn thử đăng nhập để giảm nguy cơ dò mật khẩu.
