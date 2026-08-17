package atmin.modules.chat.service.impl;

import atmin.modules.chat.ai.CloseFriendAiService;
import atmin.modules.chat.ai.AiReplyRequestedEvent;
import atmin.modules.chat.dto.MessageRequest;
import atmin.modules.chat.dto.MessageResponse;
import atmin.modules.chat.entity.Conversation;
import atmin.modules.chat.entity.Message;
import atmin.modules.chat.repository.ConversationRepository;
import atmin.modules.chat.repository.MessageRepository;
import atmin.modules.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import atmin.common.exception.ResourceNotFoundException;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public MessageResponse processMessage(MessageRequest request, String senderId) {
        // Kiểm tra phòng chat
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", request.getConversationId()));

        if (!conversationRepository.existsByIdAndParticipants_Id(conversation.getId(), senderId)) {
            throw new IllegalArgumentException("Bạn không có quyền gửi tin nhắn vào phòng chat này");
        }

        // Lưu tin nhắn
        Message message = new Message();
        message.setConversation(conversation);
        message.setSenderId(senderId);
        message.setClientMessageId(request.getClientMessageId());
        message.setContent(request.getContent().trim());
        message.setStatus(Message.MessageStatus.SENT);
        message.setType(Message.MessageType.TEXT);
        messageRepository.save(message);

        MessageResponse response = MessageResponse.fromEntity(message);

        // Broadcast sự kiện tin nhắn mới vào topic phòng chat
        messagingTemplate.convertAndSend("/topic/conversation/" + request.getConversationId(), response);
        
        // Cập nhật List Conversation Sidebar
        messagingTemplate.convertAndSend("/topic/admin/conversations", "update");

        // Chỉ kích hoạt AI sau khi transaction hiện tại commit thành công.
        if (CloseFriendAiService.isMentioned(request.getContent())) {
            eventPublisher.publishEvent(new AiReplyRequestedEvent(conversation.getId(), request.getContent()));
        }

        return response;
    }

    @Override
    @Transactional
    public void markAsRead(String conversationId, String readerId) {
        if (!conversationRepository.existsByIdAndParticipants_Id(conversationId, readerId)) {
            throw new IllegalArgumentException("Bạn không có quyền truy cập phòng chat này");
        }

        messageRepository.markReceivedMessagesAsRead(
                conversationId,
                readerId,
                Message.MessageStatus.READ
        );

        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId + "/read", 
                (Object) Map.of("readerId", readerId, "conversationId", conversationId));
    }
}
