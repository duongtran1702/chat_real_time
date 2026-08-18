package atmin.core.security;

import atmin.modules.chat.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;

@Configuration
@RequiredArgsConstructor
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 100)
public class ChatSubscriptionSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final ConversationRepository conversationRepository;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    authorizeSubscription(accessor.getDestination(), accessor.getUser());
                }
                return message;
            }
        });
    }

    private void authorizeSubscription(String destination, Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Chưa xác thực để đăng ký kênh này");
        }

        // Ví dụ: topic là /topic/conversation/{conversationId}
        if (destination != null && destination.startsWith("/topic/conversation/")) {
            String conversationId = destination.replace("/topic/conversation/", "");
            
            // Xử lý loại trừ: nếu là topic read receipt hoặc typing thì lấy phần ID gốc
            if (conversationId.endsWith("/read")) {
                conversationId = conversationId.replace("/read", "");
            } else if (conversationId.endsWith("/typing")) {
                conversationId = conversationId.replace("/typing", "");
            }

            // Gọi repo để kiểm tra xem user này có nằm trong conversation này không.
            // Nếu không ném ra exception để chặn lại.
            boolean hasAccess = conversationRepository.existsByIdAndParticipants_Id(conversationId, principal.getName());
            if (!hasAccess) {
                log.warn("User {} cố gắng subscribe vào phòng chat {} mà không có quyền", principal.getName(), conversationId);
                throw new IllegalArgumentException("Bạn không có quyền truy cập phòng chat này");
            }
        }
    }
}
