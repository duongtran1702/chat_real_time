# Nháº­t KÃ½ Cáº­p Nháº­t - Dá»± Ãn Chat Real-Time AI (@CloseFriend)

**NgÃ y cáº­p nháº­t**: 19/08/2026

---

## Cập nhật 20/08/2026 - Sửa lỗi hiển thị Typing Indicator

### Tổng quan
Khắc phục lỗi không hiển thị Typing Indicator khi người dùng gõ tin nhắn liên tục. Trước đó, cơ chế debounce (500ms) đã khiến sự kiện chat.typing liên tục bị huỷ (clearTimeout) nếu người dùng gõ phím quá nhanh mà không tạm nghỉ. Giải pháp là chuyển đổi logic debounce thành throttle (gửi ngay lập tức ở lần gõ đầu tiên và giãn cách tối đa 2 giây giữa các lần gửi nếu tiếp tục gõ) để đảm bảo trạng thái "đang nhập" được đồng bộ realtime chính xác.

### Các file đã thay đổi

#### 1. [MODIFY] client/src/features/chat/hooks/useTypingIndicator.ts
- Bỏ logic setTimeout debounce 500ms.
- Sửa hàm emitTyping để gửi payload qua WebSocket ngay lập tức.
- Giữ lại cơ chế throttle (kiểm tra Date.now() - lastSentRef.current < 2000) để giảm tải cho server nhưng vẫn đảm bảo hiển thị typing mượt mà.

## Cáº­p nháº­t 19/08/2026 â€” NÃ¢ng Cáº¥p Spring AI: ChatMemory, Advisor, ChatOptions & @Tool Nghiá»‡p Vá»¥

### Tá»•ng quan
NÃ¢ng cáº¥p toÃ n bá»™ tÃ­ch há»£p Spring AI cho bot @CloseFriend, Ä‘Ã¡p á»©ng Ä‘áº§y Ä‘á»§ 4 má»¥c tiÃªu kiáº¿n thá»©c: ChatClient cáº¥u hÃ¬nh chuáº©n, ChatMemory vá»›i Advisor, ChatOptions báº±ng code, vÃ  @Tool function calling nghiá»‡p vá»¥.

### CÃ¡c file Ä‘Ã£ sá»­a Ä‘á»•i / táº¡o má»›i

#### 1. `[NEW] CloseFriendAiConfig.java` â€” Cáº¥u hÃ¬nh AI táº­p trung
- **ChatMemory Bean**: Sá»­ dá»¥ng `MessageWindowChatMemory` vá»›i `maxMessages(20)` (sliding window).
  - **Local**: DÃ¹ng `InMemoryChatMemoryRepository` (máº·c Ä‘á»‹nh, máº¥t khi restart).
  - **Cloud**: DÃ¹ng `JdbcChatMemoryRepository` (lÆ°u vÃ o PostgreSQL/Supabase, bá»n vá»¯ng).
- **ChatClient Bean**: Cáº¥u hÃ¬nh Ä‘áº§y Ä‘á»§ 4 thÃ nh pháº§n:
  - `.defaultSystem(SYSTEM_PROMPT)` â€” System prompt Ä‘á»‹nh hÃ¬nh vai trÃ².
  - `.defaultOptions(OpenAiChatOptions.builder().model().temperature().maxTokens())` â€” ChatOptions báº±ng code.
  - `.defaultAdvisors(MessageChatMemoryAdvisor)` â€” Advisor tá»± Ä‘á»™ng ghi nhá»› lá»‹ch sá»­ há»™i thoáº¡i.
  - `.defaultTools(closeFriendTools)` â€” Tool máº·c Ä‘á»‹nh cho LLM tá»± gá»i.

#### 2. `[MODIFY] CloseFriendAiService.java` â€” Refactor AI Service
- **Inject `ChatClient` thay vÃ¬ `ChatClient.Builder`** â€” dÃ¹ng bean Ä‘Ã£ cáº¥u hÃ¬nh sáºµn.
- **XÃ³a `buildPrompt()` method** â€” khÃ´ng cáº§n tá»± query DB 20 tin nháº¯n ná»¯a, `MessageChatMemoryAdvisor` tá»± xá»­ lÃ½.
- **XÃ³a constant `SYSTEM_PROMPT`** â€” Ä‘Ã£ chuyá»ƒn sang `CloseFriendAiConfig`.
- **Truyá»n `conversationId` qua advisor params** â€” `ChatMemory.CONVERSATION_ID` Ä‘á»ƒ cÃ´ láº­p memory tá»«ng cuá»™c há»™i thoáº¡i.

#### 3. `[MODIFY] CloseFriendTools.java` â€” Má»Ÿ rá»™ng @Tool nghiá»‡p vá»¥
- **Giá»¯ nguyÃªn**: `getVietnamCurrentTime()` â€” láº¥y giá» hiá»‡n táº¡i.
- **ThÃªm má»›i**: `getRecentChatSummary(conversationId)` â€” láº¥y 30 tin nháº¯n gáº§n nháº¥t Ä‘á»ƒ LLM tÃ³m táº¯t cuá»™c trÃ² chuyá»‡n.
- **ThÃªm má»›i**: `searchMessages(conversationId, keyword)` â€” tÃ¬m kiáº¿m tin nháº¯n theo tá»« khÃ³a trong lá»‹ch sá»­ chat.
- Sá»­ dá»¥ng `@ToolParam` mÃ´ táº£ chi tiáº¿t tá»«ng tham sá»‘.

#### 4. `[MODIFY] MessageRepository.java` â€” ThÃªm query method
- `findRecentMessages(conversationId, Pageable)` â€” láº¥y tin nháº¯n gáº§n nháº¥t (dÃ¹ng cho tool tÃ³m táº¯t).
- `searchByKeyword(conversationId, keyword, Pageable)` â€” tÃ¬m tin nháº¯n chá»©a tá»« khÃ³a (dÃ¹ng cho tool tra cá»©u).

#### 5. `[MODIFY] build.gradle` â€” ThÃªm dependency
- `spring-ai-starter-model-chat-memory-repository-jdbc` â€” há»— trá»£ JDBC ChatMemory cho cloud.

#### 6. `[MODIFY] application-local.yml` â€” Cáº¥u hÃ¬nh local
- `spring.ai.chat.memory.repository.jdbc.initialize-schema: never` â€” local khÃ´ng cáº§n táº¡o báº£ng JDBC.

#### 7. `[MODIFY] application-cloud.yml` â€” Cáº¥u hÃ¬nh cloud
- `spring.ai.chat.memory.repository.jdbc.initialize-schema: always` â€” cloud tá»± táº¡o báº£ng `SPRING_AI_CHAT_MEMORY`.

---

## Cập nhật 20/08/2026 - Sửa lỗi hiển thị Typing Indicator

### Tổng quan
Khắc phục lỗi không hiển thị Typing Indicator khi người dùng gõ tin nhắn liên tục. Trước đó, cơ chế debounce (500ms) đã khiến sự kiện chat.typing liên tục bị huỷ (clearTimeout) nếu người dùng gõ phím quá nhanh mà không tạm nghỉ. Giải pháp là chuyển đổi logic debounce thành throttle (gửi ngay lập tức ở lần gõ đầu tiên và giãn cách tối đa 2 giây giữa các lần gửi nếu tiếp tục gõ) để đảm bảo trạng thái "đang nhập" được đồng bộ realtime chính xác.

### Các file đã thay đổi

#### 1. [MODIFY] client/src/features/chat/hooks/useTypingIndicator.ts
- Bỏ logic setTimeout debounce 500ms.
- Sửa hàm emitTyping để gửi payload qua WebSocket ngay lập tức.
- Giữ lại cơ chế throttle (kiểm tra Date.now() - lastSentRef.current < 2000) để giảm tải cho server nhưng vẫn đảm bảo hiển thị typing mượt mà.

## Cáº­p nháº­t 18/08/2026 â€” Äá»•i tÃªn á»©ng dá»¥ng thÃ nh "Chat Together"

### Tá»•ng quan
Cáº­p nháº­t toÃ n diá»‡n tÃªn nháº­n diá»‡n thÆ°Æ¡ng hiá»‡u cá»§a á»©ng dá»¥ng tá»« "CloseFriend Chat" sang "Chat Together" trÃªn cáº£ Client vÃ  Server.

### Chi tiáº¿t thay Ä‘á»•i
1. **Giao diá»‡n Client:**
   - Thay Ä‘á»•i cÃ¡c tiÃªu Ä‘á» vÃ  tháº» text trÃªn á»©ng dá»¥ng (`App.tsx`, `Login.tsx`, `Register.tsx`, `ConversationList.tsx`, `index.html`) thÃ nh "Chat Together".
   - Äá»•i tÃªn bot AI nháº­n diá»‡n tá»« "CloseFriend AI" sang "Chat Together AI" (`BotAvatar.tsx`, `ChatBox.tsx`, `MentionSuggestions.tsx`, `MessageItem.tsx`).
2. **CÃº phÃ¡p gá»i Bot (Client & Server):**
   - Giá»¯ cÃº phÃ¡p Ä‘á» cáº­p bot lÃ  `@CloseFriend` trÃªn cáº£ Client vÃ  Server Ä‘á»ƒ ngÆ°á»i dÃ¹ng tiáº¿p tá»¥c dÃ¹ng lá»‡nh quen thuá»™c.

### Káº¿t quáº£ kiá»ƒm tra
- âœ… á»¨ng dá»¥ng Ä‘Ã£ Ä‘Æ°á»£c thá»‘ng nháº¥t tÃªn gá»i "Chat Together".
- âœ… TypeScript type check: `tsc --noEmit` pass (exit code 0).
- âœ… Server build: `gradlew build -x test` â€” BUILD SUCCESSFUL.

---

## Cập nhật 20/08/2026 - Sửa lỗi hiển thị Typing Indicator

### Tổng quan
Khắc phục lỗi không hiển thị Typing Indicator khi người dùng gõ tin nhắn liên tục. Trước đó, cơ chế debounce (500ms) đã khiến sự kiện chat.typing liên tục bị huỷ (clearTimeout) nếu người dùng gõ phím quá nhanh mà không tạm nghỉ. Giải pháp là chuyển đổi logic debounce thành throttle (gửi ngay lập tức ở lần gõ đầu tiên và giãn cách tối đa 2 giây giữa các lần gửi nếu tiếp tục gõ) để đảm bảo trạng thái "đang nhập" được đồng bộ realtime chính xác.

### Các file đã thay đổi

#### 1. [MODIFY] client/src/features/chat/hooks/useTypingIndicator.ts
- Bỏ logic setTimeout debounce 500ms.
- Sửa hàm emitTyping để gửi payload qua WebSocket ngay lập tức.
- Giữ lại cơ chế throttle (kiểm tra Date.now() - lastSentRef.current < 2000) để giảm tải cho server nhưng vẫn đảm bảo hiển thị typing mượt mà.

## Cáº­p nháº­t 18/08/2026 â€” TÃ­nh nÄƒng ÄÄƒng kÃ½ tÃ i khoáº£n vÃ  TÃ¬m kiáº¿m báº¡n bÃ¨

### Tá»•ng quan
HoÃ n thiá»‡n chá»©c nÄƒng Ä‘á»ƒ ngÆ°á»i dÃ¹ng cÃ³ thá»ƒ tá»± Ä‘Äƒng kÃ½ tÃ i khoáº£n má»›i vÃ  tÃ¬m kiáº¿m/káº¿t báº¡n vá»›i ngÆ°á»i dÃ¹ng khÃ¡c thÃ´ng qua tÃ­nh nÄƒng Search thay vÃ¬ sá»­ dá»¥ng tÃ i khoáº£n demo.

### Chi tiáº¿t thay Ä‘á»•i

#### 1. API ÄÄƒng kÃ½ (Server)
- ThÃªm `RegisterRequest` DTO vá»›i validation (TÃ i khoáº£n >= 5 kÃ½ tá»±, Máº­t kháº©u >= 6 kÃ½ tá»±).
- `AuthService`: Kiá»ƒm tra trÃ¹ng láº·p `username`, máº­t kháº©u xÃ¡c nháº­n pháº£i khá»›p. Táº¡o tÃ i khoáº£n vá»›i tráº¡ng thÃ¡i `ACTIVE` máº·c Ä‘á»‹nh vÃ  mÃ£ hÃ³a máº­t kháº©u báº±ng `BCrypt`.
- `AuthController`: Má»Ÿ endpoint `POST /api/v1/auth/register`.

#### 2. TÃ­nh nÄƒng TÃ¬m kiáº¿m báº¡n bÃ¨ (Client & Server)
- **Server:** Bá»• sung `findByUsernameContainingIgnoreCase` trong `UserRepository`. ThÃªm endpoint `GET /api/v1/users/search?username={q}` trong `UserProfileController` giÃºp tÃ¬m kiáº¿m tÆ°Æ¡ng Ä‘á»‘i user (loáº¡i bá» chÃ­nh mÃ¬nh vÃ  user bá»‹ khÃ³a).
- **Client:** Bá»• sung thanh Search trong `ConversationList.tsx` vá»›i ká»¹ thuáº­t debounce (500ms) Ä‘á»ƒ khÃ´ng spam API. Káº¿t quáº£ tÃ¬m kiáº¿m hiá»ƒn thá»‹ dáº¡ng danh sÃ¡ch ngÆ°á»i dÃ¹ng thay tháº¿ cho danh sÃ¡ch phÃ²ng chat hiá»‡n táº¡i.

