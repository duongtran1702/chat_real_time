package atmin.modules.user.controller;

import atmin.modules.user.dto.UserProfileResponse;
import atmin.modules.user.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserProfileControllerTest {

    @Mock
    private UserProfileService userProfileService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new UserProfileController(userProfileService))
                .build();
    }

    @Test
    void updateAvatarAcceptsMultipartRequestLikeHoliday() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                new byte[]{1, 2, 3}
        );
        UserProfileResponse response = UserProfileResponse.builder()
                .id("user123")
                .username("user123")
                .fullName("Nguyễn Văn User")
                .avatarUrl("https://example.com/avatar.png")
                .online(true)
                .build();
        when(userProfileService.updateAvatar(nullable(String.class), any())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/users/me/avatar")
                .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value("https://example.com/avatar.png"));
    }
}
