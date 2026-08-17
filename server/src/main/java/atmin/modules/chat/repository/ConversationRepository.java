package atmin.modules.chat.repository;

import atmin.modules.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {
    boolean existsByIdAndParticipants_Id(String conversationId, String userId);
    
    List<Conversation> findByParticipants_IdOrderByUpdatedAtDesc(String userId);
}
