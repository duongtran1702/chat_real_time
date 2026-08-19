package atmin.modules.chat.ai;

import atmin.modules.chat.dto.MessageResponse;
import atmin.modules.chat.entity.Conversation;
import atmin.modules.chat.entity.Message;
import atmin.modules.chat.repository.ConversationRepository;
import atmin.modules.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.regex.Pattern;

/**
 * Xử lý phản hồi của @CloseFriend mà không giữ transaction lúc gọi Gemini.
 *
 * <p>Sử dụng {@link ChatClient} đã cấu hình sẵn (system prompt, ChatOptions,
 * Advisor, Tools) từ {@link CloseFriendAiConfig}. Lịch sử hội thoại được quản lý
 * tự động bởi {@link org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor}
 * thông qua {@code conversationId}.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloseFriendAiService {

    private static final String BOT_ID = "bot_closefriend";
    private static final Pattern MENTION_PATTERN = Pattern.compile("(?i)@closefriend\\b");

    private final ChatClient closeFriendChatClient;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final TransactionTemplate transactionTemplate;

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    public static boolean isMentioned(String content) {
        return content != null && MENTION_PATTERN.matcher(content).find();
    }

    @Async("aiExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void generateAiResponse(AiReplyRequestedEvent event) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Bỏ qua phản hồi @CloseFriend vì AI_KEY chưa được cấu hình");
            return;
        }

        try {
            // Lọc bỏ @CloseFriend khỏi tin nhắn user
            String cleanMessage = MENTION_PATTERN.matcher(event.userMessage())
                    .replaceFirst("").trim();
            String userPrompt = cleanMessage.isBlank() ? event.userMessage() : cleanMessage;

            // ChatMemory tự ghi nhớ lịch sử theo conversationId qua Advisor
            String aiResponse = closeFriendChatClient.prompt()
                    .user(userPrompt)
                    .advisors(advisor -> advisor.param(
                            ChatMemory.CONVERSATION_ID, event.conversationId()))
                    .call()
                    .content();

            if (aiResponse == null || aiResponse.isBlank()) {
                log.warn("@CloseFriend không nhận được nội dung phản hồi cho phòng {}", event.conversationId());
                return;
            }

            MessageResponse savedMessage = saveBotMessage(event.conversationId(), aiResponse.trim());
            messagingTemplate.convertAndSend("/topic/conversation/" + event.conversationId(), savedMessage);
        } catch (Exception exception) {
            log.error("@CloseFriend không thể phản hồi trong phòng {}", event.conversationId(), exception);
        }
    }

    private MessageResponse saveBotMessage(String conversationId, String content) {
        return transactionTemplate.execute(status -> {
            Conversation conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng chat cho @CloseFriend"));

            Message botMessage = new Message();
            botMessage.setConversation(conversation);
            botMessage.setSenderId(BOT_ID);
            botMessage.setContent(content);
            botMessage.setStatus(Message.MessageStatus.SENT);
            botMessage.setType(Message.MessageType.TEXT);
            return MessageResponse.fromEntity(messageRepository.save(botMessage));
        });
    }
}
