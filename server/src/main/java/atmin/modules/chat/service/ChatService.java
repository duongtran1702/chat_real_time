package atmin.modules.chat.service;

import atmin.modules.chat.dto.MessageRequest;
import atmin.modules.chat.dto.MessageResponse;

public interface ChatService {
    MessageResponse processMessage(MessageRequest request, String senderId);
    void markAsRead(String conversationId, String readerId);
}
