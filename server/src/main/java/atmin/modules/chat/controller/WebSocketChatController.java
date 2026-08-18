package atmin.modules.chat.controller;

import atmin.modules.chat.dto.MessageRequest;
import atmin.modules.chat.presence.PresenceManager;
import atmin.modules.chat.repository.ConversationRepository;
import atmin.modules.chat.service.ChatService;
import atmin.modules.user.entity.User;
import atmin.modules.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final ChatService chatService;
    private final PresenceManager presenceManager;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/presence.sync")
    public void syncPresence(Principal principal) {
        if (principal == null) {
            log.warn("Chưa xác thực khi đồng bộ trạng thái trực tuyến");
            return;
        }
        presenceManager.broadcastSnapshot();
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload @Valid MessageRequest request, Principal principal) {
        if (principal == null) {
            log.warn("Chưa xác thực khi gửi tin nhắn WebSocket");
            return;
        }
        
        String senderId = principal.getName(); // Từ JwtAuthenticationToken
        chatService.processMessage(request, senderId);
    }
    
    @MessageMapping("/chat.markAsRead")
    public void markAsRead(@Payload Map<String, String> payload, Principal principal) {
        if (principal == null) return;
        
        String conversationId = payload.get("conversationId");
        if (conversationId != null) {
            chatService.markAsRead(conversationId, principal.getName());
        }
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, String> payload, Principal principal) {
        if (principal == null) return;

        String conversationId = payload.get("conversationId");
        if (conversationId == null) return;

        String userId = principal.getName();

        // Kiểm tra user thuộc conversation
        if (!conversationRepository.existsByIdAndParticipants_Id(conversationId, userId)) {
            return;
        }

        String fullName = userRepository.findById(userId)
                .map(User::getFullName)
                .orElse("Người dùng");

        messagingTemplate.convertAndSend(
                "/topic/conversation/" + conversationId + "/typing",
                (Object) Map.of("userId", userId, "fullName", fullName)
        );
    }
}