#### 3. Táº¡o phÃ²ng chat 1-1 (Server & Client)
- **Server:** ThÃªm custom query `findPrivateConversationBetweenUsers` trong `ConversationRepository` Ä‘á»ƒ kiá»ƒm tra 2 ngÆ°á»i Ä‘Ã£ tá»«ng chat chÆ°a. ThÃªm endpoint `POST /api/v1/chat/conversations/user/{targetUserId}` trong `ChatController` Ä‘á»ƒ tá»± Ä‘á»™ng khá»Ÿi táº¡o hoáº·c tráº£ vá» phÃ²ng chat hiá»‡n há»¯u.
- **Client:** TÃ­ch há»£p gá»i API táº¡o phÃ²ng chat khi user click vÃ o má»™t ngÆ°á»i trong káº¿t quáº£ tÃ¬m kiáº¿m, sau Ä‘Ã³ refetch danh sÃ¡ch cuá»™c trÃ² chuyá»‡n vÃ  tá»± Ä‘á»™ng select phÃ²ng chat vá»«a Ä‘Æ°á»£c khá»Ÿi táº¡o.

#### 4. Giao diá»‡n ÄÄƒng kÃ½ (Client)
- Táº¡o component `Register.tsx` sá»­ dá»¥ng phong cÃ¡ch Glassmorphism Ä‘á»“ng nháº¥t vá»›i trang `Login`.
- Há»— trá»£ hiá»ƒn thá»‹ lá»—i *inline validation* vá»›i text mÃ u Ä‘á» nháº¡t ngay dÆ°á»›i tá»«ng Ã´ input (thay vÃ¬ chá»‰ dÃ¹ng Toast) theo yÃªu cáº§u UX kháº¯t khe.
- Cáº­p nháº­t `App.tsx` há»— trá»£ chuyá»ƒn Ä‘á»•i mÆ°á»£t mÃ  giá»¯a mÃ n hÃ¬nh ÄÄƒng nháº­p vÃ  ÄÄƒng kÃ½.

### Káº¿t quáº£ kiá»ƒm tra
- âœ… API validation báº¯t chÃ­nh xÃ¡c cÃ¡c rule: tÃ i khoáº£n >= 5 kÃ½ tá»±, máº­t kháº©u >= 6 kÃ½ tá»±, trÃ¹ng username.
- âœ… Client tá»± Ä‘á»™ng debounce search API, khÃ´ng gÃ¢y lá»—i memory/leak.
- âœ… TypeScript type check: `tsc --noEmit` pass (exit code 0).
- âœ… Server build: `gradlew build -x test` â€” BUILD SUCCESSFUL.

---

## Cập nhật 20/08/2026 - Sửa lỗi hiển thị Typing Indicator

### Tổng quan
Khắc phục lỗi không hiển thị Typing Indicator khi người dùng gõ tin nhắn liên tục. Trước đó, cơ chế debounce (500ms) đã khiến sự kiện chat.typing liên tục bị huỷ (clearTimeout) nếu người dùng gõ phím quá nhanh mà không tạm nghỉ. Giải pháp là chuyển đổi logic debounce thành throttle (gửi ngay lập tức ở lần gõ đầu tiên và giãn cách tối đa 2 giây giữa các lần gửi nếu tiếp tục gõ) để đảm bảo trạng thái "đang nhập" được đồng bộ realtime chính xác.

### Các file đã thay đổi

#### 1. [MODIFY] client/src/features/chat/hooks/useTypingIndicator.ts
- Bỏ logic setTimeout debounce 500ms.
- Sửa hàm emitTyping để gửi payload qua WebSocket ngay lập tức.
- Giữ lại cơ chế throttle (kiểm tra Date.now() - lastSentRef.current < 2000) để giảm tải cho server nhưng vẫn đảm bảo hiển thị typing mượt mà.

## Cáº­p nháº­t 18/08/2026 â€” TÃ­nh nÄƒng má»›i: Typing Indicator + Reply Message

### Tá»•ng quan
ThÃªm 2 tÃ­nh nÄƒng UX quan trá»ng cho CloseFriend Chat:
1. **Typing Indicator** â€” hiá»ƒn thá»‹ "TÃªn Ä‘ang nháº­p..." real-time khi ngÆ°á»i khÃ¡c Ä‘ang gÃµ tin nháº¯n.
2. **Reply Message** â€” tráº£ lá»i (reply) má»™t tin nháº¯n cá»¥ thá»ƒ, hiá»ƒn thá»‹ quote block vÃ  scroll tá»›i tin gá»‘c.

### Chi tiáº¿t thay Ä‘á»•i

#### Feature 1: Typing Indicator

**Server:**
- [`WebSocketChatController.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/controller/WebSocketChatController.java) â€” ThÃªm endpoint `@MessageMapping("/chat.typing")`. Nháº­n payload `{ conversationId }`, kiá»ƒm tra quyá»n thÃ nh viÃªn, láº¥y fullName tá»« DB vÃ  broadcast tá»›i `/topic/conversation/{id}/typing`. Fire-and-forget, khÃ´ng lÆ°u DB.
- [`ChatSubscriptionSecurityConfig.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/core/security/ChatSubscriptionSecurityConfig.java) â€” Cho phÃ©p subscribe vÃ o `/topic/conversation/{id}/typing` (strip `/typing` suffix khi kiá»ƒm tra quyá»n, cÃ¹ng logic vá»›i `/read`).

