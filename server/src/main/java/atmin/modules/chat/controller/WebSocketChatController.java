package atmin.modules.chat.controller;

import atmin.modules.chat.dto.MessageRequest;
import atmin.modules.chat.presence.PresenceManager;
import atmin.modules.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final ChatService chatService;
    private final PresenceManager presenceManager;

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
}
