package atmin.modules.user.dto;

import atmin.modules.user.entity.User;
import lombok.Builder;
import lombok.Data;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
public class LoginResponse {
    private String token;
    @JsonIgnore
    private String refreshToken;
    private User user;
}
