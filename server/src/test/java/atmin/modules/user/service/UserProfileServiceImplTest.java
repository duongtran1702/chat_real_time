package atmin.modules.user.service;

import atmin.modules.media.service.MediaUploadService;
import atmin.modules.user.dto.ProfileUpdatedEventResponse;
import atmin.modules.user.dto.UpdateProfileRequest;
import atmin.modules.user.dto.UserProfileResponse;
import atmin.modules.user.entity.User;
import atmin.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MediaUploadService mediaUploadService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private UserProfileServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserProfileServiceImpl(userRepository, mediaUploadService, messagingTemplate);
    }

    @Test
    void updateProfileNormalizesNameAndBroadcastsUpdate() {
        User user = createUser();
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("  Nguyễn   Văn   Mới  ");

        when(userRepository.findById("user123")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = service.updateProfile("user123", request);

        assertEquals("Nguyễn Văn Mới", response.getFullName());
        verify(messagingTemplate).convertAndSend(
                "/topic/profile-updates",
                new ProfileUpdatedEventResponse("user123", "Nguyễn Văn Mới", "/avatars/user123.svg")
        );
    }

    @Test
    void updateProfileRejectsNameThatIsTooShortAfterNormalization() {
        User user = createUser();
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("  A  ");
        when(userRepository.findById("user123")).thenReturn(Optional.of(user));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.updateProfile("user123", request)
        );

        assertEquals("Tên hiển thị phải có từ 2 đến 100 ký tự", exception.getMessage());
    }

    private User createUser() {
        User user = new User();
        user.setId("user123");
        user.setUsername("user123");
        user.setFullName("Nguyễn Văn User");
        user.setAvatarUrl("/avatars/user123.svg");
        return user;
    }
}
