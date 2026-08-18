package atmin.modules.chat.controller;

import atmin.common.response.ApiResponse;
import atmin.modules.chat.dto.ConversationResponse;
import atmin.modules.chat.dto.MessageResponse;
import atmin.modules.chat.entity.Message;
import atmin.modules.chat.repository.ConversationRepository;
import atmin.modules.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final atmin.modules.chat.service.ChatService chatService;

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getMyConversations(
            @AuthenticationPrincipal String userId) {
        List<ConversationResponse> conversations = conversationRepository
                .findByParticipants_IdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(ConversationResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phòng chat thành công", conversations));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal String userId) {
        
        // Kiểm tra quyền (có thể ném exception nếu không có quyền)
        if (!conversationRepository.existsByIdAndParticipants_Id(conversationId, userId)) {
            throw new IllegalArgumentException("Bạn không có quyền xem phòng chat này");
        }

        int safeSize = Math.min(Math.max(size, 1), 100);
        Slice<Message> messageSlice = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(Math.max(page, 0), safeSize));
        List<MessageResponse> messages = messageSlice.getContent().stream()
                .map(MessageResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử tin nhắn thành công", messages));
    }

    @PostMapping("/conversations/user/{targetUserId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getOrCreatePrivateConversation(
            @PathVariable String targetUserId,
            @AuthenticationPrincipal String currentUserId) {
        
        try {
            ConversationResponse response = chatService.getOrCreatePrivateConversation(currentUserId, targetUserId);
            return ResponseEntity.ok(ApiResponse.success("Lấy thông tin phòng chat thành công", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }
}
