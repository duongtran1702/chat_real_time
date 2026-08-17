package atmin.modules.chat.dto;

import atmin.modules.user.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ParticipantResponse {

    private String id;
    private String fullName;
    private String avatarUrl;
    private boolean online;

    public static ParticipantResponse fromEntity(User user) {
        return ParticipantResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .online(user.isOnline())
                .build();
    }
}
