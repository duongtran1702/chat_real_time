# @CloseFriend — Tài liệu AI hỗ trợ chat

## AI làm gì?

`@CloseFriend` là trợ lý tham gia theo yêu cầu. Người dùng nhắc tên bot trong tin nhắn để yêu cầu hỗ trợ, ví dụ:

```text
@CloseFriend tóm tắt việc mọi người vừa thống nhất
@CloseFriend giải thích thuật ngữ WebSocket đơn giản hơn
@CloseFriend mình đang hiểu nhầm điều gì trong đoạn chat này?
@CloseFriend bây giờ là mấy giờ?
```

Bot có thể:

- giải thích thuật ngữ, lỗi kỹ thuật và ý tưởng khó;
- tóm tắt các ý đã trao đổi;
- chỉ ra các thông tin còn thiếu hoặc mâu thuẫn trong đoạn chat;
- gợi ý cách xử lý bình tĩnh, rõ ràng khi cuộc trao đổi bị rối;
- dùng công cụ được cấp quyền để lấy dữ liệu đáng tin cậy, hiện có là giờ Việt Nam.

Bot không nên:

- tự nhận là con người, bịa kết quả hoặc đưa ra cam kết thay người dùng;
- tiết lộ dữ liệu từ phòng chat khác;
- thực hiện thao tác nhạy cảm khi chưa có tool được thiết kế và kiểm soát;
- trả lời khi không được nhắc `@CloseFriend`.

## AI “học phong cách” như thế nào?

AI không tự huấn luyện lại model và không lưu hồ sơ tâm lý người dùng. Thay vào đó, mỗi lần được nhắc, server lấy tối đa 20 tin gần nhất trong đúng phòng chat rồi đưa vào prompt.

Nhờ vậy, bot có thể học tạm thời cách xưng hô, độ ngắn/dài và ngôn ngữ đang dùng trong cuộc trò chuyện. Ví dụ nếu mọi người đang nói ngắn gọn, thân mật, bot sẽ trả lời theo kiểu đó; nếu đang thảo luận kỹ thuật, bot ưu tiên giải thích có cấu trúc.

Đây là **in-context learning**, không phải fine-tuning. Khi lịch sử chat không còn trong cửa sổ ngữ cảnh, AI không còn dùng phong cách đó. Cách này an toàn hơn và dễ kiểm soát hơn cho phiên bản hiện tại.

## File, thư viện và contract AI

| Tầng | File | Vai trò |
| --- | --- | --- |
| Server | `modules/chat/ai/AiReplyRequestedEvent.java` | Event chỉ chứa `conversationId` và tin nhắn gốc. |
| Server | `modules/chat/ai/CloseFriendAiService.java` | Điều phối after-commit, async, prompt, model call và lưu phản hồi. |
| Server | `modules/chat/ai/CloseFriendTools.java` | Tool Calling an toàn với `@Tool`. |
| Server | `core/config/AsyncConfig.java` | Executor `aiExecutor`, tối đa 4 worker. |
| Server | `modules/chat/repository/MessageRepository.java` | `findTop20ByConversation_IdOrderByCreatedAtDesc` để lấy style/context. |
| Client | `features/chat/hooks/useChatWebSocket.ts` | Nhận response bot trên topic conversation. |
| Client | `features/chat/components/MessageItem.tsx` | Render bot khi `senderId` là `bot_closefriend`. |

Thư viện sử dụng:

- `spring-ai-starter-model-openai`: `ChatClient`, gọi Gemini qua OpenAI-compatible API.
- `spring-ai` Tool API: annotation `@Tool` để model chỉ gọi các hàm server cho phép.
- Spring events: `@TransactionalEventListener(AFTER_COMMIT)` để AI không chạy nếu lưu tin nhắn thất bại.
- Spring async: `@Async("aiExecutor")` để lời gọi model không chặn WebSocket/database transaction.

## Luồng xử lý

```text
Người dùng nhắc @CloseFriend
        ↓
Tin nhắn người dùng được lưu thành công
        ↓
Sự kiện AI chạy ở luồng nền
        ↓
Lấy 20 tin gần nhất + tạo prompt an toàn
        ↓
Gemini có thể gọi tool đã cấp quyền
        ↓
Lưu tin bot và broadcast WebSocket
```

AI chỉ bắt đầu sau khi tin nhắn gốc đã commit. Vì thế lời gọi Gemini không giữ transaction database và lỗi AI không làm mất tin nhắn của người dùng.

## Function Calling / AI Agent

Các tool nằm trong `server/src/main/java/atmin/modules/chat/ai/CloseFriendTools.java`.

Hiện bot có `getVietnamCurrentTime`, dùng khi cần thông tin thời gian thực. Model tự chọn gọi tool, Spring AI chạy tool, rồi model dùng kết quả để tạo câu trả lời cuối cùng.

Khi thêm tool mới, hãy tuân theo nguyên tắc:

1. Mỗi tool chỉ làm một việc, mô tả rõ bằng `@Tool`.
2. Validate toàn bộ tham số trước khi ghi dữ liệu.
3. Không cho tool nhận ID người dùng/phòng chat do model tự đoán; truyền các ID đáng tin cậy từ server.
4. Với thao tác có tác động lớn (xóa, gửi email, thanh toán), luôn yêu cầu bước xác nhận của người dùng.

## Cấu hình

Trong `server/.env`, cung cấp `AI_KEY` cho Gemini OpenAI-compatible API. Không đưa file `.env` lên Git.

`application-cloud.yml` cấu hình endpoint Gemini, model và temperature. Nếu `AI_KEY` trống, chat vẫn hoạt động; bot bỏ qua yêu cầu và ghi log cảnh báo thay vì làm server lỗi.

## Hướng phát triển tiếp theo

### RAG

Khi cần bot trả lời theo tài liệu riêng (quy định nhóm, FAQ, tài liệu dự án), thêm vector store. Tài liệu được chia nhỏ, tạo embedding, rồi truy vấn các đoạn liên quan trước khi gọi model. Bản học tập có thể dùng `SimpleVectorStore`; môi trường thật nên dùng Qdrant hoặc PGVector.

### Langfuse / LLMOps

Khi cần theo dõi chất lượng và chi phí, bật OpenTelemetry + Langfuse. Chỉ gửi metadata cần thiết; không đưa nội dung chat nhạy cảm vào trace mặc định.

### Memory dài hạn

Chỉ thêm khi có chính sách đồng ý và xóa dữ liệu rõ ràng. Memory dài hạn cần tách theo conversation/user, có thời hạn lưu và cơ chế người dùng xem/xóa.

Xem [REBUILD_SPEC.md](REBUILD_SPEC.md) cho checklist tái tạo toàn bộ dự án.
