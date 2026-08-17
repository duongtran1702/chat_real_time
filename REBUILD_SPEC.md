# ChatRealTime — Đặc tả tái tạo cho AI/coder khác

## Mục đích file này

Dùng file này làm prompt/nguồn yêu cầu khi cần một AI hoặc developer khác dựng lại dự án. Không suy đoán thêm tính năng ngoài các phần dưới đây.

## Phạm vi bắt buộc

- Web chat 1-1 realtime, có đăng nhập JWT.
- React/Vite client và Spring Boot/Java 21 server.
- MySQL lưu user, conversation, participant và message.
- SockJS + STOMP cho tin nhắn mới, read receipt và presence.
- AI `@CloseFriend` chỉ phản hồi khi bị nhắc tên.
- AI học phong cách **theo 20 tin nhắn gần nhất trong cùng conversation**, không có memory dài hạn mặc định.
- Một AI Agent tool an toàn: lấy giờ Việt Nam thực tế.

## Không được làm

- Không hardcode token, user ID, conversation ID hoặc API key vào client.
- Không lưu access token trong `localStorage`.
- Không trả password/refresh token trong JSON.
- Không cho client subscribe/send/read conversation nếu user không phải participant.
- Không gọi model AI bên trong database transaction.
- Không để model có tool xóa dữ liệu, gửi email, gọi thanh toán hoặc truy cập hệ thống tùy ý.

## Cấu trúc thư mục mong muốn

```text
ChatRealTime/
├── client/
│   └── src/
│       ├── infra/api.ts
│       └── features/{auth,chat}/
└── server/
    └── src/main/
        ├── java/atmin/{core,modules}/
        └── resources/{application.yml,application-cloud.yml}
```

## Dependencies phải có

### Client

`react`, `react-dom`, `typescript`, `vite`, `tailwindcss`, `zustand`, `axios`, `@stomp/stompjs`, `sockjs-client`, `react-hot-toast`, `lucide-react`.

### Server

Spring Boot Web MVC, Data JPA, Security, WebSocket, Validation, MySQL Connector/J, Lombok, JJWT, và `org.springframework.ai:spring-ai-starter-model-openai`.

## Contract xác thực

- `POST /api/v1/auth/login` nhận `{ username, password }`, trả access token/user và gắn refresh token vào cookie `HttpOnly`.
- `POST /api/v1/auth/refresh` đọc cookie và trả access token mới.
- `POST /api/v1/auth/logout` xóa refresh cookie.
- Axios dùng `withCredentials: true`, tự thêm bearer token và có queue refresh khi nhiều request cùng lỗi 401.
- WebSocket CONNECT truyền `Authorization: Bearer {accessToken}`.

## Contract chat

- REST: `GET /api/v1/chat/conversations` và `GET /api/v1/chat/conversations/{id}/messages`.
- STOMP inbound: `/app/chat.sendMessage`, `/app/chat.markAsRead`.
- STOMP outbound: `/topic/conversation/{id}`, `/topic/conversation/{id}/read`, `/topic/presence`.
- Tin nhắn có: `id`, `conversationId`, `senderId`, `content`, `status`, `type`, `createdAt`.
- Bot có `senderId = "bot_closefriend"`.

## Luồng AI bắt buộc

1. `ChatService` lưu tin nhắn người dùng trong transaction.
2. Nếu nội dung khớp `@CloseFriend` không phân biệt hoa/thường, phát `AiReplyRequestedEvent`.
3. `CloseFriendAiService` nhận event bằng `@TransactionalEventListener(AFTER_COMMIT)` và chạy `@Async("aiExecutor")`.
4. Lấy tối đa 20 tin gần nhất theo đúng conversation, đảo thành thứ tự thời gian tăng dần.
5. Prompt yêu cầu bot bắt chước giọng điệu từ ngữ cảnh, hỗ trợ phân tích vấn đề, nêu điều chưa chắc chắn và đề xuất bước tiếp theo.
6. Cấp tools bằng `.tools(closeFriendTools)`, hiện có `getVietnamCurrentTime`.
7. Khi model trả lời, mở transaction ngắn để lưu message bot, sau đó broadcast vào topic conversation.
8. Nếu thiếu `AI_KEY` hoặc model lỗi, ghi log; không làm lỗi tin nhắn gốc hay ngắt chat.

## Cấu hình môi trường

Tạo `server/.env` cục bộ, không commit:

```dotenv
AI_KEY=<gemini-api-key>
DB_PASS=<mysql-password>
JWT_SECRET_KEY=<base64-secret-production>
```

Gemini dùng endpoint OpenAI-compatible trong `application-cloud.yml`. Với production, bật HTTPS, cookie `Secure=true`, secret riêng và origin CORS cụ thể.

## Tiêu chí hoàn thành

1. Hai browser đăng nhập hai user khác nhau, gửi/nhận tin realtime được.
2. User không subscribe hoặc gửi tin sang phòng lạ được.
3. Reload trang vẫn refresh phiên được khi refresh cookie còn hiệu lực.
4. `@CloseFriend` nhận đúng ngữ cảnh phòng chat và câu trả lời hiện ở cả client.
5. Câu hỏi về giờ hiện tại khiến model gọi tool thời gian.
6. Không có API key thì chat bình thường, chỉ AI không trả lời.

## Mở rộng sau này

- RAG: dùng VectorStore, chia tài liệu, embedding, retrieval trước model; bắt đầu bằng SimpleVectorStore để học, dùng Qdrant/PGVector cho production.
- Langfuse: thêm OpenTelemetry/Micrometer, endpoint và khóa Langfuse; không trace nội dung chat nhạy cảm mặc định.
- Memory dài hạn: chỉ làm khi có consent, thời hạn lưu/xóa và cô lập theo conversation/user.