**Client:**
- [NEW] [`useTypingIndicator.ts`](file:///d:/ChatRealTime/client/src/features/chat/hooks/useTypingIndicator.ts) â€” Hook quáº£n lÃ½ gá»­i (debounce 500ms + throttle 2s) vÃ  nháº­n typing events. Tá»± áº©n sau 3s, bá» qua typing cá»§a chÃ­nh mÃ¬nh, cleanup khi chuyá»ƒn conversation.
- [NEW] [`TypingIndicator.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/TypingIndicator.tsx) â€” Component hiá»ƒn thá»‹ "TÃªn Ä‘ang nháº­p" + 3 cháº¥m bounce animation. Há»— trá»£ hiá»ƒn thá»‹ 1, 2 hoáº·c nhiá»u ngÆ°á»i Ä‘á»“ng thá»i.
- [`ChatBox.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/ChatBox.tsx) â€” TÃ­ch há»£p `useTypingIndicator`, gá»i `emitTyping()` khi user gÃµ phÃ­m, render `<TypingIndicator>` phÃ­a trÃªn `messagesEndRef`.
- [`useChatWebSocket.ts`](file:///d:/ChatRealTime/client/src/features/chat/hooks/useChatWebSocket.ts) â€” Expose `stompClient` Ä‘á»ƒ hook typing dÃ¹ng chung káº¿t ná»‘i.
- [`index.css`](file:///d:/ChatRealTime/client/src/index.css) â€” ThÃªm CSS cho `.typing-indicator-*`, keyframes `typingBounce`.

#### Feature 2: Reply Message

**Server:**
- [`Message.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/entity/Message.java) â€” ThÃªm `@ManyToOne` self-referencing field `replyToMessage` â†’ cá»™t `reply_to_message_id` (nullable) trong báº£ng `messages`.
- [`MessageRequest.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/dto/MessageRequest.java) â€” ThÃªm field optional `replyToMessageId`.
- [`MessageResponse.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/dto/MessageResponse.java) â€” ThÃªm nested DTO `RepliedMessageSummary` (id, senderId, content cáº¯t ngáº¯n 100 kÃ½ tá»±). Cáº­p nháº­t `fromEntity()`.
- [`ChatServiceImpl.java`](file:///d:/ChatRealTime/server/src/main/java/atmin/modules/chat/service/impl/ChatServiceImpl.java) â€” Khi cÃ³ `replyToMessageId`: tÃ¬m message gá»‘c, validate cÃ¹ng conversation (chá»‘ng reply xuyÃªn phÃ²ng), gÃ¡n vÃ o entity trÆ°á»›c khi save.

**Client:**
- [`useChatStore.ts`](file:///d:/ChatRealTime/client/src/features/chat/store/useChatStore.ts) â€” ThÃªm interface `RepliedMessageSummary`, má»Ÿ rá»™ng `Message` vá»›i field `repliedMessage`. ThÃªm state `replyingTo` + actions `setReplyingTo()`, `clearReplyingTo()`. Tá»± clear reply khi chuyá»ƒn conversation.
- [`useChatWebSocket.ts`](file:///d:/ChatRealTime/client/src/features/chat/hooks/useChatWebSocket.ts) â€” `sendMessage()` nháº­n thÃªm optional `replyTo` object. Optimistic message mang `repliedMessage` snapshot. Payload STOMP gá»­i kÃ¨m `replyToMessageId`.
- [NEW] [`ReplyPreview.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/ReplyPreview.tsx) â€” Thanh preview trÃªn input khi Ä‘ang reply, viá»n accent gradient bÃªn trÃ¡i, tÃªn sender + ná»™i dung cáº¯t ngáº¯n, nÃºt X há»§y, animation slide-down.
- [`MessageItem.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/MessageItem.tsx) â€” ThÃªm quote block render khi cÃ³ `repliedMessage` (viá»n trÃ¡i xanh, ná»n nháº¡t, click scroll tá»›i tin gá»‘c). NÃºt reply icon xuáº¥t hiá»‡n khi hover á»Ÿ bÃªn cáº¡nh message bubble. Há»— trá»£ hiá»ƒn thá»‹ tÃªn sender tá»« participants list.
- [`ChatBox.tsx`](file:///d:/ChatRealTime/client/src/features/chat/components/ChatBox.tsx) â€” TÃ­ch há»£p toÃ n bá»™ reply flow: láº¥y `replyingTo` tá»« store, render `<ReplyPreview>`, truyá»n `onReply`/`onScrollToMessage` xuá»‘ng `<MessageItem>`, gá»­i `replyPayload` khi submit.
- [`index.css`](file:///d:/ChatRealTime/client/src/index.css) â€” ThÃªm CSS cho `.reply-preview-*`, `.reply-quote-*`, `.reply-action-*`, `.message-highlight-flash`, cÃ¡c keyframes `replySlideDown` vÃ  `highlightFlash`.

### Káº¿t quáº£ kiá»ƒm tra
- âœ… TypeScript type check: `tsc --noEmit` pass (exit code 0)
- âœ… Server build: `gradlew build -x test` â€” BUILD SUCCESSFUL

---

## Cập nhật 20/08/2026 - Sửa lỗi hiển thị Typing Indicator

### Tổng quan
Khắc phục lỗi không hiển thị Typing Indicator khi người dùng gõ tin nhắn liên tục. Trước đó, cơ chế debounce (500ms) đã khiến sự kiện chat.typing liên tục bị huỷ (clearTimeout) nếu người dùng gõ phím quá nhanh mà không tạm nghỉ. Giải pháp là chuyển đổi logic debounce thành throttle (gửi ngay lập tức ở lần gõ đầu tiên và giãn cách tối đa 2 giây giữa các lần gửi nếu tiếp tục gõ) để đảm bảo trạng thái "đang nhập" được đồng bộ realtime chính xác.

### Các file đã thay đổi

#### 1. [MODIFY] client/src/features/chat/hooks/useTypingIndicator.ts
- Bỏ logic setTimeout debounce 500ms.
- Sửa hàm emitTyping để gửi payload qua WebSocket ngay lập tức.
- Giữ lại cơ chế throttle (kiểm tra Date.now() - lastSentRef.current < 2000) để giảm tải cho server nhưng vẫn đảm bảo hiển thị typing mượt mà.

## Cáº­p nháº­t 18/08/2026 â€” NÃ¢ng cáº¥p UX/UI toÃ n diá»‡n: Modern Glass Messenger

### Tá»•ng quan
NÃ¢ng cáº¥p giao diá»‡n tá»« phong cÃ¡ch "Messenger clone cÆ¡ báº£n" lÃªn **Modern Glass Messenger** â€” glassmorphism, gradient, micro-animations â€” mÃ  **khÃ´ng thay Ä‘á»•i báº¥t ká»³ logic/behavior nÃ o**.

### CÃ¡c file Ä‘Ã£ thay Ä‘á»•i

#### 1. `client/src/index.css` â€” Design System hoÃ n chá»‰nh
- ThÃªm CSS custom properties (design tokens): báº£ng mÃ u, surface, border, shadow, gradient, radius
- ThÃªm glass effect utilities: `.glass`, `.glass-elevated`, `.glass-subtle`
- ThÃªm gradient utilities: `.border-gradient-b`, `.border-gradient-r`, `.text-gradient`
- ThÃªm `.chat-bg-pattern` (dot pattern cho vÃ¹ng tin nháº¯n)
- ThÃªm `.login-bg` (animated gradient background cho trang Login)
- ThÃªm `.online-dot` (pulse animation cho tráº¡ng thÃ¡i online)
- ThÃªm animations má»›i: `float`, `fadeInUp`, `scaleIn`, `gradientShift`, `shimmer`, `blobFloat1/2`, `pulseOnline`
- Cáº£i thiá»‡n scrollbar styling

#### 2. `client/src/App.css` â€” **ÄÃƒ XÃ“A**
- File chá»©a CSS template Vite (`.hero`, `.counter`, `#center`...) hoÃ n toÃ n khÃ´ng Ä‘Æ°á»£c sá»­ dá»¥ng

#### 3. `client/src/features/auth/components/Login.tsx`
- Ná»n: animated gradient (`login-bg`) vá»›i floating blobs decorative
- Card: glass effect (`bg-white/85 backdrop-blur-xl border-white/30`)
- Input: thÃªm placeholder text, focus glow effect (`ring-4 + shadow`)
- Button: gradient accent (`from-[#0066ff] to-[#5c7cfa]`) + shadow glow

#### 4. `client/src/features/chat/components/ConversationList.tsx`
- TiÃªu Ä‘á» "Äoáº¡n chat": gradient text effect (`.text-gradient`)
- Search bar: glass effect (`bg-white/50 backdrop-blur-sm`)
- Conversation items: hover `shadow-sm` + `active:scale-[0.99]`, active state cÃ³ gradient accent bar bÃªn pháº£i
- Online dot: pulse animation (`.online-dot`)
- Empty state: icon `MessageCircle` + text tinh táº¿

#### 5. `client/src/features/chat/components/ChatBox.tsx`
- Header: `glass-elevated` backdrop-blur, border gradient nháº¹
- Message area: dot pattern background (`chat-bg-pattern`)
- Input area: `glass-elevated`, border gradient, send button gradient + shadow khi cÃ³ text
- Status text: Ä‘á»•i mÃ u theo tráº¡ng thÃ¡i (amber/emerald/slate)
- Empty state: gradient icon background + `animate-fade-in-up`

#### 6. `client/src/features/chat/components/MessageItem.tsx`
- Tin nháº¯n gá»­i Ä‘i: gradient xanh (`from-[#0066ff] to-[#4d7cff]`) + shadow tint
- Tin nháº¯n bot: gradient tÃ­m nháº¡t + border indigo tinh táº¿
- Tin nháº¯n Ä‘á»‘i phÆ°Æ¡ng: ná»n tráº¯ng + shadow + border siÃªu nháº¹
- Timestamp hover: `backdrop-blur-sm` + `bg-white/95`
- Animation: `animate-fade-in-up` thay vÃ¬ `animate-slide-up`

#### 7. `client/src/App.tsx`
- Ná»n app: gradient (`from-slate-100 via-blue-50/30 to-indigo-50/20`)
- Sidebar: `glass-subtle`, footer `glass-elevated`
- Border: gradient nháº¹ thay vÃ¬ solid `#e5e7eb`
- Empty state: `chat-bg-pattern` + `.text-gradient`
- Camera icon: gradient (`from-[#0066ff] to-[#5c7cfa]`)

#### 8. `client/src/features/chat/components/BotAvatar.tsx`
- Gradient má»Ÿ rá»™ng: thÃªm tÃ­m `#7048e8`
- Shadow: `shadow-md shadow-blue-500/20`
- Hiá»‡u á»©ng: `animate-pulse-glow`

#### 9. `client/src/features/chat/components/MentionSuggestions.tsx`
- Glass dropdown: `bg-white/90 backdrop-blur-xl`
- Bo trÃ²n: `rounded-2xl`
- Animation: `animate-scale-in`
- Hover: shadow + scale

#### 10. `client/src/features/profile/components/ProfileModal.tsx`
- Backdrop: `backdrop-blur-md` (máº¡nh hÆ¡n)
- Card: `bg-white/95 backdrop-blur-xl border-white/50`
- Animation: `animate-scale-in` khi má»Ÿ
- Button gradient nháº¥t quÃ¡n
- Focus glow cho input

---

## Cập nhật 20/08/2026 - Sửa lỗi hiển thị Typing Indicator

### Tổng quan
Khắc phục lỗi không hiển thị Typing Indicator khi người dùng gõ tin nhắn liên tục. Trước đó, cơ chế debounce (500ms) đã khiến sự kiện chat.typing liên tục bị huỷ (clearTimeout) nếu người dùng gõ phím quá nhanh mà không tạm nghỉ. Giải pháp là chuyển đổi logic debounce thành throttle (gửi ngay lập tức ở lần gõ đầu tiên và giãn cách tối đa 2 giây giữa các lần gửi nếu tiếp tục gõ) để đảm bảo trạng thái "đang nhập" được đồng bộ realtime chính xác.

### Các file đã thay đổi

#### 1. [MODIFY] client/src/features/chat/hooks/useTypingIndicator.ts
- Bỏ logic setTimeout debounce 500ms.
- Sửa hàm emitTyping để gửi payload qua WebSocket ngay lập tức.
- Giữ lại cơ chế throttle (kiểm tra Date.now() - lastSentRef.current < 2000) để giảm tải cho server nhưng vẫn đảm bảo hiển thị typing mượt mà.

## Cáº­p nháº­t 17/08/2026

## TÃ³m táº¯t nhá»¯ng thay Ä‘á»•i

Triá»ƒn khai toÃ n diá»‡n há»‡ thá»‘ng Web Chat cÃ³ há»— trá»£ AI, tuÃ¢n thá»§ cháº·t cháº½ kiáº¿n trÃºc SOLID, Modular Monolith (Server) vÃ  Feature-Sliced (Client).

### PhÃ­a Server (Spring Boot)
1. **Cáº¥u hÃ¬nh Dependencies**: Cáº­p nháº­t `build.gradle` Ä‘á»ƒ bá»• sung cÃ¡c module thiáº¿t yáº¿u (`spring-boot-starter-websocket`, `spring-boot-starter-security`, `jjwt` vÃ  `atmin-library:1.0.4.Beta`).
2. **Báº£o máº­t KÃªnh (Channel Security)**: Táº¡o `ChatSubscriptionSecurityConfig` Ä‘á»ƒ cháº·n Ä‘á»©ng hÃ nh vi láº¥y ID ngÆ°á»i khÃ¡c Ä‘á»ƒ "nghe lÃ©n" phÃ²ng chat thÃ´ng qua lá»‡nh `SUBSCRIBE` cá»§a STOMP.
3. **Module Chat Core**:
   - `Entity` & `Repository`: Thiáº¿t láº­p cÆ¡ sá»Ÿ dá»¯ liá»‡u cho `User`, `Conversation`, `Message`.
   - `DTO`: XÃ¢y dá»±ng cáº¥u trÃºc gá»­i nháº­n dá»¯ liá»‡u chuáº©n `MessageRequest`, `MessageResponse`.
   - `ChatService` & `ChatServiceImpl`: Xá»­ lÃ½ lÆ°u tin nháº¯n, kiá»ƒm tra phÃ²ng chat vÃ  phÃ¡t tÃ­n hiá»‡u (broadcast) real-time báº±ng `SimpMessagingTemplate`.
   - `ChatController` & `WebSocketChatController`: Cung cáº¥p Ä‘iá»ƒm cháº¡m API REST láº¥y lá»‹ch sá»­ vÃ  `@MessageMapping` cho WebSockets.
4. **Presence Manager**: Triá»ƒn khai trÃ¬nh quáº£n lÃ½ tráº¡ng thÃ¡i Online/Offline, tÃ­ch há»£p bá»™ háº¹n giá» (ScheduledExecutorService) trá»… 5 giÃ¢y Ä‘á»ƒ triá»‡t tiÃªu hiá»‡u á»©ng nháº¥p nhÃ¡y UI khi F5 trÃ¬nh duyá»‡t.
5. **Spring AI (@CloseFriend)**: Táº¡o `CloseFriendAiService` cháº¡y ngáº§m (`@Async`) vá»›i Transaction tÃ¡ch biá»‡t nháº±m gá»i API Gemini khÃ´ng gÃ¢y ngháº½n káº¿t ná»‘i Database.

### PhÃ­a Client (React / Vite)
1. **Kiáº¿n trÃºc Feature-Sliced**: Chia cáº¯t mÃ£ nguá»“n UI máº¡ch láº¡c táº¡i `features/chat`.
2. **State Management**: Sá»­ dá»¥ng `zustand` (`useChatStore`) Ä‘á»ƒ quáº£n lÃ½ phÃ²ng chat Ä‘ang chá»n trÃªn toÃ n cá»¥c.
3. **Máº¡ng (Network) & WebSocket**: 
   - Táº¡o Axios client (`api.ts`).
   - Viáº¿t hook cá»±c ká»³ máº¡nh máº½ `useChatWebSocket` káº¿t há»£p SockJS & StompJS Ä‘á»ƒ Ä‘iá»u phá»‘i gá»­i tin, xá»­ lÃ½ Optimistic Update (giáº£ ID Ä‘á»ƒ hiá»‡n tin nháº¯n ngay láº­p tá»©c) vÃ  Read Receipts (ÄÃ£ Ä‘á»c chÃ©o ID).
4. **Giao diá»‡n (UI)**: Code 100% báº±ng Tailwind CSS.
   - ðŸŽ¨ Sá»­ dá»¥ng hiá»‡u á»©ng `glassmorphism` (backdrop-blur).
   - âœ¨ PhÃ¢n tÃ¡ch mÃ u sáº¯c, bong bÃ³ng chat riÃªng (tÃ­m) cho bot `@CloseFriend`.
   - ðŸ˜Ž Gradient hiá»‡n Ä‘áº¡i theo phong cÃ¡ch thiáº¿t káº¿ Premium.

### Sá»­a Lá»—i (Bug Fixes)
- **Cáº­p nháº­t ngÃ y**: 17/08/2026
- **Client (Tailwind CSS)**: Cáº­p nháº­t cÃº phÃ¡p khai bÃ¡o trong file `index.css` Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch chuáº©n Tailwind v4 (sá»­ dá»¥ng `@import "tailwindcss";` thay vÃ¬ `@tailwind base/components/utilities`), kháº¯c phá»¥c dá»©t Ä‘iá»ƒm lá»—i Vite khÃ´ng build Ä‘Æ°á»£c do khÃ´ng nháº­n diá»‡n Ä‘Æ°á»£c utility class (nhÆ° `bg-gray-50`).
- **Client (TypeScript/Vite)**: Kháº¯c phá»¥c lá»—i `Uncaught SyntaxError: does not provide an export named` khi Vite (esbuild) biÃªn dá»‹ch. Chuyá»ƒn Ä‘á»•i toÃ n bá»™ cÃ¡c cÃ¢u lá»‡nh import interface (nhÆ° `Message`, `Conversation`) tá»« store sang Ä‘á»‹nh dáº¡ng `import type { ... }`. Äiá»u nÃ y giÃºp trÃ¬nh biÃªn dá»‹ch nháº­n diá»‡n chÃ­nh xÃ¡c Ä‘Ã¢y lÃ  cÃ¡c kiá»ƒu dá»¯ liá»‡u vÃ  loáº¡i bá» an toÃ n khá»i mÃ£ JavaScript lÃºc cháº¡y (runtime), trÃ¡nh gÃ¢y lá»—i crash á»©ng dá»¥ng.
- **Client (Vite/SockJS)**: Xá»­ lÃ½ triá»‡t Ä‘á»ƒ lá»—i runtime `Uncaught ReferenceError: global is not defined` trÃªn trÃ¬nh duyá»‡t. Lá»—i nÃ y do thÆ° viá»‡n `sockjs-client` máº·c Ä‘á»‹nh tÃ¬m kiáº¿m biáº¿n `global` cá»§a mÃ´i trÆ°á»ng Node.js. Kháº¯c phá»¥c báº±ng cÃ¡ch cáº¥u hÃ¬nh `define: { global: 'window' }` bÃªn trong file `vite.config.ts` nháº±m cung cáº¥p polyfill phÃ¹ há»£p cho mÃ´i trÆ°á»ng browser.
- **XÃ¡c thá»±c toÃ n diá»‡n (Full Authentication Flow)**: Thay tháº¿ luá»“ng xÃ¡c thá»±c "giáº£" báº±ng cÆ¡ cháº¿ xÃ¡c thá»±c JWT káº¿t ná»‘i Database thá»±c táº¿.
  - **Server**: 
    - Bá»• sung `username`, `password`, `status` (`UserStatus`) vÃ o entity `User`.
    - Viáº¿t `DatabaseSeeder` tá»± Ä‘á»™ng sinh 2 tÃ i khoáº£n (user123, atmin123) kÃ¨m máº­t kháº©u Ä‘Ã£ mÃ£ hÃ³a (BCrypt) vÃ  phÃ²ng chat máº«u khi Server khá»Ÿi Ä‘á»™ng.
    - PhÃ¡t triá»ƒn API `/api/v1/auth/login` Ä‘á»ƒ cáº¥p JWT há»£p lá»‡.
    - XÃ³a bá» bypass báº£o máº­t trong `WebSocketConfig` Ä‘á»ƒ cháº·n hoÃ n toÃ n káº¿t ná»‘i Stomp náº·c danh.
  - **Client**: 
    - PhÃ¡t triá»ƒn mÃ n hÃ¬nh `Login.tsx` cao cáº¥p (UI Glassmorphism, khÃ´ng cho phÃ©p Ä‘Äƒng kÃ½ má»›i).
    - Táº¡o `useAuthStore` (Zustand) Ä‘á»ƒ lÆ°u `token` vÃ  `currentUser` (káº¿t há»£p `localStorage`).
    - Cáº­p nháº­t axios interceptor trong `api.ts` tá»± Ä‘á»™ng chÃ¨n token, vÃ  `App.tsx` tá»± Ä‘á»™ng chuyá»ƒn Ä‘á»•i view ÄÄƒng nháº­p/Chat dá»±a trÃªn state hiá»‡n táº¡i.
- **Client (React/TypeScript)**: Sá»­a lá»—i TS1484 trong `useChatWebSocket.ts` báº±ng cÃ¡ch sá»­ dá»¥ng `import type` cho `IMessage`, giÃºp á»©ng dá»¥ng build thÃ nh cÃ´ng khi báº­t `verbatimModuleSyntax`.
- **Client (Debounce API /read)**: Triá»ƒn khai thÃ nh cÃ´ng logic Debounce báº±ng `setTimeout` (1 giÃ¢y) vÃ o chá»©c nÄƒng `markAsRead` trong `useChatWebSocket.ts` Ä‘á»ƒ ngÄƒn cháº·n viá»‡c spam API liÃªn tá»¥c khi nháº­n nhiá»u tin nháº¯n má»›i, Ä‘Ãºng theo thiáº¿t káº¿.
- **Server (PresenceManager)**: Sá»­a lá»—i logic gá»­i nháº§m sá»± kiá»‡n `online=true` khi ngÆ°á»i dÃ¹ng nháº¥n F5/Reload trang. Giá» Ä‘Ã¢y, náº¿u káº¿t ná»‘i láº¡i trong vÃ²ng 5 giÃ¢y (huá»· lá»‹ch offline thÃ nh cÃ´ng), Server sáº½ khÃ´ng broadcast tráº¡ng thÃ¡i online dÆ° thá»«a ná»¯a.

### Cáº£i Tiáº¿n Kiáº¿n TrÃºc (Architecture Improvements)
- **Cáº­p nháº­t ngÃ y**: 17/08/2026
- **Kiáº¿n trÃºc ÄÄƒng nháº­p Stateless JWT (KhÃ´ng phiÃªn)**: Ãp dá»¥ng triá»‡t Ä‘á»ƒ kiáº¿n trÃºc báº£o máº­t tá»« dá»± Ã¡n Holiday.
  - **Server (Spring Boot)**: 
    - Bá»• sung kháº£ nÄƒng sinh vÃ  xÃ¡c thá»±c `refresh_token` trong `JwtProvider`.
    - Cáº­p nháº­t `AuthController` Ä‘á»ƒ tráº£ vá» `refresh_token` thÃ´ng qua **HttpOnly Cookie** thay vÃ¬ JSON body, ngÄƒn cháº·n hoÃ n toÃ n táº¥n cÃ´ng XSS tá»« phÃ­a Client.
    - XÃ¢y dá»±ng API `/refresh` ngáº§m Ä‘á»ƒ cáº¥p láº¡i `access_token` má»›i vÃ  `/logout` Ä‘á»ƒ chá»§ Ä‘á»™ng xÃ³a Cookie.
  - **Client (React)**: 
    - Cáº­p nháº­t `useAuthStore` loáº¡i bá» hoÃ n toÃ n viá»‡c lÆ°u trá»¯ `token` trong `localStorage`, chá»‰ lÆ°u trÃªn memory (RAM).
    - Triá»ƒn khai thÃ nh cÃ´ng **Silent Refresh (AuthInit)** bá»c ngoÃ i á»©ng dá»¥ng, tá»± Ä‘á»™ng lÃ m má»›i token ngáº§m khi khá»Ÿi Ä‘á»™ng Ä‘á»ƒ trÃ¡nh nhÃ¡y trang.
    - CÃ i Ä‘áº·t **Axios Interceptor Queue** siÃªu máº¡nh máº½ trong `api.ts`: Báº¯t giá»¯ lá»—i `401 Unauthorized`, táº¡m dá»«ng toÃ n bá»™ cÃ¡c request, Ä‘Æ°a vÃ o hÃ ng Ä‘á»£i (`failedQueue`), tá»± Ä‘á»™ng gá»i API `/refresh`, vÃ  `replay` láº¡i toÃ n bá»™ queue khi refresh thÃ nh cÃ´ng mÃ  ngÆ°á»i dÃ¹ng khÃ´ng há» hay biáº¿t.
- **Báº£o máº­t (Security)**: Khá»Ÿi táº¡o file `.gitignore` á»Ÿ cáº¥p Ä‘á»™ thÆ° má»¥c gá»‘c (root) nháº±m ngÄƒn cháº·n rá»§i ro rÃ² rá»‰ cÃ¡c tá»‡p cáº¥u hÃ¬nh bÃ­ máº­t, khÃ³a (keys, `.pem`, `.crt`), mÃ´i trÆ°á»ng (`.env`) vÃ  thÃ´ng tin Ä‘Äƒng nháº­p lÃªn kho lÆ°u trá»¯ mÃ£ nguá»“n (Repository).

## HoÃ n thiá»‡n trÃ² chuyá»‡n riÃªng tÆ° giá»¯a hai tÃ i khoáº£n

**NgÃ y cáº­p nháº­t**: 17/08/2026

### Ná»™i dung triá»ƒn khai

- Chuyá»ƒn giao diá»‡n tá»« â€œPhÃ²ng Chat Demoâ€ sang má»™t cuá»™c trÃ² chuyá»‡n riÃªng tÆ° thá»±c sá»± giá»¯a `user123` vÃ  `atmin123`. TÃªn hiá»ƒn thá»‹ luÃ´n Ä‘Æ°á»£c suy ra tá»« ngÆ°á»i cÃ²n láº¡i, khÃ´ng cÃ²n dÃ¹ng tÃªn phÃ²ng chung hoáº·c láº¥y nháº§m ngÆ°á»i Ä‘ang Ä‘Äƒng nháº­p.
- Tá»± Ä‘á»™ng má»Ÿ cuá»™c trÃ² chuyá»‡n duy nháº¥t sau khi Ä‘Äƒng nháº­p; bá»• sung tráº¡ng thÃ¡i rá»—ng rÃµ rÃ ng náº¿u dá»¯ liá»‡u hai ngÆ°á»i chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o.
- Táº¡o hai áº£nh Ä‘áº¡i diá»‡n SVG riÃªng táº¡i `client/public/avatars/` vÃ  hiá»ƒn thá»‹ Ä‘á»“ng nháº¥t á»Ÿ thanh tÃ i khoáº£n, danh sÃ¡ch trÃ² chuyá»‡n, tiÃªu Ä‘á» vÃ  tá»«ng bong bÃ³ng tin nháº¯n.
- Bá»• sung `ConversationResponse` vÃ  `ParticipantResponse` Ä‘á»ƒ API chá»‰ tráº£ Ä‘Ãºng dá»¯ liá»‡u giao diá»‡n cáº§n dÃ¹ng, khÃ´ng tráº£ trá»±c tiáº¿p thá»±c thá»ƒ cÆ¡ sá»Ÿ dá»¯ liá»‡u.
- Äá»“ng bá»™ dá»¯ liá»‡u khá»Ÿi táº¡o Ä‘á»ƒ cuá»™c trÃ² chuyá»‡n luÃ´n cÃ³ Ä‘Ãºng hai thÃ nh viÃªn, khÃ´ng mang tÃªn demo vÃ  hai tÃ i khoáº£n luÃ´n nháº­n Ä‘Ãºng Ä‘Æ°á»ng dáº«n áº£nh Ä‘áº¡i diá»‡n ká»ƒ cáº£ khi cÆ¡ sá»Ÿ dá»¯ liá»‡u Ä‘Ã£ tá»“n táº¡i tá»« trÆ°á»›c.
- NÃ¢ng cáº¥p gá»­i tin láº¡c quan báº±ng `clientMessageId` chuáº©n UUID. Pháº£n há»“i WebSocket giá» ghÃ©p chÃ­nh xÃ¡c vá»›i tin táº¡m tÆ°Æ¡ng á»©ng, ká»ƒ cáº£ khi ngÆ°á»i dÃ¹ng gá»­i nhiá»u tin cÃ³ ná»™i dung giá»‘ng nhau.
- Giá»›i háº¡n ná»™i dung tá»‘i Ä‘a 4.000 kÃ½ tá»± á»Ÿ cáº£ Client vÃ  Server; ná»™i dung Ä‘Æ°á»£c loáº¡i bá» khoáº£ng tráº¯ng thá»«a trÆ°á»›c khi lÆ°u.
- LÆ°u tráº¡ng thÃ¡i `READ` tháº­t sá»± vÃ o cÆ¡ sá»Ÿ dá»¯ liá»‡u khi ngÆ°á»i nháº­n má»Ÿ cuá»™c trÃ² chuyá»‡n, Ä‘á»“ng thá»i tiáº¿p tá»¥c phÃ¡t biÃªn nháº­n Ä‘Ã£ Ä‘á»c theo thá»i gian thá»±c cho ngÆ°á»i gá»­i.
- Bá»• sung tráº¡ng thÃ¡i máº¥t káº¿t ná»‘i/káº¿t ná»‘i láº¡i, khÃ³a nÃºt gá»­i khi WebSocket chÆ°a sáºµn sÃ ng vÃ  giá»¯ nguyÃªn ná»™i dung Ä‘ang soáº¡n náº¿u gá»­i chÆ°a thÃ nh cÃ´ng.
- ThÃªm cÆ¡ sá»Ÿ dá»¯ liá»‡u H2 chá»‰ dÃ nh cho kiá»ƒm thá»­ Ä‘á»ƒ bá»™ kiá»ƒm thá»­ Server khÃ´ng phá»¥ thuá»™c vÃ o tÃ i khoáº£n MySQL cá»§a mÃ´i trÆ°á»ng phÃ¡t triá»ƒn.

### Tá»‡p chÃ­nh Ä‘Ã£ thay Ä‘á»•i

- Client: `App.tsx`, `ConversationList.tsx`, `ChatBox.tsx`, `MessageItem.tsx`, `UserAvatar.tsx`, `useChatWebSocket.ts`, `useChatStore.ts`, `AuthInit.tsx` vÃ  hai tá»‡p áº£nh trong `public/avatars/`.
- Server: `DatabaseSeeder.java`, cÃ¡c DTO cuá»™c trÃ² chuyá»‡n/tin nháº¯n, `Message.java`, `MessageRepository.java`, `ChatServiceImpl.java`, `ChatController.java`, `build.gradle` vÃ  `src/test/resources/application.yml`.

### Káº¿t quáº£ kiá»ƒm tra

- Client: lint khÃ´ng cÃ²n cáº£nh bÃ¡o; TypeScript biÃªn dá»‹ch thÃ nh cÃ´ng; Vite táº¡o báº£n dá»±ng production thÃ nh cÃ´ng.
- Server: `compileJava` thÃ nh cÃ´ng vÃ  toÃ n bá»™ bá»™ kiá»ƒm thá»­ Gradle hoÃ n táº¥t vá»›i tráº¡ng thÃ¡i `BUILD SUCCESSFUL`.

## TÃ­ch há»£p chá»©c nÄƒng Ä‘á»•i áº£nh Ä‘áº¡i diá»‡n tá»« dá»± Ã¡n Holiday

**NgÃ y cáº­p nháº­t**: 17/08/2026

### Ná»™i dung triá»ƒn khai

- Chuyá»ƒn luá»“ng Ä‘á»•i áº£nh tá»« Holiday sang ChatRealTime: ngÆ°á»i dÃ¹ng nháº¥n biá»ƒu tÆ°á»£ng camera táº¡i tÃ i khoáº£n hiá»‡n táº¡i, chá»n áº£nh, xem trÆ°á»›c vÃ  xÃ¡c nháº­n trÆ°á»›c khi táº£i lÃªn.
- Táº¡o feature Client Ä‘á»™c láº­p `features/profile` gá»“m giao diá»‡n `AvatarUploadModal`, hook quáº£n lÃ½ táº£i áº£nh vÃ  service gá»i API multipart; giao diá»‡n cÃ³ tráº¡ng thÃ¡i Ä‘ang táº£i, thÃ´ng bÃ¡o thÃ nh cÃ´ng/tháº¥t báº¡i, Ä‘Ã³ng báº±ng phÃ­m Escape vÃ  há»— trá»£ thao tÃ¡c bÃ n phÃ­m.
- Kiá»ƒm tra tá»‡p á»Ÿ cáº£ Client vÃ  Server: chá»‰ cho phÃ©p PNG/JPG/JPEG, tá»‘i Ä‘a 5 MB, áº£nh tá»‘i Ä‘a 4096 Ã— 4096 pixel; Server Ä‘á»c ná»™i dung áº£nh tháº­t thay vÃ¬ chá»‰ tin tÃªn tá»‡p hoáº·c MIME do trÃ¬nh duyá»‡t gá»­i lÃªn.
- TÃ­ch há»£p module Media theo kiáº¿n trÃºc cá»§a Holiday vá»›i `MediaUploadService` vÃ  báº£n triá»ƒn khai Cloudinary. áº¢nh Ä‘Æ°á»£c lÆ°u theo tÃ i khoáº£n trong thÆ° má»¥c `chat-realtime/avatars`, cho phÃ©p ghi Ä‘Ã¨ vÃ  lÃ m má»›i bá»™ nhá»› Ä‘á»‡m an toÃ n.
- Bá»• sung API báº£o máº­t `POST /api/v1/users/me/avatar`; mÃ£ ngÆ°á»i dÃ¹ng luÃ´n láº¥y tá»« JWT, khÃ´ng cho Client truyá»n ID Ä‘á»ƒ Ä‘á»•i áº£nh cá»§a tÃ i khoáº£n khÃ¡c.
- Sau khi cáº­p nháº­t, Server phÃ¡t sá»± kiá»‡n `/topic/profile-updates`. Hai cá»­a sá»• chat cáº­p nháº­t avatar má»›i ngay láº­p tá»©c á»Ÿ thanh tÃ i khoáº£n, danh sÃ¡ch ngÆ°á»i chat, tiÃªu Ä‘á» vÃ  bong bÃ³ng tin nháº¯n mÃ  khÃ´ng cáº§n táº£i láº¡i trang.
- Sá»­a `DatabaseSeeder` Ä‘á»ƒ chá»‰ gÃ¡n avatar máº·c Ä‘á»‹nh khi tÃ i khoáº£n chÆ°a cÃ³ áº£nh, trÃ¡nh ghi Ä‘Ã¨ áº£nh Cloudinary má»—i láº§n khá»Ÿi Ä‘á»™ng Server.
- Bá»• sung `server/.env.example`, há»— trá»£ tá»± Ä‘á»c `server/.env`, cáº¥u hÃ¬nh giá»›i háº¡n multipart vÃ  hÆ°á»›ng dáº«n ba biáº¿n Cloudinary cáº§n thiáº¿t trong `Instructions_for_use.md`.

### Tá»‡p chÃ­nh Ä‘Ã£ thay Ä‘á»•i

- Client: `App.tsx`, `features/profile/**`, `useAuthStore.ts`, `useChatStore.ts`, `useChatWebSocket.ts` vÃ  public API cá»§a feature Chat.
- Server: `modules/media/**`, `UserProfileController.java`, `UserProfileService.java`, `UserProfileServiceImpl.java`, cÃ¡c DTO há»“ sÆ¡, `DatabaseSeeder.java`, `application.yml`, `application-cloud.yml`, `.env.example`, `build.gradle` vÃ  `Instructions_for_use.md`.

### Káº¿t quáº£ kiá»ƒm tra

- Client: `oxlint` khÃ´ng cÃ³ cáº£nh bÃ¡o, TypeScript biÃªn dá»‹ch thÃ nh cÃ´ng vÃ  Vite táº¡o báº£n dá»±ng production thÃ nh cÃ´ng.
- Server: toÃ n bá»™ kiá»ƒm thá»­ Gradle thÃ nh cÃ´ng; biÃªn dá»‹ch sáº¡ch báº±ng `compileJava --rerun-tasks`, khÃ´ng cÃ²n cáº£nh bÃ¡o unchecked.

## Bá»• sung cáº­p nháº­t thÃ´ng tin há»“ sÆ¡

**NgÃ y cáº­p nháº­t**: 17/08/2026

### Ná»™i dung triá»ƒn khai

- Má»Ÿ rá»™ng cá»­a sá»• Ä‘á»•i avatar thÃ nh `ProfileModal`, cho phÃ©p quáº£n lÃ½ Ä‘á»“ng thá»i áº£nh Ä‘áº¡i diá»‡n vÃ  tÃªn hiá»ƒn thá»‹ trong cÃ¹ng má»™t nÆ¡i.
- Hiá»ƒn thá»‹ tÃªn Ä‘Äƒng nháº­p á»Ÿ cháº¿ Ä‘á»™ chá»‰ Ä‘á»c vÃ¬ Ä‘Ã¢y lÃ  Ä‘á»‹nh danh dÃ¹ng cho Ä‘Äƒng nháº­p vÃ  JWT; Client khÃ´ng Ä‘Æ°á»£c phÃ©p gá»­i yÃªu cáº§u Ä‘á»•i username.
- Bá»• sung API báº£o máº­t `PUT /api/v1/users/me`. Server láº¥y Ä‘Ãºng tÃ i khoáº£n tá»« JWT, chuáº©n hÃ³a khoáº£ng tráº¯ng vÃ  lÆ°u tÃªn hiá»ƒn thá»‹ má»›i vÃ o cÆ¡ sá»Ÿ dá»¯ liá»‡u.
- Kiá»ƒm tra tÃªn á»Ÿ cáº£ Client vÃ  Server: báº¯t buá»™c tá»« 2 Ä‘áº¿n 100 kÃ½ tá»±, pháº£i cÃ³ chá»¯ cÃ¡i vÃ  chá»‰ cháº¥p nháº­n chá»¯ cÃ¡i, dáº¥u tiáº¿ng Viá»‡t, khoáº£ng tráº¯ng, dáº¥u cháº¥m, dáº¥u nhÃ¡y hoáº·c gáº¡ch ná»‘i.
- Má»Ÿ rá»™ng sá»± kiá»‡n `/topic/profile-updates` Ä‘á»ƒ Ä‘á»“ng bá»™ cáº£ `fullName` vÃ  `avatarUrl`. NgÆ°á»i cÃ²n láº¡i tháº¥y tÃªn má»›i ngay táº¡i danh sÃ¡ch trÃ² chuyá»‡n, tiÃªu Ä‘á» vÃ  cÃ¡c vá»‹ trÃ­ há»“ sÆ¡ mÃ  khÃ´ng cáº§n táº£i láº¡i trang.
- TÃ¡ch logic Client thÃ nh `useProfileInfoUpdate` vÃ  `profileService.updateProfile`, cÃ³ tráº¡ng thÃ¡i Ä‘ang lÆ°u, thÃ´ng bÃ¡o lá»—i/thÃ nh cÃ´ng vÃ  giá»¯ UI component táº­p trung vÃ o hiá»ƒn thá»‹.
- ThÃªm kiá»ƒm thá»­ `UserProfileServiceImplTest` Ä‘á»ƒ xÃ¡c nháº­n tÃªn Ä‘Æ°á»£c chuáº©n hÃ³a Ä‘Ãºng vÃ  sá»± kiá»‡n WebSocket Ä‘Æ°á»£c phÃ¡t vá»›i dá»¯ liá»‡u má»›i; Ä‘á»“ng thá»i kiá»ƒm tra trÆ°á»ng há»£p tÃªn chá»‰ cÃ²n má»™t kÃ½ tá»± sau chuáº©n hÃ³a bá»‹ tá»« chá»‘i.

### Tá»‡p chÃ­nh Ä‘Ã£ thay Ä‘á»•i

- Client: `App.tsx`, `features/profile/components/ProfileModal.tsx`, `useProfileInfoUpdate.ts`, `profileService.ts`, `useAuthStore.ts`, `useChatStore.ts` vÃ  `useChatWebSocket.ts`.
- Server: `UpdateProfileRequest.java`, `ProfileUpdatedEventResponse.java`, `UserProfileController.java`, `UserProfileService.java`, `UserProfileServiceImpl.java` vÃ  `UserProfileServiceImplTest.java`.

### Káº¿t quáº£ kiá»ƒm tra

- Client: lint khÃ´ng cÃ³ cáº£nh bÃ¡o, TypeScript biÃªn dá»‹ch thÃ nh cÃ´ng vÃ  Vite táº¡o báº£n dá»±ng production thÃ nh cÃ´ng.
- Server: toÃ n bá»™ kiá»ƒm thá»­ Gradle, bao gá»“m hai ca kiá»ƒm thá»­ há»“ sÆ¡ má»›i, hoÃ n táº¥t vá»›i tráº¡ng thÃ¡i `BUILD SUCCESSFUL`.

## Sá»­a lá»—i IntelliJ khÃ´ng cháº¡y Ä‘Æ°á»£c Server vÃ¬ dÃ²ng lá»‡nh quÃ¡ dÃ i

**NgÃ y cáº­p nháº­t**: 17/08/2026

- Cáº­p nháº­t cáº¥u hÃ¬nh cháº¡y `ServerApplication` trong `server/.idea/workspace.xml` Ä‘á»ƒ IntelliJ sá»­ dá»¥ng tá»‡p tham sá»‘ Java (`ARGS_FILE`) thay cho viá»‡c ghÃ©p toÃ n bá»™ dependency vÃ o dÃ²ng lá»‡nh Windows.
- Cá»‘ Ä‘á»‹nh thÆ° má»¥c cháº¡y thÃ nh `$PROJECT_DIR$` Ä‘á»ƒ Server tiáº¿p tá»¥c Ä‘á»c Ä‘Ãºng tá»‡p `server/.env`.
- Thay Ä‘á»•i nÃ y xá»­ lÃ½ lá»—i `Command line is too long. Shorten the command line and rerun` mÃ  khÃ´ng cáº§n xÃ³a dependency hoáº·c thay Ä‘á»•i mÃ£ nguá»“n á»©ng dá»¥ng.
- Bá»• sung cáº¥u hÃ¬nh dá»± phÃ²ng `server/.run/ServerApplication_Gradle.run.xml`. Cáº¥u hÃ¬nh **ServerApplication (Gradle)** cháº¡y báº±ng tÃ¡c vá»¥ `bootRun`, luÃ´n dÃ¹ng Ä‘Ãºng `runtimeClasspath` cá»§a Gradle vÃ  trÃ¡nh lá»—i IntelliJ chÆ°a Ä‘á»“ng bá»™ thÆ° viá»‡n Cloudinary.
- ÄÃ£ xÃ¡c nháº­n `com.cloudinary:cloudinary-http5:2.0.0` tá»“n táº¡i trá»±c tiáº¿p trong `runtimeClasspath`; lá»—i `ClassNotFoundException: com.cloudinary.Cloudinary` Ä‘áº¿n tá»« cache classpath cá»§a cáº¥u hÃ¬nh IntelliJ cÅ©, khÃ´ng pháº£i do thiáº¿u dependency trong dá»± Ã¡n.
- ÄÃ£ khá»Ÿi Ä‘á»™ng thá»­ báº±ng `bootRun` trÃªn cá»•ng ngáº«u nhiÃªn: Spring Boot, Cloudinary configuration, MySQL, JPA vÃ  WebSocket Ä‘á»u khá»Ÿi táº¡o thÃ nh cÃ´ng; `ServerApplication` Ä‘áº¡t tráº¡ng thÃ¡i `Started` sau khoáº£ng 14 giÃ¢y.
- Chuyá»ƒn cáº¥u hÃ¬nh Ä‘ang Ä‘Æ°á»£c chá»n trong IntelliJ tá»« `Spring Boot.ServerApplication` sang `Gradle.ServerApplication (Gradle)` vÃ  bá»• sung Ä‘á»“ng thá»i `shortenClasspath` cÃ¹ng `SHORTEN_COMMAND_LINE=ARGS_FILE` Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch nhiá»u phiÃªn báº£n IntelliJ trÃªn Windows.
- Loáº¡i bá» hoÃ n toÃ n SDK Cloudinary khá»i classpath vÃ  chuyá»ƒn sang gá»i Cloudinary Upload API báº±ng `RestClient` cÃ³ sáºµn trong Spring. Viá»‡c nÃ y xá»­ lÃ½ dá»©t Ä‘iá»ƒm `ClassNotFoundException: com.cloudinary.Cloudinary` ngay cáº£ khi IntelliJ chÆ°a lÃ m má»›i mÃ´ hÃ¬nh dependency.
- KhÃ´i phá»¥c cÃ¡ch cháº¡y Spring Boot trá»±c tiáº¿p theo yÃªu cáº§u: thÃªm cáº¥u hÃ¬nh project `server/.run/ServerApplication.run.xml`, chá»n láº¡i `Spring Boot.ServerApplication` vÃ  sá»­ dá»¥ng `JAR manifest` Ä‘á»ƒ Ä‘Æ°a classpath dÃ i vÃ o má»™t JAR táº¡m. ÄÃ¢y váº«n lÃ  thao tÃ¡c Run/Debug `ServerApplication` thÃ´ng thÆ°á»ng, khÃ´ng cháº¡y thÃ´ng qua Gradle.
- XÃ³a cáº¥u hÃ¬nh cháº¡y Gradle dá»± phÃ²ng Ä‘á»ƒ trÃ¡nh nháº§m láº«n trong danh sÃ¡ch Run. Dá»± Ã¡n hiá»‡n chá»‰ giá»¯ cáº¥u hÃ¬nh Spring Boot trá»±c tiáº¿p `ServerApplication` nhÆ° cÃ¡ch cháº¡y thÃ´ng thÆ°á»ng trong IntelliJ.

## Cho phÃ©p hai Client 5173 vÃ  5174 chat Ä‘á»“ng thá»i

**NgÃ y cáº­p nháº­t**: 17/08/2026

- Sá»­a lá»—i Client cháº¡y táº¡i `http://localhost:5174` khÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c WebSocket vÃ¬ `WebSocketConfig` trÆ°á»›c Ä‘Ã³ chá»‰ cháº¥p nháº­n origin 5173.
- Táº¡o `FrontendOriginProperties` lÃ m nguá»“n cáº¥u hÃ¬nh chung cho cáº£ REST CORS vÃ  SockJS/STOMP, trÃ¡nh tÃ¬nh tráº¡ng má»™t bÃªn cho phÃ©p 5174 nhÆ°ng bÃªn cÃ²n láº¡i tá»« chá»‘i.
- Cáº¥u hÃ¬nh máº·c Ä‘á»‹nh cho phÃ©p chÃ­nh xÃ¡c `http://localhost:5173` vÃ  `http://localhost:5174`, phÃ¹ há»£p viá»‡c Ä‘Äƒng nháº­p hai tÃ i khoáº£n báº±ng hai Google Chrome profile khÃ¡c nhau.

## Sá»­a yÃªu cáº§u cáº­p nháº­t avatar khÃ´ng pháº£i multipart

**NgÃ y cáº­p nháº­t**: 17/08/2026

- Äá»‘i chiáº¿u láº¡i luá»“ng chuáº©n trong Holiday vÃ  xÃ¡c Ä‘á»‹nh Client ChatRealTime bá»‹ káº¿ thá»«a `Content-Type: application/json` tá»« Axios instance khi gá»­i `FormData`.
- Cáº­p nháº­t `profileService.uploadAvatar` Ä‘á»ƒ ghi Ä‘Ã¨ `Content-Type: multipart/form-data` Ä‘Ãºng nhÆ° `Holiday/client/src/features/profile/services/user.api.ts`.
- Khai bÃ¡o rÃµ `consumes = multipart/form-data` táº¡i API `/api/v1/users/me/avatar`, báº£o Ä‘áº£m há»£p Ä‘á»“ng Clientâ€“Server nháº¥t quÃ¡n vÃ  ngÄƒn yÃªu cáº§u sai Ä‘á»‹nh dáº¡ng Ä‘i sÃ¢u vÃ o nghiá»‡p vá»¥.
- Sau kiá»ƒm tra thá»±c táº¿, bá» rÃ ng buá»™c `consumes` bá»• sung vÃ¬ nÃ³ khiáº¿n Spring khÃ´ng chá»n handler khi request tá»« trÃ¬nh duyá»‡t chÆ°a cÃ³ content type khá»›p tuyá»‡t Ä‘á»‘i vÃ  rÆ¡i xuá»‘ng static resource handler. Controller hiá»‡n khá»›p Ä‘Ãºng cáº¥u trÃºc Holiday: `@PostMapping("/me/avatar")` káº¿t há»£p `@RequestParam("file") MultipartFile file`.

## NÃ¢ng Cáº¥p Giao Diá»‡n (UI/UX) & Responsive

**NgÃ y cáº­p nháº­t**: 17/08/2026

- **Mobile Responsive**: Äáº£m báº£o á»©ng dá»¥ng cháº¡y mÆ°á»£t mÃ  trÃªn cÃ¡c thiáº¿t bá»‹ mÃ n hÃ¬nh nhá» (Mobile/Tablet) báº±ng cÃ¡ch áº©n/hiá»‡n Sidebar vÃ  Main Chat Area tÃ¹y thuá»™c vÃ o viá»‡c ngÆ°á»i dÃ¹ng cÃ³ Ä‘ang trong phÃ²ng chat nÃ o khÃ´ng. Bá»• sung nÃºt `Back` trong `ChatBox` trÃªn Ä‘iá»‡n thoáº¡i.
- **Premium Design (Glassmorphism & Animated Backgrounds)**: 
  - Äá»•i tÃ´ng mÃ u vÃ  hÃ¬nh ná»n thÃ nh dáº¡ng Gradient Ä‘á»™ng (Animated Gradient) káº¿t há»£p vá»›i cÃ¡c hÃ¬nh cáº§u lÆ¡ lá»­ng má» (Blurry Blobs).
  - Ãp dá»¥ng font **Inter** xuyÃªn suá»‘t dá»± Ã¡n mang láº¡i cáº£m giÃ¡c chuyÃªn nghiá»‡p.
  - NÃ¢ng cáº¥p mÃ n hÃ¬nh ÄÄƒng Nháº­p (`Login`), danh sÃ¡ch phÃ²ng trÃ² chuyá»‡n (`ConversationList`) vÃ  bong bÃ³ng tin nháº¯n (`MessageItem`) vá»›i bÃ³ng Ä‘á»• mÆ°á»£t mÃ  (soft shadows), Ä‘Æ°á»ng viá»n siÃªu nháº¹ vÃ  hiá»‡u á»©ng background má» (backdrop-blur).
- **Micro-Animations**:
  - TÃ­ch há»£p nhiá»u chuyá»ƒn Ä‘á»™ng mÆ°á»£t mÃ  báº±ng CSS Keyframes (`slide-up`, `pop-in`, `float`, `pulse-glow` cho ngÆ°á»i dÃ¹ng online).
- **TuÃ¢n thá»§ Tuyá»‡t Äá»‘i Logic**: QuÃ¡ trÃ¬nh nÃ¢ng cáº¥p 100% khÃ´ng lÃ m thay Ä‘á»•i hay cháº¡m vÃ o logic quáº£n lÃ½ State (Zustand) hay káº¿t ná»‘i WebSocket/API.

## HoÃ n thiá»‡n giao diá»‡n vÃ  nháº­n diá»‡n robot CloseFriend trÃªn mobile

**NgÃ y cáº­p nháº­t**: 17/08/2026

### Ná»™i dung triá»ƒn khai

- Táº¡o component `BotAvatar` riÃªng báº±ng biá»ƒu tÆ°á»£ng robot vector, loáº¡i bá» emoji láº¥p lÃ¡nh cÅ© vÃ  dÃ¹ng thá»‘ng nháº¥t táº¡i tin nháº¯n AI, khu vá»±c hÆ°á»›ng dáº«n gá»i bot, mÃ n hÃ¬nh chá» vÃ  nháº­n diá»‡n CloseFriend.
- Thiáº¿t káº¿ láº¡i tin nháº¯n bot theo hÆ°á»›ng dá»… phÃ¢n biá»‡t nhÆ°ng khÃ´ng láº¥n Ã¡t cuá»™c trÃ² chuyá»‡n: cÃ³ avatar robot, nhÃ£n `CloseFriend AI`, huy hiá»‡u `Bot` vÃ  bong bÃ³ng ná»n sÃ¡ng dá»… Ä‘á»c.
- ThÃªm nÃºt robot cáº¡nh Ã´ nháº­p. NgÆ°á»i dÃ¹ng chá»‰ cáº§n nháº¥n nÃºt Ä‘á»ƒ chÃ¨n `@CloseFriend`, khÃ´ng pháº£i tá»± nhá»› cÃº phÃ¡p gá»i bot.
- Cáº£i thiá»‡n danh sÃ¡ch trÃ² chuyá»‡n, tiÃªu Ä‘á» phÃ²ng chat, tráº¡ng thÃ¡i trá»±c tuyáº¿n, mÃ n hÃ¬nh chÆ°a cÃ³ tin nháº¯n vÃ  khu vá»±c tÃ i khoáº£n báº±ng khoáº£ng cÃ¡ch, Ä‘á»™ tÆ°Æ¡ng pháº£n vÃ  vÃ¹ng báº¥m phÃ¹ há»£p thiáº¿t bá»‹ cáº£m á»©ng.
- Chuyá»ƒn khung á»©ng dá»¥ng sang chiá»u cao Ä‘á»™ng `100dvh`, bá»• sung safe-area cho thiáº¿t bá»‹ cÃ³ tai thá»/thanh Ä‘iá»u hÆ°á»›ng vÃ  ngÄƒn Ã´ nháº­p bá»‹ thanh trÃ¬nh duyá»‡t mobile che khuáº¥t.
- Tá»‘i Æ°u riÃªng cho mobile: header gá»n hÆ¡n, bong bÃ³ng tin nháº¯n rá»™ng há»£p lÃ½, áº©n avatar cá»§a chÃ­nh mÃ¬nh Ä‘á»ƒ dÃ nh khÃ´ng gian, nÃºt quay láº¡i vÃ  nÃºt gá»­i Ä‘áº¡t vÃ¹ng cháº¡m thuáº­n tiá»‡n.
- Chuyá»ƒn cá»­a sá»• há»“ sÆ¡ thÃ nh bottom sheet trÃªn mobile, giá»›i háº¡n chiá»u cao vÃ  cho phÃ©p cuá»™n; trÃªn desktop váº«n giá»¯ dáº¡ng modal á»Ÿ giá»¯a mÃ n hÃ¬nh.
- LÃ m má»›i mÃ n hÃ¬nh Ä‘Äƒng nháº­p vá»›i biá»ƒu tÆ°á»£ng robot, kÃ­ch thÆ°á»›c vÃ  khoáº£ng cÃ¡ch responsive; bá»• sung há»— trá»£ `prefers-reduced-motion` cho ngÆ°á»i dÃ¹ng háº¡n cháº¿ chuyá»ƒn Ä‘á»™ng.

### Tá»‡p chÃ­nh Ä‘Ã£ thay Ä‘á»•i

- `client/src/features/chat/components/BotAvatar.tsx`
- `client/src/features/chat/components/MessageItem.tsx`

## TÃ¡ch Ä‘á»‹a chá»‰ local vÃ  domain production

**NgÃ y cáº­p nháº­t**: 17/08/2026

- Táº¡o `client/src/infra/serverUrl.ts` lÃ m nguá»“n URL duy nháº¥t. Vite development dÃ¹ng Server local, cÃ²n báº£n build production tá»± dÃ¹ng `https://chat.atmin.io.vn`.
- Loáº¡i bá» URL localhost viáº¿t trá»±c tiáº¿p khá»i Axios vÃ  hook WebSocket; REST API vÃ  SockJS cÃ¹ng láº¥y Ä‘á»‹a chá»‰ tá»« cáº¥u hÃ¬nh chung.
- TÃ¡ch cáº¥u hÃ¬nh Spring thÃ nh profile `local` vÃ  `cloud`: local giá»¯ MySQL/CORS trÃªn mÃ¡y, cloud yÃªu cáº§u MySQL Railway vÃ  chá»‰ cháº¥p nháº­n domain tháº­t.
- Server Ä‘á»c cá»•ng Ä‘á»™ng `PORT` cá»§a Railway vÃ  váº«n máº·c Ä‘á»‹nh cá»•ng 8080 khi cháº¡y local.
- Bá»• sung biáº¿n máº«u cho profile, MySQL Railway vÃ  JWT trong `.env.example`.
- Táº¡o `deploy.md` báº±ng tiáº¿ng Viá»‡t, ghi Ä‘áº§y Ä‘á»§ báº£ng Ä‘á»‹a chá»‰, cÃ¡ch Ä‘á»•i profile, biáº¿n Railway vÃ  cÃ¡ch quay láº¡i cháº¡y local.

## HoÃ n thiá»‡n gÃ³i deploy Railway cho ngÆ°á»i má»›i

**NgÃ y cáº­p nháº­t**: 17/08/2026

- ThÃªm Dockerfile nhiá»u giai Ä‘oáº¡n táº¡i thÆ° má»¥c gá»‘c: Node build React, Gradle build Spring Boot vÃ  Java 21 JRE cháº¡y á»©ng dá»¥ng báº±ng tÃ i khoáº£n khÃ´ng cÃ³ quyá»n root.
- ÄÃ³ng gÃ³i giao diá»‡n React vÃ o static resources cá»§a Spring Boot Ä‘á»ƒ toÃ n bá»™ giao diá»‡n, REST API vÃ  WebSocket dÃ¹ng chung `chat.atmin.io.vn`.
- ThÃªm `.dockerignore` vÃ  loáº¡i dá»± Ã¡n Holiday khá»i Git Ä‘á»ƒ trÃ¡nh gá»­i mÃ£ tham kháº£o, `.env`, dependency vÃ  file build lÃªn Railway.
- Cho phÃ©p cÃ¡c tÃ i nguyÃªn giao diá»‡n truy cáº­p cÃ´ng khai qua Spring Security; API nghiá»‡p vá»¥ váº«n yÃªu cáº§u JWT nhÆ° trÆ°á»›c.
- Táº¡o `/health` cÃ´ng khai Ä‘á»ƒ Railway kiá»ƒm tra á»©ng dá»¥ng cÃ²n hoáº¡t Ä‘á»™ng.
- TÃ¡ch cáº¥u hÃ¬nh refresh cookie theo mÃ´i trÆ°á»ng: local khÃ´ng Secure, production HTTPS báº¯t buá»™c Secure; loáº¡i bá» ba Ä‘oáº¡n táº¡o cookie trÃ¹ng láº·p trong AuthController.
- Má»Ÿ rá»™ng `deploy.md` Ä‘á»ƒ giáº£i thÃ­ch cÃ¡c file Railway sá»­ dá»¥ng vÃ  nháº¯c khÃ´ng cáº¥u hÃ¬nh sai Root Directory.
- TÃ´ ná»•i báº­t `@CloseFriend` trong ná»™i dung tin nháº¯n: mÃ u xanh Messenger trÃªn bong bÃ³ng sÃ¡ng vÃ  mÃ u xanh nháº¡t tÆ°Æ¡ng pháº£n trÃªn bong bÃ³ng xanh cá»§a ngÆ°á»i gá»­i.

## Chuáº©n bá»‹ deploy miá»…n phÃ­ báº±ng Render vÃ  Supabase

**NgÃ y cáº­p nháº­t**: 17/08/2026

- Giá»¯ MySQL cho profile `local` Ä‘á»ƒ cÃ¡ch cháº¡y trÃªn mÃ¡y khÃ´ng thay Ä‘á»•i.
- ThÃªm PostgreSQL JDBC Driver cho profile `cloud` káº¿t ná»‘i Supabase.
- Bá» cáº¥u hÃ¬nh Ã©p Hibernate dÃ¹ng MySQL; Hibernate tá»± nháº­n Ä‘Ãºng há»‡ quáº£n trá»‹ theo datasource cá»§a tá»«ng mÃ´i trÆ°á»ng.
- Cáº¥u hÃ¬nh Hikari pool tá»‘i Ä‘a 5 káº¿t ná»‘i Ä‘á»ƒ phÃ¹ há»£p giá»›i háº¡n dá»± Ã¡n Supabase Free.
- Cáº­p nháº­t `.env.example` vÃ  `deploy.md` sang Render + Supabase Session pooler IPv4, khÃ´ng cáº§n IPv4 add-on tráº£ phÃ­.
- Giá»¯ mÃ´ hÃ¬nh má»™t Docker container cháº¡y chung React, Spring Boot vÃ  WebSocket Ä‘á»ƒ ngÆ°á»i má»›i khÃ´ng pháº£i tÃ¡ch Netlify.

## Sá»­a Render Live nhÆ°ng tráº£ vá» Not Found

**NgÃ y cáº­p nháº­t**: 18/08/2026

- XÃ¡c nháº­n Render tráº£ header `x-render-routing=no-server`, cho tháº¥y container khÃ´ng cÃ²n phá»¥c vá»¥ phÃ­a sau route dÃ¹ deploy tá»«ng bÃ¡o Live.
- Giá»›i háº¡n Java á»Ÿ heap 256 MB, Serial GC, metaspace 128 MB, code cache 48 MB vÃ  má»™t CPU Ä‘á»ƒ vá»«a gÃ³i Render Free 512 MB.
- Giáº£m Tomcat cÃ²n tá»‘i Ä‘a 20 request threads vÃ  100 káº¿t ná»‘i cho quy mÃ´ chat demo.
- Buá»™c Docker kiá»ƒm tra `dist/index.html` trÆ°á»›c khi build vÃ  kiá»ƒm tra láº¡i `index.html` Ä‘Ã£ náº±m trong Spring Boot JAR; build sáº½ tháº¥t báº¡i sá»›m thay vÃ¬ deploy má»™t á»©ng dá»¥ng thiáº¿u giao diá»‡n.
- ThÃªm route `/` chuyá»ƒn tiáº¿p rÃµ rÃ ng Ä‘áº¿n `/index.html` Ä‘á»ƒ Spring Boot luÃ´n tráº£ giao diá»‡n React.

## KhÃ´ng phá»¥ thuá»™c domain production trong mÃ£ Client

**NgÃ y cáº­p nháº­t**: 18/08/2026

- Loáº¡i bá» Ä‘á»‹a chá»‰ `https://chat.atmin.io.vn` bá»‹ hardcode trong báº£n build React.
- Production tá»± láº¥y `window.location.origin`, nÃªn link Render gá»i REST/WebSocket trÃªn Render vÃ  domain chÃ­nh thá»©c tá»± gá»i cÃ¹ng domain sau khi DNS hoáº¡t Ä‘á»™ng.
- Váº«n há»— trá»£ `VITE_SERVER_ORIGIN` khi cáº§n ghi Ä‘Ã¨ vÃ  chuáº©n hÃ³a dáº¥u `/` cuá»‘i Ä‘á»ƒ trÃ¡nh URL bá»‹ láº·p dáº¥u gáº¡ch chÃ©o.
- Cho phÃ©p origin Render táº¡m trong cáº¥u hÃ¬nh cloud Ä‘á»ƒ WebSocket hoáº¡t Ä‘á»™ng trÆ°á»›c khi NhÃ¢n HÃ²a xá»­ lÃ½ xong DNS.
- Sá»­a chÃ­nh xÃ¡c hostname Render thÃ nh `chat-real-time-ujhj.onrender.com` Ä‘á»ƒ báº¯t tay WebSocket khÃ´ng bá»‹ CORS tá»« chá»‘i.

## Sá»­a Ä‘Äƒng nháº­p production vÃ  gá»£i Ã½ tÃ i khoáº£n

**NgÃ y cáº­p nháº­t**: 18/08/2026

- Chuáº©n hÃ³a má»i `JWT_SECRET_KEY` thÃ nh khÃ³a SHA-256 Ä‘á»§ 256 bit, khÃ´ng cÃ²n yÃªu cáº§u chuá»—i do Render táº¡o pháº£i Ä‘Ãºng Ä‘á»‹nh dáº¡ng Base64.
- ÄÄƒng nháº­p sai tráº£ HTTP 401 vá»›i thÃ´ng bÃ¡o rÃµ rÃ ng thay vÃ¬ bá»‹ chuyá»ƒn thÃ nh HTTP 500.
- KhÃ´ng gá»i `/auth/refresh` á»Ÿ láº§n má»Ÿ Ä‘áº§u khi trÃ¬nh duyá»‡t chÆ°a tá»«ng cÃ³ phiÃªn Ä‘Äƒng nháº­p, loáº¡i bá» lá»—i 401 gÃ¢y nhiá»…u trong Console.
- LÆ°u má»™t cá» phiÃªn khÃ´ng nháº¡y cáº£m; token vÃ  refresh token váº«n khÃ´ng Ä‘Æ°á»£c ghi vÃ o localStorage.
- Giá»¯ input Ä‘Äƒng nháº­p hoÃ n toÃ n sáº¡ch: khÃ´ng placeholder, khÃ´ng tÃ i khoáº£n/máº­t kháº©u máº«u vÃ  táº¯t autocomplete Ä‘á»ƒ giao diá»‡n khÃ´ng lÃ m lá»™ hoáº·c gá»£i Ã½ thÃ´ng tin Ä‘Äƒng nháº­p.

## Cáº£i thiá»‡n thanh nháº­p khi bÃ n phÃ­m Ä‘iá»‡n thoáº¡i má»Ÿ

**NgÃ y cáº­p nháº­t**: 18/08/2026

- Äá»“ng bá»™ chiá»u cao á»©ng dá»¥ng vá»›i vÃ¹ng mÃ n hÃ¬nh thá»±c sá»± cÃ²n nhÃ¬n tháº¥y báº±ng Visual Viewport API, giÃºp thanh nháº­p luÃ´n náº±m phÃ­a trÃªn bÃ n phÃ­m áº£o.
- Theo dÃµi thay Ä‘á»•i kÃ­ch thÆ°á»›c, vá»‹ trÃ­ viewport vÃ  xoay mÃ n hÃ¬nh Ä‘á»ƒ bá»‘ cá»¥c tá»± co giÃ£n trÃªn Android vÃ  iOS.
- Tá»± Ä‘Æ°a cuá»‘i cuá»™c trÃ² chuyá»‡n vÃ o vÃ¹ng nhÃ¬n tháº¥y khi ngÆ°á»i dÃ¹ng cháº¡m vÃ o Ã´ nháº­p.
- Váº«n giá»¯ khoáº£ng Ä‘á»‡m safe-area cho thiáº¿t bá»‹ cÃ³ thanh Home hoáº·c tai thá».
- Khai bÃ¡o `interactive-widget=resizes-content`, táº¯t cháº¿ Ä‘á»™ Virtual Keyboard phá»§ ná»™i dung trÃªn trÃ¬nh duyá»‡t há»— trá»£ vÃ  Ä‘á»“ng bá»™ viewport nhiá»u nhá»‹p khi input focus/blur.
- ÄÆ°a thanh soáº¡n tin lÃªn lá»›p hiá»ƒn thá»‹ riÃªng vÃ  bá» pháº§n safe-area dÆ° khi bÃ n phÃ­m Ä‘ang má»Ÿ, giÃºp ngÆ°á»i dÃ¹ng luÃ´n nhÃ¬n tháº¥y ná»™i dung Ä‘ang nháº­p.

## Sá»­a lá»—i pháº£n há»“i báº£o máº­t vá»›i kiá»ƒu ngÃ y giá» Java

**NgÃ y cáº­p nháº­t**: 18/08/2026

- Cáº¥u hÃ¬nh `ObjectMapper` tá»± Ä‘Äƒng kÃ½ cÃ¡c module chuáº©n thay vÃ¬ táº¡o bá»™ chuyá»ƒn JSON rá»—ng vÃ  chuáº©n hÃ³a ngÃ y giá» sang chuá»—i ISO-8601 dá»… Ä‘á»c.
- Bá»• sung module JSR-310 Ä‘á»ƒ pháº£n há»“i 401/403 cÃ³ `LocalDateTime` Ä‘Æ°á»£c chuyá»ƒn thÃ nh JSON há»£p lá»‡, khÃ´ng cÃ²n phÃ¡t sinh lá»—i 500 trong `SecurityConfig`.
- ThÃªm kiá»ƒm thá»­ há»“i quy xÃ¡c nháº­n `LocalDateTime` luÃ´n Ä‘Æ°á»£c serialize thÃ nh cÃ´ng.

## Gia cá»‘ reply, táº¡o phÃ²ng riÃªng vÃ  tÃ¬m kiáº¿m ngÆ°á»i dÃ¹ng

**NgÃ y cáº­p nháº­t**: 18/08/2026

- Giá»¯ thá»‘ng nháº¥t cÃº phÃ¡p gá»i bot `@CloseFriend` trÃªn Client vÃ  Server.
- Tráº£ lá»—i rÃµ rÃ ng khi tin nháº¯n gá»‘c khÃ´ng tá»“n táº¡i hoáº·c thuá»™c má»™t phÃ²ng chat khÃ¡c, khÃ´ng cÃ²n Ã¢m tháº§m bá» qua reply.
- KhÃ³a bi quan hai ngÆ°á»i dÃ¹ng theo thá»© tá»± ID cá»‘ Ä‘á»‹nh trÆ°á»›c khi tÃ¬m hoáº·c táº¡o phÃ²ng riÃªng, ngÄƒn hai yÃªu cáº§u Ä‘á»“ng thá»i táº¡o hai phÃ²ng 1â€“1 trÃ¹ng nhau.
- Giá»›i háº¡n tÃ¬m kiáº¿m tá»‘i Ä‘a 20 tÃ i khoáº£n Ä‘ang hoáº¡t Ä‘á»™ng, loáº¡i tÃ i khoáº£n hiá»‡n táº¡i ngay táº¡i truy váº¥n database vÃ  sáº¯p xáº¿p theo username.
- Thay kiá»ƒu `any` cá»§a káº¿t quáº£ tÃ¬m kiáº¿m Client báº±ng interface `SearchUser` vÃ  xá»­ lÃ½ lá»—i Axios an toÃ n.
- Bá»• sung kiá»ƒm thá»­ há»“i quy cho reply xuyÃªn phÃ²ng vÃ  thá»© tá»± khÃ³a khi táº¡o phÃ²ng riÃªng.

## Sá»­a tráº¡ng thÃ¡i ngÆ°á»i Ä‘ang online bá»‹ hiá»ƒn thá»‹ ngoáº¡i tuyáº¿n

**NgÃ y cáº­p nháº­t**: 17/08/2026

- XÃ¡c Ä‘á»‹nh Client trÆ°á»›c Ä‘Ã¢y chá»‰ nháº­n sá»± kiá»‡n presence phÃ¡t sinh sau thá»i Ä‘iá»ƒm Ä‘Äƒng kÃ½, nÃªn cÃ³ thá»ƒ bá» lá»¡ tráº¡ng thÃ¡i cá»§a ngÆ°á»i Ä‘Ã£ online tá»« trÆ°á»›c.
- Bá»• sung lá»‡nh WebSocket `/app/presence.sync`. Ngay sau khi subscribe `/topic/presence`, Client yÃªu cáº§u Server phÃ¡t láº¡i áº£nh chá»¥p toÃ n bá»™ session Ä‘ang hoáº¡t Ä‘á»™ng.
- Khi má»™t tÃ i khoáº£n káº¿t ná»‘i láº¡i, Server luÃ´n xÃ¡c nháº­n tráº¡ng thÃ¡i online cho session Ä‘áº§u tiÃªn thay vÃ¬ phá»¥ thuá»™c tráº¡ng thÃ¡i cá»§a lá»‹ch offline cÅ©.
- TrÆ°á»›c khi phÃ¡t offline sau thá»i gian chá» 5 giÃ¢y, Server kiá»ƒm tra láº¡i danh sÃ¡ch session; náº¿u ngÆ°á»i dÃ¹ng Ä‘Ã£ káº¿t ná»‘i láº¡i thÃ¬ bá» qua sá»± kiá»‡n offline cÅ©.
- TÃ¡ch `broadcastStatus` Ä‘á»ƒ má»i sá»± kiá»‡n online, offline vÃ  Ä‘á»“ng bá»™ ban Ä‘áº§u dÃ¹ng chung má»™t Ä‘á»‹nh dáº¡ng dá»¯ liá»‡u.

### Tá»‡p chÃ­nh Ä‘Ã£ thay Ä‘á»•i

- `client/src/features/chat/hooks/useChatWebSocket.ts`
- `server/src/main/java/atmin/modules/chat/controller/WebSocketChatController.java`
- `server/src/main/java/atmin/modules/chat/presence/PresenceManager.java`

## PhÃ¢n biá»‡t rÃµ tin nháº¯n Ä‘Ã£ xem vÃ  chÆ°a xem

**NgÃ y cáº­p nháº­t**: 17/08/2026

- Hiá»ƒn thá»‹ tráº¡ng thÃ¡i thÆ°á»ng trá»±c dÆ°á»›i tin nháº¯n cuá»‘i cÃ¹ng do tÃ i khoáº£n hiá»‡n táº¡i gá»­i, thay vÃ¬ giáº¥u chung vá»›i thá»i gian.
- Tin chÆ°a Ä‘Æ°á»£c Ä‘á»c hiá»ƒn thá»‹ dáº¥u check viá»n xÃ¡m vÃ  nhÃ£n `ChÆ°a xem`.
- Tin Ä‘Ã£ Ä‘Æ°á»£c Ä‘á»c hiá»ƒn thá»‹ avatar nhá» cá»§a ngÆ°á»i nháº­n vÃ  nhÃ£n xanh `ÄÃ£ xem`, theo cÃ¡ch thá»ƒ hiá»‡n quen thuá»™c cá»§a Messenger.
- Chá»‰ hiá»ƒn thá»‹ biÃªn nháº­n á»Ÿ tin gá»­i gáº§n nháº¥t Ä‘á»ƒ giao diá»‡n khÃ´ng láº·p vÃ  khÃ´ng gÃ¢y rá»‘i; thá»i gian váº«n chá»‰ xuáº¥t hiá»‡n khi hover hoáº·c focus/cháº¡m.

### Tá»‡p chÃ­nh Ä‘Ã£ thay Ä‘á»•i

- `client/src/features/chat/components/ChatBox.tsx`
- `client/src/features/chat/components/MessageItem.tsx`
- `client/src/features/chat/components/ChatBox.tsx`
- `client/src/features/chat/components/ConversationList.tsx`
- `client/src/features/chat/index.ts`
- `client/src/features/auth/components/Login.tsx`
- `client/src/features/profile/components/ProfileModal.tsx`
- `client/src/App.tsx`
- `client/src/index.css`

## Gá»­i áº£nh trong phÃ²ng chat vÃ  lÆ°u trÃªn Cloudinary

**NgÃ y cáº­p nháº­t**: 18/08/2026

- ThÃªm nÃºt chá»n áº£nh ngay cáº¡nh Ã´ nháº­p tin nháº¯n, cÃ³ tráº¡ng thÃ¡i Ä‘ang táº£i vÃ  hoáº¡t Ä‘á»™ng trÃªn cáº£ desktop láº«n mobile.
- Chá»‰ nháº­n áº£nh PNG, JPG/JPEG há»£p lá»‡, dung lÆ°á»£ng tá»‘i Ä‘a 5 MB vÃ  kÃ­ch thÆ°á»›c tá»‘i Ä‘a 4096 Ã— 4096 pixel.
- Server kiá»ƒm tra ngÆ°á»i gá»­i thuá»™c phÃ²ng chat trÆ°á»›c khi táº£i áº£nh lÃªn Cloudinary.
- áº¢nh tin nháº¯n Ä‘Æ°á»£c lÆ°u riÃªng trong `chat-realtime/messages/{conversationId}` vÃ  má»—i áº£nh cÃ³ mÃ£ duy nháº¥t Ä‘á»ƒ khÃ´ng ghi Ä‘Ã¨ lÃªn nhau.
- Sau khi táº£i thÃ nh cÃ´ng, Server lÆ°u tin nháº¯n loáº¡i `IMAGE` vÃ o database vÃ  phÃ¡t realtime cho cÃ¡c thÃ nh viÃªn trong phÃ²ng.
- áº¢nh Ä‘Æ°á»£c hiá»ƒn thá»‹ gá»n trong bong bÃ³ng chat, cÃ³ thá»ƒ báº¥m Ä‘á»ƒ má»Ÿ áº£nh Ä‘áº§y Ä‘á»§ á»Ÿ tab má»›i vÃ  váº«n há»— trá»£ reply.

### Cáº¥u hÃ¬nh mÃ´i trÆ°á»ng cáº§n cÃ³

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Káº¿t quáº£ kiá»ƒm tra

- Client TypeScript biÃªn dá»‹ch thÃ nh cÃ´ng vÃ  lint sáº¡ch.
- Vite táº¡o báº£n dá»±ng production thÃ nh cÃ´ng trong thÆ° má»¥c kiá»ƒm tra Ä‘á»™c láº­p.
- ToÃ n bá»™ test backend thÃ nh cÃ´ng, bao gá»“m test lÆ°u vÃ  phÃ¡t realtime tin nháº¯n áº£nh.

### Káº¿t quáº£ kiá»ƒm tra

- Client lint sáº¡ch vÃ  TypeScript biÃªn dá»‹ch thÃ nh cÃ´ng.
- Vite táº¡o báº£n dá»±ng production thÃ nh cÃ´ng.
- Kiá»ƒm tra trá»±c quan á»Ÿ desktop vÃ  viewport mobile 390 Ã— 844: giao diá»‡n khÃ´ng trÃ n ngang, ná»™i dung vá»«a Ä‘Ãºng chiá»u cao mÃ n hÃ¬nh vÃ  biá»ƒu tÆ°á»£ng robot hiá»ƒn thá»‹ sáº¯c nÃ©t.

## Thu gá»n tin nháº¯n, chá»‘ng trÃ n vÃ  bá»• sung gá»£i Ã½ @CloseFriend

**NgÃ y cáº­p nháº­t**: 17/08/2026

- Thu nhá» avatar cáº¡nh tin nháº¯n, padding, cá»¡ chá»¯, bo gÃ³c vÃ  giá»›i háº¡n chiá»u rá»™ng bong bÃ³ng Ä‘á»ƒ cuá»™c trÃ² chuyá»‡n thoÃ¡ng, cÃ¢n Ä‘á»‘i hÆ¡n.
- Di chuyá»ƒn thá»i gian vÃ  tráº¡ng thÃ¡i gá»­i ra ngoÃ i bong bÃ³ng; máº·c Ä‘á»‹nh Ä‘Æ°á»£c áº©n, chá»‰ xuáº¥t hiá»‡n khi rÃª chuá»™t hoáº·c focus/cháº¡m vÃ o tin nháº¯n trÃªn thiáº¿t bá»‹ cáº£m á»©ng.
- Bá»• sung báº£ng gá»£i Ã½ khi ngÆ°á»i dÃ¹ng gÃµ `@`, `@c`, `@cl`... tÆ°Æ¡ng tá»± Messenger/Zalo. CÃ³ thá»ƒ chá»n CloseFriend AI báº±ng chuá»™t, cháº¡m, phÃ­m Enter hoáº·c Tab vÃ  Ä‘Ã³ng báº±ng Escape.
- TÃ¡ch nghiá»‡p vá»¥ mention vÃ o `useBotMention.ts` vÃ  pháº§n hiá»ƒn thá»‹ vÃ o `MentionSuggestions.tsx`, giá»¯ `ChatBox` táº­p trung vÃ o bá»‘ cá»¥c vÃ  sá»± kiá»‡n giao diá»‡n.
- Bá»• sung giá»›i háº¡n chiá»u rá»™ng, `min-width: 0`, chá»‘ng trÃ n ngang vÃ  ngáº¯t chuá»—i dÃ i táº¡i App, phÃ²ng chat, vÃ¹ng tin nháº¯n vÃ  ná»™i dung tá»«ng bong bÃ³ng.
- Thu gá»n thanh nháº­p vÃ  nÃºt robot/nÃºt gá»­i nhÆ°ng váº«n giá»¯ vÃ¹ng thao tÃ¡c phÃ¹ há»£p trÃªn mobile.
- Loáº¡i bá» tháº» hÆ°á»›ng dáº«n bot khá»i danh sÃ¡ch trÃ² chuyá»‡n bÃªn trÃ¡i; gá»£i Ã½ CloseFriend AI chá»‰ xuáº¥t hiá»‡n theo ngá»¯ cáº£nh khi ngÆ°á»i dÃ¹ng gÃµ `@` trong Ã´ nháº­p.
- Gom cÃ¡c tin nháº¯n liÃªn tiáº¿p theo ngÆ°á»i gá»­i vÃ  chá»‰ hiá»ƒn thá»‹ avatar táº¡i tin cuá»‘i cá»§a má»—i cá»¥m. CÃ¡c tin cÃ¹ng ngÆ°á»i Ä‘Æ°á»£c Ä‘áº·t gáº§n nhau, váº«n giá»¯ khoáº£ng trá»‘ng cÄƒn hÃ ng Ä‘á»ƒ bong bÃ³ng khÃ´ng bá»‹ lá»‡ch; avatar xuáº¥t hiá»‡n láº¡i khi Ä‘á»•i ngÆ°á»i gá»­i hoáº·c bot pháº£n há»“i.

## Chuyá»ƒn giao diá»‡n chat sang phong cÃ¡ch Messenger

**NgÃ y cáº­p nháº­t**: 17/08/2026

- Thay giao diá»‡n glassmorphism vÃ  ná»n gradient báº±ng bá»‘ cá»¥c tráº¯ng sáº¡ch, Ä‘Æ°á»ng phÃ¢n cÃ¡ch máº£nh vÃ  mÃ u xanh `#0084ff` Ä‘áº·c trÆ°ng cá»§a á»©ng dá»¥ng nháº¯n tin hiá»‡n Ä‘áº¡i.
- Thiáº¿t káº¿ láº¡i thanh bÃªn thÃ nh khu vá»±c `Äoáº¡n chat`, bá»• sung Ã´ tÃ¬m kiáº¿m ngÆ°á»i trÃ² chuyá»‡n hoáº¡t Ä‘á»™ng thá»±c táº¿ vÃ  tráº¡ng thÃ¡i Ä‘ang hoáº¡t Ä‘á»™ng theo phong cÃ¡ch Messenger.
- Chuyá»ƒn bong bÃ³ng cá»§a ngÆ°á»i gá»­i sang mÃ u xanh, ngÆ°á»i nháº­n sang xÃ¡m nháº¡t vÃ  bot sang xanh nháº¡t; loáº¡i bá» bÃ³ng Ä‘á»• náº·ng Ä‘á»ƒ cÃ¡c cá»¥m tin nháº¯n gá»n vÃ  dá»… Ä‘á»c hÆ¡n.
- LÃ m láº¡i header phÃ²ng chat, mÃ n hÃ¬nh trá»‘ng, thanh nháº­p dáº¡ng pill, nÃºt bot vÃ  nÃºt gá»­i theo cÃ¹ng há»‡ mÃ u xanh.
- Äá»“ng bá»™ avatar robot thÃ nh hÃ¬nh trÃ²n xanh, váº«n giá»¯ robot lÃ m nháº­n diá»‡n riÃªng nhÆ°ng hÃ²a há»£p vá»›i giao diá»‡n Messenger.
- LÃ m má»›i mÃ n hÃ¬nh Ä‘Äƒng nháº­p báº±ng ná»n xÃ¡m nháº¡t, tháº» tráº¯ng, input viá»n Ä‘Æ¡n giáº£n vÃ  nÃºt xanh; giá»¯ Ä‘áº§y Ä‘á»§ responsive mobile vÃ  safe-area.

### Tá»‡p chÃ­nh Ä‘Ã£ thay Ä‘á»•i

- `client/src/App.tsx`
- `client/src/features/auth/components/Login.tsx`
- `client/src/features/chat/components/BotAvatar.tsx`
- `client/src/features/chat/components/ChatBox.tsx`
- `client/src/features/chat/components/ConversationList.tsx`
- `client/src/features/chat/components/MentionSuggestions.tsx`
- `client/src/features/chat/components/MessageItem.tsx`

### Tá»‡p chÃ­nh Ä‘Ã£ thay Ä‘á»•i

- `client/src/features/chat/hooks/useBotMention.ts`
- `client/src/features/chat/components/MentionSuggestions.tsx`
- `client/src/features/chat/components/ChatBox.tsx`
- `client/src/features/chat/components/MessageItem.tsx`
- `client/src/App.tsx`
- `client/src/index.css`

## C?p nh?t 20/08/2026 — S?a l?i Server b? ch?m/h?ng khi chat nhi?u ngu?i

### T?ng quan
Kh?c ph?c tình tr?ng th?t c? chai hi?u nang (bottleneck) d?n d?n treo ho?c s?p Server khi m?t ngu?i dùng m?/chat v?i nhi?u ngu?i khác nhau cùng m?t th?i di?m.

### Chi ti?t thay d?i
- **Xóa b? khóa DB (Pessimistic Lock) trên User**: Tru?c dây, API t?o ho?c l?y phòng chat (getOrCreatePrivateConversation) dã s? d?ng \lockUser()\ (g?i \SELECT ... FOR UPDATE\) d? khóa (lock) toàn b? hàng d? li?u c?a ngu?i dùng trong DB nh?m tránh trùng l?p phòng chat. Ði?u này d?n d?n vi?c n?u ngu?i dùng A tuong tác v?i nhi?u ngu?i cùng lúc, t?t c? các request d?u ph?i x?p hàng ch? m? khóa hàng d? li?u c?a A, gây c?n ki?t Connection Pool (Hikari) và làm ki?t qu? Thread Pool c?a Tomcat, d?n d?n s?p toàn b? h? th?ng.
- **S? d?ng Khóa c?p ?ng d?ng (Application-level Lock)**: Thay th? b?ng \ConcurrentHashMap\ khóa theo t?ng "C?p ngu?i dùng" (\irstUserId:secondUserId\). Gi? dây, ch? khi nào có 2 request t?o phòng gi?a dúng 2 ngu?i A và B x?y ra cùng m?t mili-giây thì h? th?ng m?i ph?i ch? nhau, không còn vi?c A chat v?i C b? block b?i A chat v?i B. Tránh du?c vi?c c?n ki?t Connection Pool.

### File dã s?a
- \ChatServiceImpl.java\: Thay th? hàm \lockUser\ b?ng logic \ConcurrentHashMap\ và kh?i \synchronized\. Xóa vi?c lock User DB.


## C?p nh?t 20/08/2026 — S?a l?i Upload ?nh trong Chat

### T?ng quan
Kh?c ph?c l?i không th? g?i ?nh trong phòng chat (Client báo l?i nhung ?nh không luu du?c lên Cloudinary và Server).

### Chi ti?t thay d?i
- **Xóa b? ràng bu?c consumes = "multipart/form-data" t?i API G?i ?nh**: Gi?ng nhu l?i t?ng g?p ? tính nang d?i ?nh d?i di?n (Avatar), khi phía Frontend (Axios) b? ép bu?c Content-Type: multipart/form-data th? công, trình duy?t s? không t? d?ng sinh ra chu?i oundary=... c?n thi?t. Do dó, khi Request bay d?n Spring Boot, Spring Boot ki?m tra th?y Header không dúng chu?n Multipart (do thi?u boundary) nên Spring dã t? ch?i x? lý và tr? v? l?i 415 ho?c 404.
- Vi?c xóa b? thu?c tính consumes trong @PostMapping ? ChatController.java giúp Spring Boot t? d?ng nh?n di?n Request t? trình duy?t và map chính xác vào MultipartFile mà không b? b?t l?i kh?t khe v? format Header.

### File dã s?a
- \ChatController.java\: Xóa consumes = "multipart/form-data" t?i hàm sendImage.


