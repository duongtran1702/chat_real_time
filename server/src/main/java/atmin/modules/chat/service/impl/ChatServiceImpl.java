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
import atmin.modules.user.entity.User;
import atmin.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import atmin.common.exception.ResourceNotFoundException;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public MessageResponse processMessage(MessageRequest request, String senderId) {
        return saveMessage(request, senderId, Message.MessageType.TEXT);
    }

    @Override
    @Transactional
    public MessageResponse processImageMessage(String conversationId, String imageUrl, String clientMessageId,
                                               String replyToMessageId, String senderId) {
        MessageRequest request = new MessageRequest(imageUrl, conversationId, clientMessageId, replyToMessageId);
        return saveMessage(request, senderId, Message.MessageType.IMAGE);
    }

    private MessageResponse saveMessage(MessageRequest request, String senderId, Message.MessageType type) {
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
        message.setType(type);

        // Xử lý reply: tìm tin nhắn gốc và validate cùng conversation
        if (request.getReplyToMessageId() != null && !request.getReplyToMessageId().isBlank()) {
            Message originalMessage = messageRepository.findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new IllegalArgumentException("Tin nhắn được trả lời không tồn tại"));
            if (!originalMessage.getConversation().getId().equals(conversation.getId())) {
                throw new IllegalArgumentException("Không thể trả lời tin nhắn thuộc phòng chat khác");
            }
            message.setReplyToMessage(originalMessage);
        }

        messageRepository.save(message);

        MessageResponse response = MessageResponse.fromEntity(message);

        // Broadcast sự kiện tin nhắn mới vào topic phòng chat
        messagingTemplate.convertAndSend("/topic/conversation/" + request.getConversationId(), response);

        // Cập nhật List Conversation Sidebar
        messagingTemplate.convertAndSend("/topic/admin/conversations", "update");

        // Chỉ kích hoạt AI sau khi transaction hiện tại commit thành công.
        if (type == Message.MessageType.TEXT && CloseFriendAiService.isMentioned(request.getContent())) {
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

    @Override
    @Transactional
    public atmin.modules.chat.dto.ConversationResponse getOrCreatePrivateConversation(String currentUserId, String targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("Không thể tự tạo phòng chat với chính mình");
        }

        String firstUserId = currentUserId.compareTo(targetUserId) <= 0 ? currentUserId : targetUserId;
        String secondUserId = currentUserId.compareTo(targetUserId) <= 0 ? targetUserId : currentUserId;
        
        // Thử tìm trước (đường nhanh, không lock)
        Optional<Conversation> existing = conversationRepository.findByUserLowIdAndUserHighId(firstUserId, secondUserId);
        
        if (existing.isEmpty()) {
            // Fallback cho data cũ chưa có user_low_id và user_high_id
            existing = conversationRepository.findPrivateConversationBetweenUsers(currentUserId, targetUserId);
            if (existing.isPresent()) {
                // Backfill (cập nhật data cũ để dùng index mới)
                Conversation conv = existing.get();
                conv.setUserLowId(firstUserId);
                conv.setUserHighId(secondUserId);
                conversationRepository.saveAndFlush(conv);
                return atmin.modules.chat.dto.ConversationResponse.fromEntity(conv);
            }
        } else {
            return atmin.modules.chat.dto.ConversationResponse.fromEntity(existing.get());
        }

        // Chưa có thì insert, dựa vào unique constraint để tránh trùng
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + currentUserId));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + targetUserId));

        try {
            Conversation newConv = new Conversation();
            newConv.setId(UUID.randomUUID().toString());
            newConv.setGroup(false);
            newConv.setUserLowId(firstUserId);
            newConv.setUserHighId(secondUserId);
            newConv.setParticipants(new java.util.HashSet<>(Set.of(currentUser, targetUser)));

            newConv = conversationRepository.saveAndFlush(newConv);
            return atmin.modules.chat.dto.ConversationResponse.fromEntity(newConv);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Trường hợp hiếm: 2 request cùng insert 1 lúc, request thua chỉ cần query lại
            return conversationRepository
                    .findByUserLowIdAndUserHighId(firstUserId, secondUserId)
                    .map(atmin.modules.chat.dto.ConversationResponse::fromEntity)
                    .orElseThrow(() -> new IllegalStateException("Lỗi tranh chấp dữ liệu khi tạo phòng chat"));
        }
    }
}
