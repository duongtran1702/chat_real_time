package atmin.modules.user.controller;

import atmin.common.response.ApiResponse;
import atmin.modules.user.config.AuthCookieProperties;
import atmin.modules.user.dto.LoginRequest;
import atmin.modules.user.dto.LoginResponse;
import atmin.modules.user.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import atmin.modules.user.dto.RegisterRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieProperties cookieProperties;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công", null));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, exception.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), 7 * 24 * 60 * 60);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(ApiResponse.success("Đăng nhập thành công", response));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error(401, exception.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, "Vui lòng đăng nhập lại"));
        }
        
        try {
            LoginResponse response = authService.refreshToken(refreshToken);
            
            ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), 7 * 24 * 60 * 60);

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(ApiResponse.success("Làm mới token thành công", response));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        ResponseCookie cookie = createRefreshTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success("Đăng xuất thành công", null));
    }

    private ResponseCookie createRefreshTokenCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from("refresh_token", value)
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite(cookieProperties.getSameSite())
                .build();
    }
}
