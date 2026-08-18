# Nhật Ký Cập Nhật - Dự Án Chat Real-Time AI (@CloseFriend)

**Ngày cập nhật**: 18/08/2026

---

## Cập nhật 18/08/2026 — Đổi tên ứng dụng thành "Chat Together"

### Tổng quan
Cập nhật toàn diện tên nhận diện thương hiệu của ứng dụng từ "CloseFriend Chat" sang "Chat Together" trên cả Client và Server.

### Chi tiết thay đổi
1. **Giao diện Client:**
   - Thay đổi các tiêu đề và thẻ text trên ứng dụng (`App.tsx`, `Login.tsx`, `Register.tsx`, `ConversationList.tsx`, `index.html`) thành "Chat Together".
   - Đổi tên bot AI nhận diện từ "CloseFriend AI" sang "Chat Together AI" (`BotAvatar.tsx`, `ChatBox.tsx`, `MentionSuggestions.tsx`, `MessageItem.tsx`).
2. **Cú pháp gọi Bot (Client & Server):**
   - Giữ cú pháp đề cập bot là `@CloseFriend` trên cả Client và Server để người dùng tiếp tục dùng lệnh quen thuộc.

### Kết quả kiểm tra
- ✅ Ứng dụng đã được thống nhất tên gọi "Chat Together".
- ✅ TypeScript type check: `tsc --noEmit` pass (exit code 0).
- ✅ Server build: `gradlew build -x test` — BUILD SUCCESSFUL.

---

## Cập nhật 18/08/2026 — Tính năng Đăng ký tài khoản và Tìm kiếm bạn bè

### Tổng quan
Hoàn thiện chức năng để người dùng có thể tự đăng ký tài khoản mới và tìm kiếm/kết bạn với người dùng khác thông qua tính năng Search thay vì sử dụng tài khoản demo.

### Chi tiết thay đổi

#### 1. API Đăng ký (Server)
- Thêm `RegisterRequest` DTO với validation (Tài khoản >= 5 ký tự, Mật khẩu >= 6 ký tự).
- `AuthService`: Kiểm tra trùng lặp `username`, mật khẩu xác nhận phải khớp. Tạo tài khoản với trạng thái `ACTIVE` mặc định và mã hóa mật khẩu bằng `BCrypt`.
- `AuthController`: Mở endpoint `POST /api/v1/auth/register`.

#### 2. Tính năng Tìm kiếm bạn bè (Client & Server)
- **Server:** Bổ sung `findByUsernameContainingIgnoreCase` trong `UserRepository`. Thêm endpoint `GET /api/v1/users/search?username={q}` trong `UserProfileController` giúp tìm kiếm tương đối user (loại bỏ chính mình và user bị khóa).
- **Client:** Bổ sung thanh Search trong `ConversationList.tsx` với kỹ thuật debounce (500ms) để không spam API. Kết quả tìm kiếm hiển thị dạng danh sách người dùng thay thế cho danh sách phòng chat hiện tại.

#### 3. Tạo phòng chat 1-1 (Server & Client)
- **Server:** Thêm custom query `findPrivateConversationBetweenUsers` trong `ConversationRepository` để kiểm tra 2 người đã từng chat chưa. Thêm endpoint `POST /api/v1/chat/conversations/user/{targetUserId}` trong `ChatController` để tự động khởi tạo hoặc trả về phòng chat hiện hữu.
- **Client:** Tích hợp gọi API tạo phòng chat khi user click vào một người trong kết quả tìm kiếm, sau đó refetch danh sách cuộc trò chuyện và tự động select phòng chat vừa được khởi tạo.

#### 4. Giao diện Đăng ký (Client)
- Tạo component `Register.tsx` sử dụng phong cách Glassmorphism đồng nhất với trang `Login`.
- Hỗ trợ hiển thị lỗi *inline validation* với text màu đỏ nhạt ngay dưới từng ô input (thay vì chỉ dùng Toast) theo yêu cầu UX khắt khe.
- Cập nhật `App.tsx` hỗ trợ chuyển đổi mượt mà giữa màn hình Đăng nhập và Đăng ký.

### Kết quả kiểm tra
- ✅ API validation bắt chính xác các rule: tài khoản >= 5 ký tự, mật khẩu >= 6 ký tự, trùng username.
- ✅ Client tự động debounce search API, không gây lỗi memory/leak.
- ✅ TypeScript type check: `tsc --noEmit` pass (exit code 0).
- ✅ Server build: `gradlew build -x test` — BUILD SUCCESSFUL.

---

## Cập nhật 18/08/2026 — Tính năng mới: Typing Indicator + Reply Message

### Tổng quan
Thêm 2 tính năng UX quan trọng cho CloseFriend Chat:
1. **Typing Indicator** — hiển thị "Tên đang nhập..." real-time khi người khác đang gõ tin nhắn.
2. **Reply Message** — trả lời (reply) một tin nhắn cụ thể, hiển thị quote block và scroll tới tin gốc.

### Chi tiết thay đổi

#### Feature 1: Typing Indicator

**Server:**
- [`WebSocketChatController.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/controller/WebSocketChatController.java) — Thêm endpoint `@MessageMapping("/chat.typing")`. Nhận payload `{ conversationId }`, kiểm tra quyền thành viên, lấy fullName từ DB và broadcast tới `/topic/conversation/{id}/typing`. Fire-and-forget, không lưu DB.
- [`ChatSubscriptionSecurityConfig.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/core/security/ChatSubscriptionSecurityConfig.java) — Cho phép subscribe vào `/topic/conversation/{id}/typing` (strip `/typing` suffix khi kiểm tra quyền, cùng logic với `/read`).

