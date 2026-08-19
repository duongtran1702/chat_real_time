package atmin.modules.chat.repository;

import atmin.modules.chat.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC")
    Slice<Message> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);

    List<Message> findTop20ByConversation_IdOrderByCreatedAtDesc(String conversationId);

    /** Lấy tin nhắn gần nhất theo conversation, sắp xếp mới → cũ (dùng cho AI Tool tóm tắt). */
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC")
    List<Message> findRecentMessages(String conversationId, Pageable pageable);

    /** Tìm kiếm tin nhắn theo từ khóa trong conversation (dùng cho AI Tool tra cứu). */
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId "
            + "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "ORDER BY m.createdAt DESC")
    List<Message> searchByKeyword(String conversationId, String keyword, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Message message
            SET message.status = :readStatus
            WHERE message.conversation.id = :conversationId
              AND message.senderId <> :readerId
              AND message.status <> :readStatus
            """)
    int markReceivedMessagesAsRead(
            String conversationId,
            String readerId,
            Message.MessageStatus readStatus
    );
}
