# Cập Nhật Thông Tin Hồ Sơ Và Ảnh Đại Diện

**Ngày cập nhật:** 17/08/2026  
**Dự án:** ChatRealTime  
**Phạm vi:** Client React, Server Spring Boot, MySQL, WebSocket và Cloudinary

## 1. Mục tiêu

Hoàn thiện chức năng quản lý hồ sơ cho hai tài khoản trong hệ thống chat 1–1. Mỗi người có thể tự cập nhật tên hiển thị và ảnh đại diện của mình. Thay đổi được lưu vào cơ sở dữ liệu và đồng bộ ngay sang cửa sổ chat của người còn lại mà không cần tải lại trang.

Tên đăng nhập không được phép thay đổi vì đây là định danh dùng cho quá trình đăng nhập, JWT và xác định người gửi tin nhắn.

## 2. Chức năng cập nhật thông tin

### 2.1. Giao diện

- Người dùng nhấn biểu tượng camera cạnh avatar ở cuối thanh bên để mở cửa sổ **Hồ sơ cá nhân**.
- Cửa sổ hiển thị:
  - Tên đăng nhập ở chế độ chỉ đọc.
  - Tên hiển thị có thể chỉnh sửa.
  - Ảnh đại diện hiện tại và chức năng chọn ảnh mới.
- Nút **Lưu thông tin** chỉ được bật khi tên hiển thị đã thay đổi và dữ liệu hợp lệ.
- Có trạng thái đang cập nhật và thông báo thành công hoặc thất bại bằng toast.
- Có thể đóng cửa sổ bằng nút đóng, nhấn ra ngoài hoặc phím `Escape` khi không có thao tác tải dữ liệu đang chạy.

### 2.2. Quy tắc kiểm tra tên hiển thị

Tên hiển thị được kiểm tra ở cả Client và Server:

- Không được để trống.
- Có độ dài từ 2 đến 100 ký tự sau khi chuẩn hóa.
- Phải chứa ít nhất một chữ cái.
- Hỗ trợ chữ cái và dấu tiếng Việt.
- Chỉ cho phép chữ cái, khoảng trắng, dấu chấm, dấu nháy và dấu gạch nối.
- Khoảng trắng liên tiếp được rút gọn thành một khoảng trắng.
- Khoảng trắng ở đầu và cuối tên được loại bỏ trước khi lưu.

Ví dụ:

```text
"  Nguyễn   Văn   An  " → "Nguyễn Văn An"
```

### 2.3. API cập nhật thông tin

```http
PUT /api/v1/users/me
Authorization: Bearer <access_token>
Content-Type: application/json
```

Nội dung yêu cầu:

```json
{
  "fullName": "Nguyễn Văn An"
}
```

Server không nhận `userId` hoặc `username` từ Client. Tài khoản cần cập nhật luôn được xác định từ JWT nhằm ngăn người dùng sửa thông tin của tài khoản khác.

Phản hồi thành công trả về thông tin tài khoản mới nhất gồm:

```json
{
  "id": "user123",
  "username": "user123",
  "fullName": "Nguyễn Văn An",
  "avatarUrl": "https://res.cloudinary.com/...",
  "online": true
}
```

## 3. Chức năng cập nhật ảnh đại diện

### 3.1. Giao diện chọn ảnh

- Người dùng nhấn vào avatar hoặc biểu tượng camera trong cửa sổ hồ sơ.
- Ảnh được xem trước bằng URL tạm trên trình duyệt trước khi tải lên Server.
- Tên tệp đã chọn được hiển thị bên dưới ảnh xem trước.
- Nút **Lưu ảnh** chỉ được bật khi đã chọn một tệp hợp lệ.
- URL xem trước được giải phóng khi đổi ảnh hoặc đóng cửa sổ để tránh rò rỉ bộ nhớ trình duyệt.

### 3.2. Quy tắc kiểm tra ảnh

Ảnh được kiểm tra ở cả Client và Server:

- Chỉ chấp nhận PNG, JPG hoặc JPEG.
- Dung lượng tối đa 5 MB.
- Kích thước tối đa 4096 × 4096 pixel.
- Server kiểm tra MIME, phần mở rộng và nội dung ảnh thật bằng `ImageIO`.
- Không chỉ dựa vào tên tệp do Client gửi lên.

### 3.3. API cập nhật ảnh

```http
POST /api/v1/users/me/avatar
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Biểu mẫu gửi lên gồm trường:

```text
file=<tệp ảnh>
```

Server lấy ID người dùng từ JWT, tải ảnh lên Cloudinary, lưu URL mới vào trường `avatarUrl` của tài khoản và trả về hồ sơ đã cập nhật.

Ảnh được lưu trên Cloudinary theo cấu trúc:

```text
chat-realtime/avatars/{userId}
```

Ảnh mới được phép ghi đè ảnh cũ và yêu cầu Cloudinary làm mới bộ nhớ đệm. Việc dùng ID tài khoản làm tên công khai giúp tránh tạo nhiều ảnh rác cho cùng một người dùng.

## 4. Cấu hình Cloudinary

Thêm ba biến sau vào `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Có thể sao chép các giá trị Cloudinary đang sử dụng trong `Holiday/server/.env`. Không đưa tệp `.env` hoặc khóa bí mật lên Git.

Tệp mẫu cấu hình:

```text
server/.env.example
```

Server tự đọc `server/.env` thông qua cấu hình:

```yaml
spring:
  config:
    import: optional:file:.env[.properties]
```

