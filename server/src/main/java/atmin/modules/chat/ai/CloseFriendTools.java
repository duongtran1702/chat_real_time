package atmin.modules.chat.ai;

import atmin.modules.chat.entity.Message;
import atmin.modules.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Những năng lực an toàn được phép cho @CloseFriend gọi.
 * AI chỉ có thể yêu cầu chạy các hàm tại đây, không có quyền truy cập trực tiếp hệ thống.
 *
 * <p>LLM tự quyết định khi nào cần gọi tool nào dựa trên {@code description},
 * không có if-else hard-code luồng hội thoại.</p>
 */
@Component
@RequiredArgsConstructor
public class CloseFriendTools {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int SUMMARY_MESSAGE_LIMIT = 30;
    private static final int SEARCH_RESULT_LIMIT = 10;

    private final MessageRepository messageRepository;

    /**
     * Tool 1: Lấy giờ hiện tại tại Việt Nam.
     * LLM gọi khi người dùng hỏi "bây giờ mấy giờ?", "hôm nay ngày mấy?", v.v.
     */
    @Tool(description = "Lấy ngày giờ hiện tại tại Việt Nam khi người dùng hỏi hôm nay, bây giờ hoặc giờ hiện tại.")
    public String getVietnamCurrentTime() {
        return ZonedDateTime.now(VIETNAM_ZONE)
                .format(DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy HH:mm (z)"));
    }

    /**
     * Tool 2: Tóm tắt nội dung cuộc trò chuyện gần đây.
     * LLM gọi khi người dùng muốn biết tổng quan những gì đã được thảo luận.
     *
     * @param conversationId ID cuộc trò chuyện cần tóm tắt
     * @return chuỗi chứa các tin nhắn gần nhất, định dạng cho LLM xử lý
     */
    @Tool(description = "Lấy nội dung các tin nhắn gần đây của cuộc trò chuyện "
            + "để tóm tắt khi người dùng muốn biết tổng quan những gì đã thảo luận.")
    public String getRecentChatSummary(
            @ToolParam(description = "ID cuộc trò chuyện cần tóm tắt") String conversationId) {

        List<Message> messages = messageRepository
                .findRecentMessages(conversationId, PageRequest.of(0, SUMMARY_MESSAGE_LIMIT));

        if (messages.isEmpty()) {
            return "Cuộc trò chuyện chưa có tin nhắn nào.";
        }

        // Đảo ngược để hiển thị theo thứ tự thời gian (cũ → mới)
        Collections.reverse(messages);

        return messages.stream()
                .map(msg -> "[%s] %s: %s".formatted(
                        msg.getCreatedAt() != null
                                ? msg.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm dd/MM"))
                                : "?",
                        msg.getSenderId(),
                        msg.getContent()))
                .collect(Collectors.joining("\n"));
    }

    /**
     * Tool 3: Tìm kiếm tin nhắn trong lịch sử cuộc trò chuyện theo từ khóa.
     * LLM gọi khi người dùng muốn tìm lại nội dung đã nói trước đó.
     *
     * @param conversationId ID cuộc trò chuyện cần tìm
     * @param keyword        từ khóa tìm kiếm
     * @return chuỗi chứa các tin nhắn khớp, hoặc thông báo không tìm thấy
     */
    @Tool(description = "Tìm kiếm tin nhắn trong lịch sử cuộc trò chuyện theo từ khóa "
            + "khi người dùng muốn tìm lại nội dung đã nói trước đó.")
    public String searchMessages(
            @ToolParam(description = "ID cuộc trò chuyện cần tìm") String conversationId,
            @ToolParam(description = "Từ khóa tìm kiếm") String keyword) {

        if (keyword == null || keyword.isBlank()) {
            return "Vui lòng cung cấp từ khóa tìm kiếm.";
        }

        List<Message> results = messageRepository
                .searchByKeyword(conversationId, keyword.trim(), PageRequest.of(0, SEARCH_RESULT_LIMIT));

        if (results.isEmpty()) {
            return "Không tìm thấy tin nhắn nào chứa từ khóa \"" + keyword + "\".";
        }

        return results.stream()
                .map(msg -> "[%s] %s: %s".formatted(
                        msg.getCreatedAt() != null
                                ? msg.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm dd/MM"))
                                : "?",
                        msg.getSenderId(),
                        msg.getContent()))
                .collect(Collectors.joining("\n"));
    }
}
