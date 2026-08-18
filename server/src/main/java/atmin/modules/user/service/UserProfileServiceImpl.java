package atmin.modules.user.service;

import atmin.common.exception.ResourceNotFoundException;
import atmin.modules.media.service.MediaUploadService;
import atmin.modules.user.dto.ProfileUpdatedEventResponse;
import atmin.modules.user.dto.UserProfileResponse;
import atmin.modules.user.dto.UpdateProfileRequest;
import atmin.modules.user.entity.User;
import atmin.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final MediaUploadService mediaUploadService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public UserProfileResponse updateAvatar(String userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String avatarUrl = mediaUploadService.uploadAvatar(userId, file);
        user.setAvatarUrl(avatarUrl);
        UserProfileResponse response = UserProfileResponse.fromEntity(userRepository.save(user));

        broadcastProfileUpdate(response);
        return response;
    }

    @Override
    public UserProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String normalizedFullName = request.getFullName().trim().replaceAll("\\s+", " ");
        if (normalizedFullName.length() < 2) {
            throw new IllegalArgumentException("Tên hiển thị phải có từ 2 đến 100 ký tự");
        }
        user.setFullName(normalizedFullName);
        UserProfileResponse response = UserProfileResponse.fromEntity(userRepository.save(user));
        broadcastProfileUpdate(response);
        return response;
    }

    private void broadcastProfileUpdate(UserProfileResponse response) {
        messagingTemplate.convertAndSend(
                "/topic/profile-updates",
                new ProfileUpdatedEventResponse(
                        response.getId(),
                        response.getFullName(),
                        response.getAvatarUrl()
                )
        );
    }

    @Override
    public java.util.List<UserProfileResponse> searchUsers(String query, String currentUserId) {
        if (query == null || query.trim().isEmpty()) {
            return java.util.Collections.emptyList();
        }
        
        java.util.List<User> users = userRepository.findByUsernameContainingIgnoreCaseAndStatusAndIdNot(
                query.trim(),
                atmin.modules.user.entity.UserStatus.ACTIVE,
                currentUserId,
                org.springframework.data.domain.PageRequest.of(
                        0,
                        20,
                        org.springframework.data.domain.Sort.by("username").ascending()
                )
        );
        
        return users.stream()
                .map(UserProfileResponse::fromEntity)
                .toList();
    }
}
