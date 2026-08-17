# ChatRealTime — Tài liệu chức năng chat

## Mục tiêu

Đây là web chat riêng gồm hai chức năng lõi: đăng nhập và trò chuyện thời gian thực. Mỗi người dùng chỉ xem, đăng ký nhận tin và gửi tin trong những phòng chat mà mình là thành viên.

AI `@CloseFriend` là một thành viên hỗ trợ trong phòng chat. AI không thay thế người dùng, không tự gửi tin khi chưa được nhắc tên, và không có quyền truy cập trực tiếp vào cơ sở dữ liệu hay hệ thống bên ngoài.

## Kiến trúc

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Client | React, Vite, TypeScript, Zustand | Hiển thị giao diện, giữ access token trong bộ nhớ và kết nối STOMP. |
| API | Spring Boot | Đăng nhập, lịch sử chat, xác thực và kiểm tra quyền. |
| Real-time | SockJS + STOMP WebSocket | Phát tin nhắn mới và trạng thái đã đọc ngay lập tức. |
| Database | MySQL + JPA | Người dùng, phòng chat, thành viên và tin nhắn. |
| AI | Spring AI + Gemini OpenAI-compatible API | Phản hồi khi có `@CloseFriend`. |

## Bản đồ mã nguồn cần giữ

### Client

| File | Trách nhiệm |
| --- | --- |
| `client/src/App.tsx` | Lấy phòng chat, bố cục trang và logout. |
| `client/src/infra/api.ts` | Axios client, gắn access token, refresh queue khi gặp 401. |
| `client/src/features/chat/hooks/useChatWebSocket.ts` | Kết nối SockJS/STOMP, subscribe, optimistic update, tải lịch sử và read receipt. |
| `client/src/features/chat/components/ChatBox.tsx` | Gửi tin, hiển thị dòng chat hiện tại. Không dùng ID/token giả. |
| `client/src/features/chat/components/ConversationList.tsx` | Danh sách phòng và trạng thái presence. |
| `client/src/features/chat/components/MessageItem.tsx` | Hiển thị tin; `senderId === "bot_closefriend"` có giao diện AI riêng. |
| `client/src/features/auth/*` | Login, silent refresh và Zustand auth store. |

### Server

| File | Trách nhiệm |
| --- | --- |
| `core/security/SecurityConfig.java` | Quy tắc REST security và JWT filter. |
| `core/security/WebSocketConfig.java` | STOMP endpoint `/ws-chat`, xác thực CONNECT bằng JWT. |
| `core/security/ChatSubscriptionSecurityConfig.java` | Chặn subscribe vào conversation không thuộc người dùng. |
| `modules/chat/controller/ChatController.java` | REST lấy conversation và lịch sử. |
| `modules/chat/controller/WebSocketChatController.java` | Nhận `/app/chat.sendMessage` và `/app/chat.markAsRead`. |
| `modules/chat/service/impl/ChatServiceImpl.java` | Kiểm tra thành viên, lưu/broadcast tin và phát sự kiện AI sau commit. |
| `modules/chat/ai/CloseFriendAiService.java` | Prompt, ngữ cảnh hội thoại, gọi Gemini, lưu/broadcast tin bot. |
| `modules/chat/ai/CloseFriendTools.java` | Các tool AI được phép gọi. |
| `modules/chat/presence/*` | Online/offline, có độ trễ để tránh nhấp nháy khi reload. |

## Thư viện chính

| Khu vực | Thư viện |
| --- | --- |
| Client | `react`, `zustand`, `axios`, `@stomp/stompjs`, `sockjs-client`, `react-hot-toast`, `lucide-react`, `tailwindcss`, `vite`. |
| Server | Spring Boot Web MVC, Spring Data JPA, Spring Security, Spring WebSocket, Spring Validation, JJWT, MySQL Connector/J, Lombok. |
| AI | `spring-ai-starter-model-openai`, dùng Gemini qua OpenAI-compatible endpoint. |

Phiên bản chính xác được khóa trong `client/package.json`, `client/package-lock.json` và `server/build.gradle`. Khi dựng lại, ưu tiên dùng đúng các file này thay vì tự nâng phiên bản.

## Luồng chat

1. Client đăng nhập và nhận access token.
2. Client gọi `GET /api/v1/chat/conversations` để lấy các phòng của người dùng hiện tại.
3. Khi chọn phòng, client tải lịch sử và đăng ký hai kênh STOMP:
   - `/topic/conversation/{conversationId}`: tin nhắn mới.
   - `/topic/conversation/{conversationId}/read`: trạng thái đã đọc.
4. Client gửi tin vào `/app/chat.sendMessage`.
5. Server xác thực token, kiểm tra người gửi là thành viên phòng, lưu tin vào database và broadcast tin nhắn.
6. Nếu có `@CloseFriend`, server kích hoạt AI sau khi transaction lưu tin nhắn đã commit.

## API REST

### Lấy phòng chat của tôi

`GET /api/v1/chat/conversations`

Yêu cầu header `Authorization: Bearer {accessToken}`.

### Lấy lịch sử tin nhắn

`GET /api/v1/chat/conversations/{conversationId}/messages?page=0&size=20`

Server chỉ trả dữ liệu khi người dùng là thành viên của phòng. `size` được giới hạn tối đa 100.

## STOMP WebSocket

Kết nối tới `http://localhost:8080/ws-chat` bằng SockJS với header khi CONNECT:

```json
{ "Authorization": "Bearer {accessToken}" }
```

Gửi tin:

```json
// destination: /app/chat.sendMessage
{
  "conversationId": "conv-demo",
  "content": "Chào mọi người"
}
```

Đánh dấu đã đọc:

```json
// destination: /app/chat.markAsRead
{ "conversationId": "conv-demo" }
```

## Quy tắc bảo mật

- Access token là JWT ngắn hạn; client chỉ giữ token trong bộ nhớ.
- Refresh token nằm trong cookie `HttpOnly`; JavaScript không đọc được cookie này.
- Server kiểm tra quyền ở cả REST, STOMP subscribe và lúc gửi/đọc tin.
- Mật khẩu không xuất hiện trong JSON trả về client.
- Không dùng ID hoặc token giả trong client.

## Kiểm thử thủ công

1. Chạy MySQL và cấu hình biến môi trường trong `server/.env`.
2. Chạy backend tại cổng 8080 và client tại cổng 5173.
3. Đăng nhập bằng hai tài khoản mẫu do `DatabaseSeeder` tạo.
4. Mở hai cửa sổ trình duyệt, đăng nhập hai tài khoản khác nhau và gửi tin trong `conv-demo`.
5. Kiểm tra tin xuất hiện ngay ở cả hai cửa sổ; một tài khoản không thể subscribe vào phòng không thuộc về mình.

Xem [ai.md](ai.md) để biết cách dùng và mở rộng `@CloseFriend`.

Xem [REBUILD_SPEC.md](REBUILD_SPEC.md) nếu cần giao cho một AI khác dựng lại dự án.
