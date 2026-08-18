package atmin.modules.chat.dto;

import atmin.modules.chat.entity.Message;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MessageResponse {
    private String id;
    private String conversationId;
    private String senderId;
    private String clientMessageId;
    private String content;
    private Message.MessageStatus status;
    private Message.MessageType type;
    private LocalDateTime createdAt;
    private RepliedMessageSummary repliedMessage;

    @Data
    @Builder
    public static class RepliedMessageSummary {
        private String id;
        private String senderId;
        private String content;

        public static RepliedMessageSummary fromEntity(Message message) {
            if (message == null) return null;
            String truncatedContent = message.getContent();
            if (truncatedContent != null && truncatedContent.length() > 100) {
                truncatedContent = truncatedContent.substring(0, 100) + "…";
            }
            return RepliedMessageSummary.builder()
                    .id(message.getId())
                    .senderId(message.getSenderId())
                    .content(truncatedContent)
                    .build();
        }
    }

    public static MessageResponse fromEntity(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSenderId())
                .clientMessageId(message.getClientMessageId())
                .content(message.getContent())
                .status(message.getStatus())
                .type(message.getType())
                .createdAt(message.getCreatedAt())
                .repliedMessage(RepliedMessageSummary.fromEntity(message.getReplyToMessage()))
                .build();
    }
}
