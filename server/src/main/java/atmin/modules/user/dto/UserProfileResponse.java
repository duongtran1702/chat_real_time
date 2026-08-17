package atmin.modules.user.dto;

import atmin.modules.user.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileResponse {

    private String id;
    private String username;
    private String fullName;
    private String avatarUrl;
    private boolean online;

    public static UserProfileResponse fromEntity(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .online(user.isOnline())
                .build();
    }
}
