package atmin.modules.chat.dto;

import atmin.modules.chat.entity.Conversation;
import lombok.Builder;
import lombok.Data;

import java.util.Comparator;
import java.util.List;

@Data
@Builder
public class ConversationResponse {

    private String id;
    private boolean group;
    private List<ParticipantResponse> participants;

    public static ConversationResponse fromEntity(Conversation conversation) {
        List<ParticipantResponse> participants = conversation.getParticipants().stream()
                .sorted(Comparator.comparing(participant -> participant.getId()))
                .map(ParticipantResponse::fromEntity)
                .toList();

        return ConversationResponse.builder()
                .id(conversation.getId())
                .group(conversation.isGroup())
                .participants(participants)
                .build();
    }
}
