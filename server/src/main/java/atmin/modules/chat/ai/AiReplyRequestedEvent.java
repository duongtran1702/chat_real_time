package atmin.modules.chat.ai;

/**
 * Được phát sau khi một tin nhắn có nhắc @CloseFriend đã được lưu thành công.
 */
public record AiReplyRequestedEvent(String conversationId, String userMessage) {
}
