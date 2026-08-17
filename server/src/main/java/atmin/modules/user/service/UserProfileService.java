package atmin.modules.user.service;

import atmin.modules.user.dto.UserProfileResponse;
import atmin.modules.user.dto.UpdateProfileRequest;
import org.springframework.web.multipart.MultipartFile;

public interface UserProfileService {

    UserProfileResponse updateAvatar(String userId, MultipartFile file);

    UserProfileResponse updateProfile(String userId, UpdateProfileRequest request);
}
