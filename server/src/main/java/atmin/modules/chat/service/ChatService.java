package atmin.modules.chat.service;

import atmin.modules.chat.dto.ConversationResponse;
import atmin.modules.chat.dto.MessageRequest;
import atmin.modules.chat.dto.MessageResponse;

public interface ChatService {
    MessageResponse processMessage(MessageRequest request, String senderId);
    MessageResponse processImageMessage(String conversationId, String imageUrl, String clientMessageId,
                                        String replyToMessageId, String senderId);
    void markAsRead(String conversationId, String readerId);
    ConversationResponse getOrCreatePrivateConversation(String currentUserId, String targetUserId);
}