Giới hạn multipart trên Server:

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 6MB
```

## 5. Đồng bộ thời gian thực

Sau khi tên hoặc ảnh đại diện được cập nhật, Server phát sự kiện WebSocket:

```text
/topic/profile-updates
```

Dữ liệu sự kiện:

```json
{
  "userId": "user123",
  "fullName": "Nguyễn Văn An",
  "avatarUrl": "https://res.cloudinary.com/..."
}
```

Client nhận sự kiện và cập nhật đồng thời:

- Hồ sơ của tài khoản đang đăng nhập.
- Avatar và tên trong thanh tài khoản.
- Danh sách cuộc trò chuyện.
- Tiêu đề cuộc trò chuyện.
- Avatar cạnh các bong bóng tin nhắn.
- Thông tin người còn lại ở cửa sổ trình duyệt thứ hai.

Không cần tải lại trang sau khi cập nhật.

## 6. Lưu dữ liệu và avatar mặc định

`DatabaseSeeder` chỉ gán ảnh SVG mặc định khi tài khoản chưa có `avatarUrl`. Ảnh người dùng đã tải lên Cloudinary không bị ghi đè khi Server khởi động lại.

Hai ảnh mặc định vẫn được giữ tại:

```text
client/public/avatars/user123.svg
client/public/avatars/atmin123.svg
```

## 7. Kiến trúc triển khai

### Client

```text
client/src/features/profile/
├── components/
│   └── ProfileModal.tsx
├── hooks/
│   ├── useAvatarUpload.ts
│   └── useProfileInfoUpdate.ts
├── services/
│   └── profileService.ts
└── index.ts
```

- `ProfileModal.tsx`: hiển thị và nhận thao tác người dùng.
- `useAvatarUpload.ts`: kiểm tra và điều phối quá trình tải ảnh.
- `useProfileInfoUpdate.ts`: chuẩn hóa, kiểm tra và cập nhật tên hiển thị.
- `profileService.ts`: thực hiện các yêu cầu HTTP tới Server.
- `useAuthStore.ts`: cập nhật hồ sơ của tài khoản hiện tại.
- `useChatStore.ts`: cập nhật tên và avatar trong danh sách người tham gia.
- `useChatWebSocket.ts`: nhận sự kiện cập nhật hồ sơ theo thời gian thực.

### Server

```text
server/src/main/java/atmin/modules/
├── media/
│   ├── config/
│   │   ├── CloudinaryConfig.java
│   │   └── CloudinaryProperties.java
│   └── service/
│       ├── MediaUploadService.java
│       └── CloudinaryMediaUploadService.java
└── user/
    ├── controller/
    │   └── UserProfileController.java
    ├── dto/
    │   ├── UpdateProfileRequest.java
    │   ├── UserProfileResponse.java
    │   └── ProfileUpdatedEventResponse.java
    └── service/
        ├── UserProfileService.java
        └── UserProfileServiceImpl.java
```

Module User chỉ làm việc với hợp đồng `MediaUploadService`, không phụ thuộc trực tiếp vào chi tiết tải ảnh của Cloudinary. Có thể thay Cloudinary bằng dịch vụ lưu trữ khác mà không cần sửa nghiệp vụ hồ sơ.

## 8. Bảo mật

- Cả hai API đều yêu cầu access token hợp lệ.
- ID tài khoản được lấy từ thông tin xác thực của Server.
- Không cho phép Client chỉ định tài khoản cần cập nhật.
- Tên đăng nhập không được cập nhật qua API hồ sơ.
- Khóa Cloudinary chỉ tồn tại ở Server.
- Client không được tiếp cận `CLOUDINARY_API_SECRET`.
- Server kiểm tra lại toàn bộ tên và tệp ảnh dù Client đã kiểm tra trước đó.

## 9. Kết quả kiểm tra

- Client vượt kiểm tra `oxlint` mà không có cảnh báo.
- TypeScript biên dịch thành công.
- Vite tạo bản dựng production thành công.
- Server biên dịch Java thành công và không còn cảnh báo unchecked.
- Toàn bộ bộ kiểm thử Gradle hoàn tất với trạng thái `BUILD SUCCESSFUL`.
- `UserProfileServiceImplTest` xác nhận:
  - Tên có khoảng trắng thừa được chuẩn hóa chính xác.
  - Sự kiện WebSocket chứa tên và avatar mới được phát đi.
  - Tên quá ngắn sau khi chuẩn hóa bị từ chối.

## 10. Cách sử dụng

1. Cấu hình ba biến Cloudinary trong `server/.env`.
2. Khởi động lại Server và Client.
3. Đăng nhập bằng một trong hai tài khoản.
4. Nhấn biểu tượng camera cạnh avatar ở cuối thanh bên.
5. Sửa tên hiển thị và nhấn **Lưu thông tin**.
6. Chọn ảnh mới và nhấn **Lưu ảnh** nếu muốn thay avatar.
7. Mở tài khoản còn lại trong trình duyệt khác hoặc cửa sổ ẩn danh để kiểm tra đồng bộ thời gian thực.

## 11. Khuyến nghị

Phương án tốt nhất cho dự án hiện tại là tiếp tục lưu ảnh trên Cloudinary, giữ username bất biến và chỉ cho phép sửa tên hiển thị. Cách này bảo đảm luồng đăng nhập ổn định, tránh sai lệch ID người gửi và cho phép avatar hoạt động nhất quán khi triển khai trên nhiều thiết bị.
