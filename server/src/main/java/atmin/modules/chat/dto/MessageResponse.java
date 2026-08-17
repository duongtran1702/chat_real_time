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
                .build();
    }
}
