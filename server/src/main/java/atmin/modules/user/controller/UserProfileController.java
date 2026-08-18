package atmin.modules.user.controller;

import atmin.common.response.ApiResponse;
import atmin.modules.user.dto.UserProfileResponse;
import atmin.modules.user.dto.UpdateProfileRequest;
import atmin.modules.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @PostMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateAvatar(
            @AuthenticationPrincipal String userId,
            @RequestParam("file") MultipartFile file) {
        UserProfileResponse response = userProfileService.updateAvatar(userId, file);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật ảnh đại diện thành công", response));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse response = userProfileService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tự thành công", response));
    }

    @org.springframework.web.bind.annotation.GetMapping("/search")
    public ResponseEntity<ApiResponse<java.util.List<UserProfileResponse>>> searchUsers(
            @AuthenticationPrincipal String userId,
            @RequestParam("username") String username) {
        java.util.List<UserProfileResponse> users = userProfileService.searchUsers(username, userId);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", users));
    }
}