**Client:**
- [NEW] [`useTypingIndicator.ts`](file:///d:/ChatRealTime/client/src/features/chat/hooks/useTypingIndicator.ts) — Hook quản lý gửi (debounce 500ms + throttle 2s) và nhận typing events. Tự ẩn sau 3s, bỏ qua typing của chính mình, cleanup khi chuyển conversation.
- [NEW] [`TypingIndicator.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/TypingIndicator.tsx) — Component hiển thị "Tên đang nhập" + 3 chấm bounce animation. Hỗ trợ hiển thị 1, 2 hoặc nhiều người đồng thời.
- [`ChatBox.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/ChatBox.tsx) — Tích hợp `useTypingIndicator`, gọi `emitTyping()` khi user gõ phím, render `<TypingIndicator>` phía trên `messagesEndRef`.
- [`useChatWebSocket.ts`](file:///d:/ChatRealTime/client/src/features/chat/hooks/useChatWebSocket.ts) — Expose `stompClient` để hook typing dùng chung kết nối.
- [`index.css`](file:///d:/ChatRealTime/client/src/index.css) — Thêm CSS cho `.typing-indicator-*`, keyframes `typingBounce`.

#### Feature 2: Reply Message

**Server:**
- [`Message.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/entity/Message.java) — Thêm `@ManyToOne` self-referencing field `replyToMessage` → cột `reply_to_message_id` (nullable) trong bảng `messages`.
- [`MessageRequest.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/dto/MessageRequest.java) — Thêm field optional `replyToMessageId`.
- [`MessageResponse.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/dto/MessageResponse.java) — Thêm nested DTO `RepliedMessageSummary` (id, senderId, content cắt ngắn 100 ký tự). Cập nhật `fromEntity()`.
- [`ChatServiceImpl.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/service/impl/ChatServiceImpl.java) — Khi có `replyToMessageId`: tìm message gốc, validate cùng conversation (chống reply xuyên phòng), gán vào entity trước khi save.

**Client:**
- [`useChatStore.ts`](file:///d:/ChatRealTime/client/src/features/chat/store/useChatStore.ts) — Thêm interface `RepliedMessageSummary`, mở rộng `Message` với field `repliedMessage`. Thêm state `replyingTo` + actions `setReplyingTo()`, `clearReplyingTo()`. Tự clear reply khi chuyển conversation.
- [`useChatWebSocket.ts`](file:///d:/ChatRealTime/client/src/features/chat/hooks/useChatWebSocket.ts) — `sendMessage()` nhận thêm optional `replyTo` object. Optimistic message mang `repliedMessage` snapshot. Payload STOMP gửi kèm `replyToMessageId`.
- [NEW] [`ReplyPreview.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/ReplyPreview.tsx) — Thanh preview trên input khi đang reply, viền accent gradient bên trái, tên sender + nội dung cắt ngắn, nút X hủy, animation slide-down.
- [`MessageItem.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/MessageItem.tsx) — Thêm quote block render khi có `repliedMessage` (viền trái xanh, nền nhạt, click scroll tới tin gốc). Nút reply icon xuất hiện khi hover ở bên cạnh message bubble. Hỗ trợ hiển thị tên sender từ participants list.
- [`ChatBox.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/ChatBox.tsx) — Tích hợp toàn bộ reply flow: lấy `replyingTo` từ store, render `<ReplyPreview>`, truyền `onReply`/`onScrollToMessage` xuống `<MessageItem>`, gửi `replyPayload` khi submit.
- [`index.css`](file:///d:/ChatRealTime/client/src/index.css) — Thêm CSS cho `.reply-preview-*`, `.reply-quote-*`, `.reply-action-*`, `.message-highlight-flash`, các keyframes `replySlideDown` và `highlightFlash`.

### Kết quả kiểm tra
- ✅ TypeScript type check: `tsc --noEmit` pass (exit code 0)
- ✅ Server build: `gradlew build -x test` — BUILD SUCCESSFUL

---

## Cập nhật 18/08/2026 — Nâng cấp UX/UI toàn diện: Modern Glass Messenger

### Tổng quan
Nâng cấp giao diện từ phong cách "Messenger clone cơ bản" lên **Modern Glass Messenger** — glassmorphism, gradient, micro-animations — mà **không thay đổi bất kỳ logic/behavior nào**.

### Các file đã thay đổi

#### 1. `client/src/index.css` — Design System hoàn chỉnh
- Thêm CSS custom properties (design tokens): bảng màu, surface, border, shadow, gradient, radius
- Thêm glass effect utilities: `.glass`, `.glass-elevated`, `.glass-subtle`
- Thêm gradient utilities: `.border-gradient-b`, `.border-gradient-r`, `.text-gradient`
- Thêm `.chat-bg-pattern` (dot pattern cho vùng tin nhắn)
- Thêm `.login-bg` (animated gradient background cho trang Login)
- Thêm `.online-dot` (pulse animation cho trạng thái online)
- Thêm animations mới: `float`, `fadeInUp`, `scaleIn`, `gradientShift`, `shimmer`, `blobFloat1/2`, `pulseOnline`
- Cải thiện scrollbar styling

#### 2. `client/src/App.css` — **ĐÃ XÓA**
- File chứa CSS template Vite (`.hero`, `.counter`, `#center`...) hoàn toàn không được sử dụng

#### 3. `client/src/features/auth/components/Login.tsx`
- Nền: animated gradient (`login-bg`) với floating blobs decorative
- Card: glass effect (`bg-white/85 backdrop-blur-xl border-white/30`)
- Input: thêm placeholder text, focus glow effect (`ring-4 + shadow`)
- Button: gradient accent (`from-[#0066ff] to-[#5c7cfa]`) + shadow glow

#### 4. `client/src/features/chat/components/ConversationList.tsx`
- Tiêu đề "Đoạn chat": gradient text effect (`.text-gradient`)
- Search bar: glass effect (`bg-white/50 backdrop-blur-sm`)
- Conversation items: hover `shadow-sm` + `active:scale-[0.99]`, active state có gradient accent bar bên phải
- Online dot: pulse animation (`.online-dot`)
- Empty state: icon `MessageCircle` + text tinh tế

#### 5. `client/src/features/chat/components/ChatBox.tsx`
- Header: `glass-elevated` backdrop-blur, border gradient nhẹ
- Message area: dot pattern background (`chat-bg-pattern`)
- Input area: `glass-elevated`, border gradient, send button gradient + shadow khi có text
- Status text: đổi màu theo trạng thái (amber/emerald/slate)
- Empty state: gradient icon background + `animate-fade-in-up`

#### 6. `client/src/features/chat/components/MessageItem.tsx`
- Tin nhắn gửi đi: gradient xanh (`from-[#0066ff] to-[#4d7cff]`) + shadow tint
- Tin nhắn bot: gradient tím nhạt + border indigo tinh tế
- Tin nhắn đối phương: nền trắng + shadow + border siêu nhẹ
- Timestamp hover: `backdrop-blur-sm` + `bg-white/95`
- Animation: `animate-fade-in-up` thay vì `animate-slide-up`

#### 7. `client/src/App.tsx`
- Nền app: gradient (`from-slate-100 via-blue-50/30 to-indigo-50/20`)
- Sidebar: `glass-subtle`, footer `glass-elevated`
- Border: gradient nhẹ thay vì solid `#e5e7eb`
- Empty state: `chat-bg-pattern` + `.text-gradient`
- Camera icon: gradient (`from-[#0066ff] to-[#5c7cfa]`)

#### 8. `client/src/features/chat/components/BotAvatar.tsx`
- Gradient mở rộng: thêm tím `#7048e8`
- Shadow: `shadow-md shadow-blue-500/20`
- Hiệu ứng: `animate-pulse-glow`

#### 9. `client/src/features/chat/components/MentionSuggestions.tsx`
- Glass dropdown: `bg-white/90 backdrop-blur-xl`
- Bo tròn: `rounded-2xl`
- Animation: `animate-scale-in`
- Hover: shadow + scale

#### 10. `client/src/features/profile/components/ProfileModal.tsx`
- Backdrop: `backdrop-blur-md` (mạnh hơn)
- Card: `bg-white/95 backdrop-blur-xl border-white/50`
- Animation: `animate-scale-in` khi mở
- Button gradient nhất quán
- Focus glow cho input

---

## Cập nhật 17/08/2026

## Tóm tắt những thay đổi

Triển khai toàn diện hệ thống Web Chat có hỗ trợ AI, tuân thủ chặt chẽ kiến trúc SOLID, Modular Monolith (Server) và Feature-Sliced (Client).

### Phía Server (Spring Boot)
1. **Cấu hình Dependencies**: Cập nhật `build.gradle` để bổ sung các module thiết yếu (`spring-boot-starter-websocket`, `spring-boot-starter-security`, `jjwt` và `atmin-library:1.0.4.Beta`).
2. **Bảo mật Kênh (Channel Security)**: Tạo `ChatSubscriptionSecurityConfig` để chặn đứng hành vi lấy ID người khác để "nghe lén" phòng chat thông qua lệnh `SUBSCRIBE` của STOMP.
3. **Module Chat Core**:
   - `Entity` & `Repository`: Thiết lập cơ sở dữ liệu cho `User`, `Conversation`, `Message`.
   - `DTO`: Xây dựng cấu trúc gửi nhận dữ liệu chuẩn `MessageRequest`, `MessageResponse`.
   - `ChatService` & `ChatServiceImpl`: Xử lý lưu tin nhắn, kiểm tra phòng chat và phát tín hiệu (broadcast) real-time bằng `SimpMessagingTemplate`.
   - `ChatController` & `WebSocketChatController`: Cung cấp điểm chạm API REST lấy lịch sử và `@MessageMapping` cho WebSockets.
4. **Presence Manager**: Triển khai trình quản lý trạng thái Online/Offline, tích hợp bộ hẹn giờ (ScheduledExecutorService) trễ 5 giây để triệt tiêu hiệu ứng nhấp nháy UI khi F5 trình duyệt.
5. **Spring AI (@CloseFriend)**: Tạo `CloseFriendAiService` chạy ngầm (`@Async`) với Transaction tách biệt nhằm gọi API Gemini không gây nghẽn kết nối Database.

### Phía Client (React / Vite)
1. **Kiến trúc Feature-Sliced**: Chia cắt mã nguồn UI mạch lạc tại `features/chat`.
2. **State Management**: Sử dụng `zustand` (`useChatStore`) để quản lý phòng chat đang chọn trên toàn cục.
3. **Mạng (Network) & WebSocket**: 
   - Tạo Axios client (`api.ts`).
   - Viết hook cực kỳ mạnh mẽ `useChatWebSocket` kết hợp SockJS & StompJS để điều phối gửi tin, xử lý Optimistic Update (giả ID để hiện tin nhắn ngay lập tức) và Read Receipts (Đã đọc chéo ID).
4. **Giao diện (UI)**: Code 100% bằng Tailwind CSS.
   - 🎨 Sử dụng hiệu ứng `glassmorphism` (backdrop-blur).
   - ✨ Phân tách màu sắc, bong bóng chat riêng (tím) cho bot `@CloseFriend`.
   - 😎 Gradient hiện đại theo phong cách thiết kế Premium.

### Sửa Lỗi (Bug Fixes)
- **Cập nhật ngày**: 17/08/2026
- **Client (Tailwind CSS)**: Cập nhật cú pháp khai báo trong file `index.css` để tương thích chuẩn Tailwind v4 (sử dụng `@import "tailwindcss";` thay vì `@tailwind base/components/utilities`), khắc phục dứt điểm lỗi Vite không build được do không nhận diện được utility class (như `bg-gray-50`).
- **Client (TypeScript/Vite)**: Khắc phục lỗi `Uncaught SyntaxError: does not provide an export named` khi Vite (esbuild) biên dịch. Chuyển đổi toàn bộ các câu lệnh import interface (như `Message`, `Conversation`) từ store sang định dạng `import type { ... }`. Điều này giúp trình biên dịch nhận diện chính xác đây là các kiểu dữ liệu và loại bỏ an toàn khỏi mã JavaScript lúc chạy (runtime), tránh gây lỗi crash ứng dụng.
- **Client (Vite/SockJS)**: Xử lý triệt để lỗi runtime `Uncaught ReferenceError: global is not defined` trên trình duyệt. Lỗi này do thư viện `sockjs-client` mặc định tìm kiếm biến `global` của môi trường Node.js. Khắc phục bằng cách cấu hình `define: { global: 'window' }` bên trong file `vite.config.ts` nhằm cung cấp polyfill phù hợp cho môi trường browser.
- **Xác thực toàn diện (Full Authentication Flow)**: Thay thế luồng xác thực "giả" bằng cơ chế xác thực JWT kết nối Database thực tế.
  - **Server**: 
    - Bổ sung `username`, `password`, `status` (`UserStatus`) vào entity `User`.
    - Viết `DatabaseSeeder` tự động sinh 2 tài khoản (user123, atmin123) kèm mật khẩu đã mã hóa (BCrypt) và phòng chat mẫu khi Server khởi động.
    - Phát triển API `/api/v1/auth/login` để cấp JWT hợp lệ.
    - Xóa bỏ bypass bảo mật trong `WebSocketConfig` để chặn hoàn toàn kết nối Stomp nặc danh.
  - **Client**: 
    - Phát triển màn hình `Login.tsx` cao cấp (UI Glassmorphism, không cho phép đăng ký mới).
    - Tạo `useAuthStore` (Zustand) để lưu `token` và `currentUser` (kết hợp `localStorage`).
    - Cập nhật axios interceptor trong `api.ts` tự động chèn token, và `App.tsx` tự động chuyển đổi view Đăng nhập/Chat dựa trên state hiện tại.
- **Client (React/TypeScript)**: Sửa lỗi TS1484 trong `useChatWebSocket.ts` bằng cách sử dụng `import type` cho `IMessage`, giúp ứng dụng build thành công khi bật `verbatimModuleSyntax`.
- **Client (Debounce API /read)**: Triển khai thành công logic Debounce bằng `setTimeout` (1 giây) vào chức năng `markAsRead` trong `useChatWebSocket.ts` để ngăn chặn việc spam API liên tục khi nhận nhiều tin nhắn mới, đúng theo thiết kế.
- **Server (PresenceManager)**: Sửa lỗi logic gửi nhầm sự kiện `online=true` khi người dùng nhấn F5/Reload trang. Giờ đây, nếu kết nối lại trong vòng 5 giây (huỷ lịch offline thành công), Server sẽ không broadcast trạng thái online dư thừa nữa.

### Cải Tiến Kiến Trúc (Architecture Improvements)
- **Cập nhật ngày**: 17/08/2026
- **Kiến trúc Đăng nhập Stateless JWT (Không phiên)**: Áp dụng triệt để kiến trúc bảo mật từ dự án Holiday.
  - **Server (Spring Boot)**: 
    - Bổ sung khả năng sinh và xác thực `refresh_token` trong `JwtProvider`.
    - Cập nhật `AuthController` để trả về `refresh_token` thông qua **HttpOnly Cookie** thay vì JSON body, ngăn chặn hoàn toàn tấn công XSS từ phía Client.
    - Xây dựng API `/refresh` ngầm để cấp lại `access_token` mới và `/logout` để chủ động xóa Cookie.
  - **Client (React)**: 
    - Cập nhật `useAuthStore` loại bỏ hoàn toàn việc lưu trữ `token` trong `localStorage`, chỉ lưu trên memory (RAM).
    - Triển khai thành công **Silent Refresh (AuthInit)** bọc ngoài ứng dụng, tự động làm mới token ngầm khi khởi động để tránh nháy trang.
    - Cài đặt **Axios Interceptor Queue** siêu mạnh mẽ trong `api.ts`: Bắt giữ lỗi `401 Unauthorized`, tạm dừng toàn bộ các request, đưa vào hàng đợi (`failedQueue`), tự động gọi API `/refresh`, và `replay` lại toàn bộ queue khi refresh thành công mà người dùng không hề hay biết.
- **Bảo mật (Security)**: Khởi tạo file `.gitignore` ở cấp độ thư mục gốc (root) nhằm ngăn chặn rủi ro rò rỉ các tệp cấu hình bí mật, khóa (keys, `.pem`, `.crt`), môi trường (`.env`) và thông tin đăng nhập lên kho lưu trữ mã nguồn (Repository).

## Hoàn thiện trò chuyện riêng tư giữa hai tài khoản

**Ngày cập nhật**: 17/08/2026

### Nội dung triển khai

- Chuyển giao diện từ “Phòng Chat Demo” sang một cuộc trò chuyện riêng tư thực sự giữa `user123` và `atmin123`. Tên hiển thị luôn được suy ra từ người còn lại, không còn dùng tên phòng chung hoặc lấy nhầm người đang đăng nhập.
- Tự động mở cuộc trò chuyện duy nhất sau khi đăng nhập; bổ sung trạng thái rỗng rõ ràng nếu dữ liệu hai người chưa được khởi tạo.
- Tạo hai ảnh đại diện SVG riêng tại `client/public/avatars/` và hiển thị đồng nhất ở thanh tài khoản, danh sách trò chuyện, tiêu đề và từng bong bóng tin nhắn.
- Bổ sung `ConversationResponse` và `ParticipantResponse` để API chỉ trả đúng dữ liệu giao diện cần dùng, không trả trực tiếp thực thể cơ sở dữ liệu.
- Đồng bộ dữ liệu khởi tạo để cuộc trò chuyện luôn có đúng hai thành viên, không mang tên demo và hai tài khoản luôn nhận đúng đường dẫn ảnh đại diện kể cả khi cơ sở dữ liệu đã tồn tại từ trước.
- Nâng cấp gửi tin lạc quan bằng `clientMessageId` chuẩn UUID. Phản hồi WebSocket giờ ghép chính xác với tin tạm tương ứng, kể cả khi người dùng gửi nhiều tin có nội dung giống nhau.
- Giới hạn nội dung tối đa 4.000 ký tự ở cả Client và Server; nội dung được loại bỏ khoảng trắng thừa trước khi lưu.
- Lưu trạng thái `READ` thật sự vào cơ sở dữ liệu khi người nhận mở cuộc trò chuyện, đồng thời tiếp tục phát biên nhận đã đọc theo thời gian thực cho người gửi.
- Bổ sung trạng thái mất kết nối/kết nối lại, khóa nút gửi khi WebSocket chưa sẵn sàng và giữ nguyên nội dung đang soạn nếu gửi chưa thành công.
- Thêm cơ sở dữ liệu H2 chỉ dành cho kiểm thử để bộ kiểm thử Server không phụ thuộc vào tài khoản MySQL của môi trường phát triển.

### Tệp chính đã thay đổi

- Client: `App.tsx`, `ConversationList.tsx`, `ChatBox.tsx`, `MessageItem.tsx`, `UserAvatar.tsx`, `useChatWebSocket.ts`, `useChatStore.ts`, `AuthInit.tsx` và hai tệp ảnh trong `public/avatars/`.
- Server: `DatabaseSeeder.java`, các DTO cuộc trò chuyện/tin nhắn, `Message.java`, `MessageRepository.java`, `ChatServiceImpl.java`, `ChatController.java`, `build.gradle` và `src/test/resources/application.yml`.

### Kết quả kiểm tra

- Client: lint không còn cảnh báo; TypeScript biên dịch thành công; Vite tạo bản dựng production thành công.
- Server: `compileJava` thành công và toàn bộ bộ kiểm thử Gradle hoàn tất với trạng thái `BUILD SUCCESSFUL`.

## Tích hợp chức năng đổi ảnh đại diện từ dự án Holiday

**Ngày cập nhật**: 17/08/2026

### Nội dung triển khai

- Chuyển luồng đổi ảnh từ Holiday sang ChatRealTime: người dùng nhấn biểu tượng camera tại tài khoản hiện tại, chọn ảnh, xem trước và xác nhận trước khi tải lên.
- Tạo feature Client độc lập `features/profile` gồm giao diện `AvatarUploadModal`, hook quản lý tải ảnh và service gọi API multipart; giao diện có trạng thái đang tải, thông báo thành công/thất bại, đóng bằng phím Escape và hỗ trợ thao tác bàn phím.
- Kiểm tra tệp ở cả Client và Server: chỉ cho phép PNG/JPG/JPEG, tối đa 5 MB, ảnh tối đa 4096 × 4096 pixel; Server đọc nội dung ảnh thật thay vì chỉ tin tên tệp hoặc MIME do trình duyệt gửi lên.
- Tích hợp module Media theo kiến trúc của Holiday với `MediaUploadService` và bản triển khai Cloudinary. Ảnh được lưu theo tài khoản trong thư mục `chat-realtime/avatars`, cho phép ghi đè và làm mới bộ nhớ đệm an toàn.
- Bổ sung API bảo mật `POST /api/v1/users/me/avatar`; mã người dùng luôn lấy từ JWT, không cho Client truyền ID để đổi ảnh của tài khoản khác.
- Sau khi cập nhật, Server phát sự kiện `/topic/profile-updates`. Hai cửa sổ chat cập nhật avatar mới ngay lập tức ở thanh tài khoản, danh sách người chat, tiêu đề và bong bóng tin nhắn mà không cần tải lại trang.
- Sửa `DatabaseSeeder` để chỉ gán avatar mặc định khi tài khoản chưa có ảnh, tránh ghi đè ảnh Cloudinary mỗi lần khởi động Server.
- Bổ sung `server/.env.example`, hỗ trợ tự đọc `server/.env`, cấu hình giới hạn multipart và hướng dẫn ba biến Cloudinary cần thiết trong `Instructions_for_use.md`.

### Tệp chính đã thay đổi

- Client: `App.tsx`, `features/profile/**`, `useAuthStore.ts`, `useChatStore.ts`, `useChatWebSocket.ts` và public API của feature Chat.
- Server: `modules/media/**`, `UserProfileController.java`, `UserProfileService.java`, `UserProfileServiceImpl.java`, các DTO hồ sơ, `DatabaseSeeder.java`, `application.yml`, `application-cloud.yml`, `.env.example`, `build.gradle` và `Instructions_for_use.md`.

### Kết quả kiểm tra

- Client: `oxlint` không có cảnh báo, TypeScript biên dịch thành công và Vite tạo bản dựng production thành công.
- Server: toàn bộ kiểm thử Gradle thành công; biên dịch sạch bằng `compileJava --rerun-tasks`, không còn cảnh báo unchecked.

## Bổ sung cập nhật thông tin hồ sơ

**Ngày cập nhật**: 17/08/2026

### Nội dung triển khai

- Mở rộng cửa sổ đổi avatar thành `ProfileModal`, cho phép quản lý đồng thời ảnh đại diện và tên hiển thị trong cùng một nơi.
- Hiển thị tên đăng nhập ở chế độ chỉ đọc vì đây là định danh dùng cho đăng nhập và JWT; Client không được phép gửi yêu cầu đổi username.
- Bổ sung API bảo mật `PUT /api/v1/users/me`. Server lấy đúng tài khoản từ JWT, chuẩn hóa khoảng trắng và lưu tên hiển thị mới vào cơ sở dữ liệu.
- Kiểm tra tên ở cả Client và Server: bắt buộc từ 2 đến 100 ký tự, phải có chữ cái và chỉ chấp nhận chữ cái, dấu tiếng Việt, khoảng trắng, dấu chấm, dấu nháy hoặc gạch nối.
- Mở rộng sự kiện `/topic/profile-updates` để đồng bộ cả `fullName` và `avatarUrl`. Người còn lại thấy tên mới ngay tại danh sách trò chuyện, tiêu đề và các vị trí hồ sơ mà không cần tải lại trang.
- Tách logic Client thành `useProfileInfoUpdate` và `profileService.updateProfile`, có trạng thái đang lưu, thông báo lỗi/thành công và giữ UI component tập trung vào hiển thị.
- Thêm kiểm thử `UserProfileServiceImplTest` để xác nhận tên được chuẩn hóa đúng và sự kiện WebSocket được phát với dữ liệu mới; đồng thời kiểm tra trường hợp tên chỉ còn một ký tự sau chuẩn hóa bị từ chối.

### Tệp chính đã thay đổi

- Client: `App.tsx`, `features/profile/components/ProfileModal.tsx`, `useProfileInfoUpdate.ts`, `profileService.ts`, `useAuthStore.ts`, `useChatStore.ts` và `useChatWebSocket.ts`.
- Server: `UpdateProfileRequest.java`, `ProfileUpdatedEventResponse.java`, `UserProfileController.java`, `UserProfileService.java`, `UserProfileServiceImpl.java` và `UserProfileServiceImplTest.java`.

### Kết quả kiểm tra

- Client: lint không có cảnh báo, TypeScript biên dịch thành công và Vite tạo bản dựng production thành công.
- Server: toàn bộ kiểm thử Gradle, bao gồm hai ca kiểm thử hồ sơ mới, hoàn tất với trạng thái `BUILD SUCCESSFUL`.

## Sửa lỗi IntelliJ không chạy được Server vì dòng lệnh quá dài

**Ngày cập nhật**: 17/08/2026

- Cập nhật cấu hình chạy `ServerApplication` trong `server/.idea/workspace.xml` để IntelliJ sử dụng tệp tham số Java (`ARGS_FILE`) thay cho việc ghép toàn bộ dependency vào dòng lệnh Windows.
- Cố định thư mục chạy thành `$PROJECT_DIR$` để Server tiếp tục đọc đúng tệp `server/.env`.
- Thay đổi này xử lý lỗi `Command line is too long. Shorten the command line and rerun` mà không cần xóa dependency hoặc thay đổi mã nguồn ứng dụng.
- Bổ sung cấu hình dự phòng `server/.run/ServerApplication_Gradle.run.xml`. Cấu hình **ServerApplication (Gradle)** chạy bằng tác vụ `bootRun`, luôn dùng đúng `runtimeClasspath` của Gradle và tránh lỗi IntelliJ chưa đồng bộ thư viện Cloudinary.
- Đã xác nhận `com.cloudinary:cloudinary-http5:2.0.0` tồn tại trực tiếp trong `runtimeClasspath`; lỗi `ClassNotFoundException: com.cloudinary.Cloudinary` đến từ cache classpath của cấu hình IntelliJ cũ, không phải do thiếu dependency trong dự án.
- Đã khởi động thử bằng `bootRun` trên cổng ngẫu nhiên: Spring Boot, Cloudinary configuration, MySQL, JPA và WebSocket đều khởi tạo thành công; `ServerApplication` đạt trạng thái `Started` sau khoảng 14 giây.
- Chuyển cấu hình đang được chọn trong IntelliJ từ `Spring Boot.ServerApplication` sang `Gradle.ServerApplication (Gradle)` và bổ sung đồng thời `shortenClasspath` cùng `SHORTEN_COMMAND_LINE=ARGS_FILE` để tương thích nhiều phiên bản IntelliJ trên Windows.
- Loại bỏ hoàn toàn SDK Cloudinary khỏi classpath và chuyển sang gọi Cloudinary Upload API bằng `RestClient` có sẵn trong Spring. Việc này xử lý dứt điểm `ClassNotFoundException: com.cloudinary.Cloudinary` ngay cả khi IntelliJ chưa làm mới mô hình dependency.
- Khôi phục cách chạy Spring Boot trực tiếp theo yêu cầu: thêm cấu hình project `server/.run/ServerApplication.run.xml`, chọn lại `Spring Boot.ServerApplication` và sử dụng `JAR manifest` để đưa classpath dài vào một JAR tạm. Đây vẫn là thao tác Run/Debug `ServerApplication` thông thường, không chạy thông qua Gradle.
- Xóa cấu hình chạy Gradle dự phòng để tránh nhầm lẫn trong danh sách Run. Dự án hiện chỉ giữ cấu hình Spring Boot trực tiếp `ServerApplication` như cách chạy thông thường trong IntelliJ.

## Cho phép hai Client 5173 và 5174 chat đồng thời

**Ngày cập nhật**: 17/08/2026

- Sửa lỗi Client chạy tại `http://localhost:5174` không kết nối được WebSocket vì `WebSocketConfig` trước đó chỉ chấp nhận origin 5173.
- Tạo `FrontendOriginProperties` làm nguồn cấu hình chung cho cả REST CORS và SockJS/STOMP, tránh tình trạng một bên cho phép 5174 nhưng bên còn lại từ chối.
- Cấu hình mặc định cho phép chính xác `http://localhost:5173` và `http://localhost:5174`, phù hợp việc đăng nhập hai tài khoản bằng hai Google Chrome profile khác nhau.

## Sửa yêu cầu cập nhật avatar không phải multipart

**Ngày cập nhật**: 17/08/2026

- Đối chiếu lại luồng chuẩn trong Holiday và xác định Client ChatRealTime bị kế thừa `Content-Type: application/json` từ Axios instance khi gửi `FormData`.
- Cập nhật `profileService.uploadAvatar` để ghi đè `Content-Type: multipart/form-data` đúng như `Holiday/client/src/features/profile/services/user.api.ts`.
- Khai báo rõ `consumes = multipart/form-data` tại API `/api/v1/users/me/avatar`, bảo đảm hợp đồng Client–Server nhất quán và ngăn yêu cầu sai định dạng đi sâu vào nghiệp vụ.
- Sau kiểm tra thực tế, bỏ ràng buộc `consumes` bổ sung vì nó khiến Spring không chọn handler khi request từ trình duyệt chưa có content type khớp tuyệt đối và rơi xuống static resource handler. Controller hiện khớp đúng cấu trúc Holiday: `@PostMapping("/me/avatar")` kết hợp `@RequestParam("file") MultipartFile file`.

## Nâng Cấp Giao Diện (UI/UX) & Responsive

**Ngày cập nhật**: 17/08/2026

- **Mobile Responsive**: Đảm bảo ứng dụng chạy mượt mà trên các thiết bị màn hình nhỏ (Mobile/Tablet) bằng cách ẩn/hiện Sidebar và Main Chat Area tùy thuộc vào việc người dùng có đang trong phòng chat nào không. Bổ sung nút `Back` trong `ChatBox` trên điện thoại.
- **Premium Design (Glassmorphism & Animated Backgrounds)**: 
  - Đổi tông màu và hình nền thành dạng Gradient động (Animated Gradient) kết hợp với các hình cầu lơ lửng mờ (Blurry Blobs).
  - Áp dụng font **Inter** xuyên suốt dự án mang lại cảm giác chuyên nghiệp.
  - Nâng cấp màn hình Đăng Nhập (`Login`), danh sách phòng trò chuyện (`ConversationList`) và bong bóng tin nhắn (`MessageItem`) với bóng đổ mượt mà (soft shadows), đường viền siêu nhẹ và hiệu ứng background mờ (backdrop-blur).
- **Micro-Animations**:
  - Tích hợp nhiều chuyển động mượt mà bằng CSS Keyframes (`slide-up`, `pop-in`, `float`, `pulse-glow` cho người dùng online).
- **Tuân thủ Tuyệt Đối Logic**: Quá trình nâng cấp 100% không làm thay đổi hay chạm vào logic quản lý State (Zustand) hay kết nối WebSocket/API.

## Hoàn thiện giao diện và nhận diện robot CloseFriend trên mobile

**Ngày cập nhật**: 17/08/2026

### Nội dung triển khai

- Tạo component `BotAvatar` riêng bằng biểu tượng robot vector, loại bỏ emoji lấp lánh cũ và dùng thống nhất tại tin nhắn AI, khu vực hướng dẫn gọi bot, màn hình chờ và nhận diện CloseFriend.
- Thiết kế lại tin nhắn bot theo hướng dễ phân biệt nhưng không lấn át cuộc trò chuyện: có avatar robot, nhãn `CloseFriend AI`, huy hiệu `Bot` và bong bóng nền sáng dễ đọc.
- Thêm nút robot cạnh ô nhập. Người dùng chỉ cần nhấn nút để chèn `@CloseFriend`, không phải tự nhớ cú pháp gọi bot.
- Cải thiện danh sách trò chuyện, tiêu đề phòng chat, trạng thái trực tuyến, màn hình chưa có tin nhắn và khu vực tài khoản bằng khoảng cách, độ tương phản và vùng bấm phù hợp thiết bị cảm ứng.
- Chuyển khung ứng dụng sang chiều cao động `100dvh`, bổ sung safe-area cho thiết bị có tai thỏ/thanh điều hướng và ngăn ô nhập bị thanh trình duyệt mobile che khuất.
- Tối ưu riêng cho mobile: header gọn hơn, bong bóng tin nhắn rộng hợp lý, ẩn avatar của chính mình để dành không gian, nút quay lại và nút gửi đạt vùng chạm thuận tiện.
- Chuyển cửa sổ hồ sơ thành bottom sheet trên mobile, giới hạn chiều cao và cho phép cuộn; trên desktop vẫn giữ dạng modal ở giữa màn hình.
- Làm mới màn hình đăng nhập với biểu tượng robot, kích thước và khoảng cách responsive; bổ sung hỗ trợ `prefers-reduced-motion` cho người dùng hạn chế chuyển động.

### Tệp chính đã thay đổi

- `client/src/features/chat/components/BotAvatar.tsx`
- `client/src/features/chat/components/MessageItem.tsx`

## Tách địa chỉ local và domain production

**Ngày cập nhật**: 17/08/2026

- Tạo `client/src/infra/serverUrl.ts` làm nguồn URL duy nhất. Vite development dùng Server local, còn bản build production tự dùng `https://chat.atmin.io.vn`.
- Loại bỏ URL localhost viết trực tiếp khỏi Axios và hook WebSocket; REST API và SockJS cùng lấy địa chỉ từ cấu hình chung.
- Tách cấu hình Spring thành profile `local` và `cloud`: local giữ MySQL/CORS trên máy, cloud yêu cầu MySQL Railway và chỉ chấp nhận domain thật.
- Server đọc cổng động `PORT` của Railway và vẫn mặc định cổng 8080 khi chạy local.
- Bổ sung biến mẫu cho profile, MySQL Railway và JWT trong `.env.example`.
- Tạo `deploy.md` bằng tiếng Việt, ghi đầy đủ bảng địa chỉ, cách đổi profile, biến Railway và cách quay lại chạy local.

## Hoàn thiện gói deploy Railway cho người mới

**Ngày cập nhật**: 17/08/2026

- Thêm Dockerfile nhiều giai đoạn tại thư mục gốc: Node build React, Gradle build Spring Boot và Java 21 JRE chạy ứng dụng bằng tài khoản không có quyền root.
- Đóng gói giao diện React vào static resources của Spring Boot để toàn bộ giao diện, REST API và WebSocket dùng chung `chat.atmin.io.vn`.
- Thêm `.dockerignore` và loại dự án Holiday khỏi Git để tránh gửi mã tham khảo, `.env`, dependency và file build lên Railway.
- Cho phép các tài nguyên giao diện truy cập công khai qua Spring Security; API nghiệp vụ vẫn yêu cầu JWT như trước.
- Tạo `/health` công khai để Railway kiểm tra ứng dụng còn hoạt động.
- Tách cấu hình refresh cookie theo môi trường: local không Secure, production HTTPS bắt buộc Secure; loại bỏ ba đoạn tạo cookie trùng lặp trong AuthController.
- Mở rộng `deploy.md` để giải thích các file Railway sử dụng và nhắc không cấu hình sai Root Directory.
- Tô nổi bật `@CloseFriend` trong nội dung tin nhắn: màu xanh Messenger trên bong bóng sáng và màu xanh nhạt tương phản trên bong bóng xanh của người gửi.

## Chuẩn bị deploy miễn phí bằng Render và Supabase

**Ngày cập nhật**: 17/08/2026

- Giữ MySQL cho profile `local` để cách chạy trên máy không thay đổi.
- Thêm PostgreSQL JDBC Driver cho profile `cloud` kết nối Supabase.
- Bỏ cấu hình ép Hibernate dùng MySQL; Hibernate tự nhận đúng hệ quản trị theo datasource của từng môi trường.
- Cấu hình Hikari pool tối đa 5 kết nối để phù hợp giới hạn dự án Supabase Free.
- Cập nhật `.env.example` và `deploy.md` sang Render + Supabase Session pooler IPv4, không cần IPv4 add-on trả phí.
- Giữ mô hình một Docker container chạy chung React, Spring Boot và WebSocket để người mới không phải tách Netlify.

## Sửa Render Live nhưng trả về Not Found

**Ngày cập nhật**: 18/08/2026

- Xác nhận Render trả header `x-render-routing=no-server`, cho thấy container không còn phục vụ phía sau route dù deploy từng báo Live.
- Giới hạn Java ở heap 256 MB, Serial GC, metaspace 128 MB, code cache 48 MB và một CPU để vừa gói Render Free 512 MB.
- Giảm Tomcat còn tối đa 20 request threads và 100 kết nối cho quy mô chat demo.
- Buộc Docker kiểm tra `dist/index.html` trước khi build và kiểm tra lại `index.html` đã nằm trong Spring Boot JAR; build sẽ thất bại sớm thay vì deploy một ứng dụng thiếu giao diện.
- Thêm route `/` chuyển tiếp rõ ràng đến `/index.html` để Spring Boot luôn trả giao diện React.

## Không phụ thuộc domain production trong mã Client

**Ngày cập nhật**: 18/08/2026

- Loại bỏ địa chỉ `https://chat.atmin.io.vn` bị hardcode trong bản build React.
- Production tự lấy `window.location.origin`, nên link Render gọi REST/WebSocket trên Render và domain chính thức tự gọi cùng domain sau khi DNS hoạt động.
- Vẫn hỗ trợ `VITE_SERVER_ORIGIN` khi cần ghi đè và chuẩn hóa dấu `/` cuối để tránh URL bị lặp dấu gạch chéo.
- Cho phép origin Render tạm trong cấu hình cloud để WebSocket hoạt động trước khi Nhân Hòa xử lý xong DNS.
- Sửa chính xác hostname Render thành `chat-real-time-ujhj.onrender.com` để bắt tay WebSocket không bị CORS từ chối.

## Sửa đăng nhập production và gợi ý tài khoản

**Ngày cập nhật**: 18/08/2026

- Chuẩn hóa mọi `JWT_SECRET_KEY` thành khóa SHA-256 đủ 256 bit, không còn yêu cầu chuỗi do Render tạo phải đúng định dạng Base64.
- Đăng nhập sai trả HTTP 401 với thông báo rõ ràng thay vì bị chuyển thành HTTP 500.
- Không gọi `/auth/refresh` ở lần mở đầu khi trình duyệt chưa từng có phiên đăng nhập, loại bỏ lỗi 401 gây nhiễu trong Console.
- Lưu một cờ phiên không nhạy cảm; token và refresh token vẫn không được ghi vào localStorage.
- Giữ input đăng nhập hoàn toàn sạch: không placeholder, không tài khoản/mật khẩu mẫu và tắt autocomplete để giao diện không làm lộ hoặc gợi ý thông tin đăng nhập.

## Cải thiện thanh nhập khi bàn phím điện thoại mở

**Ngày cập nhật**: 18/08/2026

- Đồng bộ chiều cao ứng dụng với vùng màn hình thực sự còn nhìn thấy bằng Visual Viewport API, giúp thanh nhập luôn nằm phía trên bàn phím ảo.
- Theo dõi thay đổi kích thước, vị trí viewport và xoay màn hình để bố cục tự co giãn trên Android và iOS.
- Tự đưa cuối cuộc trò chuyện vào vùng nhìn thấy khi người dùng chạm vào ô nhập.
- Vẫn giữ khoảng đệm safe-area cho thiết bị có thanh Home hoặc tai thỏ.
- Khai báo `interactive-widget=resizes-content`, tắt chế độ Virtual Keyboard phủ nội dung trên trình duyệt hỗ trợ và đồng bộ viewport nhiều nhịp khi input focus/blur.
- Đưa thanh soạn tin lên lớp hiển thị riêng và bỏ phần safe-area dư khi bàn phím đang mở, giúp người dùng luôn nhìn thấy nội dung đang nhập.

## Sửa lỗi phản hồi bảo mật với kiểu ngày giờ Java

**Ngày cập nhật**: 18/08/2026

- Cấu hình `ObjectMapper` tự đăng ký các module chuẩn thay vì tạo bộ chuyển JSON rỗng và chuẩn hóa ngày giờ sang chuỗi ISO-8601 dễ đọc.
- Bổ sung module JSR-310 để phản hồi 401/403 có `LocalDateTime` được chuyển thành JSON hợp lệ, không còn phát sinh lỗi 500 trong `SecurityConfig`.
- Thêm kiểm thử hồi quy xác nhận `LocalDateTime` luôn được serialize thành công.

## Gia cố reply, tạo phòng riêng và tìm kiếm người dùng

**Ngày cập nhật**: 18/08/2026

- Giữ thống nhất cú pháp gọi bot `@CloseFriend` trên Client và Server.
- Trả lỗi rõ ràng khi tin nhắn gốc không tồn tại hoặc thuộc một phòng chat khác, không còn âm thầm bỏ qua reply.
- Khóa bi quan hai người dùng theo thứ tự ID cố định trước khi tìm hoặc tạo phòng riêng, ngăn hai yêu cầu đồng thời tạo hai phòng 1–1 trùng nhau.
- Giới hạn tìm kiếm tối đa 20 tài khoản đang hoạt động, loại tài khoản hiện tại ngay tại truy vấn database và sắp xếp theo username.
- Thay kiểu `any` của kết quả tìm kiếm Client bằng interface `SearchUser` và xử lý lỗi Axios an toàn.
- Bổ sung kiểm thử hồi quy cho reply xuyên phòng và thứ tự khóa khi tạo phòng riêng.

## Sửa trạng thái người đang online bị hiển thị ngoại tuyến

**Ngày cập nhật**: 17/08/2026

- Xác định Client trước đây chỉ nhận sự kiện presence phát sinh sau thời điểm đăng ký, nên có thể bỏ lỡ trạng thái của người đã online từ trước.
- Bổ sung lệnh WebSocket `/app/presence.sync`. Ngay sau khi subscribe `/topic/presence`, Client yêu cầu Server phát lại ảnh chụp toàn bộ session đang hoạt động.
- Khi một tài khoản kết nối lại, Server luôn xác nhận trạng thái online cho session đầu tiên thay vì phụ thuộc trạng thái của lịch offline cũ.
- Trước khi phát offline sau thời gian chờ 5 giây, Server kiểm tra lại danh sách session; nếu người dùng đã kết nối lại thì bỏ qua sự kiện offline cũ.
- Tách `broadcastStatus` để mọi sự kiện online, offline và đồng bộ ban đầu dùng chung một định dạng dữ liệu.

### Tệp chính đã thay đổi

- `client/src/features/chat/hooks/useChatWebSocket.ts`
- `server/src/main/java/atmin/modules/chat/controller/WebSocketChatController.java`
- `server/src/main/java/atmin/modules/chat/presence/PresenceManager.java`

## Phân biệt rõ tin nhắn đã xem và chưa xem

**Ngày cập nhật**: 17/08/2026

- Hiển thị trạng thái thường trực dưới tin nhắn cuối cùng do tài khoản hiện tại gửi, thay vì giấu chung với thời gian.
- Tin chưa được đọc hiển thị dấu check viền xám và nhãn `Chưa xem`.
- Tin đã được đọc hiển thị avatar nhỏ của người nhận và nhãn xanh `Đã xem`, theo cách thể hiện quen thuộc của Messenger.
- Chỉ hiển thị biên nhận ở tin gửi gần nhất để giao diện không lặp và không gây rối; thời gian vẫn chỉ xuất hiện khi hover hoặc focus/chạm.

### Tệp chính đã thay đổi

- `client/src/features/chat/components/ChatBox.tsx`
- `client/src/features/chat/components/MessageItem.tsx`
- `client/src/features/chat/components/ChatBox.tsx`
- `client/src/features/chat/components/ConversationList.tsx`
- `client/src/features/chat/index.ts`
- `client/src/features/auth/components/Login.tsx`
- `client/src/features/profile/components/ProfileModal.tsx`
- `client/src/App.tsx`
- `client/src/index.css`

## Gửi ảnh trong phòng chat và lưu trên Cloudinary

**Ngày cập nhật**: 18/08/2026

- Thêm nút chọn ảnh ngay cạnh ô nhập tin nhắn, có trạng thái đang tải và hoạt động trên cả desktop lẫn mobile.
- Chỉ nhận ảnh PNG, JPG/JPEG hợp lệ, dung lượng tối đa 5 MB và kích thước tối đa 4096 × 4096 pixel.
- Server kiểm tra người gửi thuộc phòng chat trước khi tải ảnh lên Cloudinary.
- Ảnh tin nhắn được lưu riêng trong `chat-realtime/messages/{conversationId}` và mỗi ảnh có mã duy nhất để không ghi đè lên nhau.
- Sau khi tải thành công, Server lưu tin nhắn loại `IMAGE` vào database và phát realtime cho các thành viên trong phòng.
- Ảnh được hiển thị gọn trong bong bóng chat, có thể bấm để mở ảnh đầy đủ ở tab mới và vẫn hỗ trợ reply.

### Cấu hình môi trường cần có

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Kết quả kiểm tra

- Client TypeScript biên dịch thành công và lint sạch.
- Vite tạo bản dựng production thành công trong thư mục kiểm tra độc lập.
- Toàn bộ test backend thành công, bao gồm test lưu và phát realtime tin nhắn ảnh.

### Kết quả kiểm tra

- Client lint sạch và TypeScript biên dịch thành công.
- Vite tạo bản dựng production thành công.
- Kiểm tra trực quan ở desktop và viewport mobile 390 × 844: giao diện không tràn ngang, nội dung vừa đúng chiều cao màn hình và biểu tượng robot hiển thị sắc nét.

## Thu gọn tin nhắn, chống tràn và bổ sung gợi ý @CloseFriend

**Ngày cập nhật**: 17/08/2026

- Thu nhỏ avatar cạnh tin nhắn, padding, cỡ chữ, bo góc và giới hạn chiều rộng bong bóng để cuộc trò chuyện thoáng, cân đối hơn.
- Di chuyển thời gian và trạng thái gửi ra ngoài bong bóng; mặc định được ẩn, chỉ xuất hiện khi rê chuột hoặc focus/chạm vào tin nhắn trên thiết bị cảm ứng.
- Bổ sung bảng gợi ý khi người dùng gõ `@`, `@c`, `@cl`... tương tự Messenger/Zalo. Có thể chọn CloseFriend AI bằng chuột, chạm, phím Enter hoặc Tab và đóng bằng Escape.
- Tách nghiệp vụ mention vào `useBotMention.ts` và phần hiển thị vào `MentionSuggestions.tsx`, giữ `ChatBox` tập trung vào bố cục và sự kiện giao diện.
- Bổ sung giới hạn chiều rộng, `min-width: 0`, chống tràn ngang và ngắt chuỗi dài tại App, phòng chat, vùng tin nhắn và nội dung từng bong bóng.
- Thu gọn thanh nhập và nút robot/nút gửi nhưng vẫn giữ vùng thao tác phù hợp trên mobile.
- Loại bỏ thẻ hướng dẫn bot khỏi danh sách trò chuyện bên trái; gợi ý CloseFriend AI chỉ xuất hiện theo ngữ cảnh khi người dùng gõ `@` trong ô nhập.
- Gom các tin nhắn liên tiếp theo người gửi và chỉ hiển thị avatar tại tin cuối của mỗi cụm. Các tin cùng người được đặt gần nhau, vẫn giữ khoảng trống căn hàng để bong bóng không bị lệch; avatar xuất hiện lại khi đổi người gửi hoặc bot phản hồi.

## Chuyển giao diện chat sang phong cách Messenger

**Ngày cập nhật**: 17/08/2026

- Thay giao diện glassmorphism và nền gradient bằng bố cục trắng sạch, đường phân cách mảnh và màu xanh `#0084ff` đặc trưng của ứng dụng nhắn tin hiện đại.
- Thiết kế lại thanh bên thành khu vực `Đoạn chat`, bổ sung ô tìm kiếm người trò chuyện hoạt động thực tế và trạng thái đang hoạt động theo phong cách Messenger.
- Chuyển bong bóng của người gửi sang màu xanh, người nhận sang xám nhạt và bot sang xanh nhạt; loại bỏ bóng đổ nặng để các cụm tin nhắn gọn và dễ đọc hơn.
- Làm lại header phòng chat, màn hình trống, thanh nhập dạng pill, nút bot và nút gửi theo cùng hệ màu xanh.
- Đồng bộ avatar robot thành hình tròn xanh, vẫn giữ robot làm nhận diện riêng nhưng hòa hợp với giao diện Messenger.
- Làm mới màn hình đăng nhập bằng nền xám nhạt, thẻ trắng, input viền đơn giản và nút xanh; giữ đầy đủ responsive mobile và safe-area.

### Tệp chính đã thay đổi

- `client/src/App.tsx`
- `client/src/features/auth/components/Login.tsx`
- `client/src/features/chat/components/BotAvatar.tsx`
- `client/src/features/chat/components/ChatBox.tsx`
- `client/src/features/chat/components/ConversationList.tsx`
- `client/src/features/chat/components/MentionSuggestions.tsx`
- `client/src/features/chat/components/MessageItem.tsx`

### Tệp chính đã thay đổi

- `client/src/features/chat/hooks/useBotMention.ts`
- `client/src/features/chat/components/MentionSuggestions.tsx`
- `client/src/features/chat/components/ChatBox.tsx`
- `client/src/features/chat/components/MessageItem.tsx`
- `client/src/App.tsx`
- `client/src/index.css`
