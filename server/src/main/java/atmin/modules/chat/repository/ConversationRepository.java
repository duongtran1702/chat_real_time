package atmin.modules.chat.repository;

import atmin.modules.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {
    boolean existsByIdAndParticipants_Id(String conversationId, String userId);
    
    List<Conversation> findByParticipants_IdOrderByUpdatedAtDesc(String userId);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Conversation c JOIN c.participants p1 JOIN c.participants p2 WHERE c.isGroup = false AND p1.id = :userId1 AND p2.id = :userId2")
    java.util.Optional<Conversation> findPrivateConversationBetweenUsers(
            @org.springframework.data.repository.query.Param("userId1") String userId1,
            @org.springframework.data.repository.query.Param("userId2") String userId2);
}
