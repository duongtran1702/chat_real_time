package atmin.modules.user.service;

import atmin.core.security.jwt.JwtProvider;
import atmin.modules.user.dto.LoginRequest;
import atmin.modules.user.dto.LoginResponse;
import atmin.modules.user.entity.User;
import atmin.modules.user.entity.UserStatus;
import atmin.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Tài khoản hoặc mật khẩu không chính xác");
        }

        return generateLoginResponse(user);
    }

    public LoginResponse refreshToken(String refreshToken) {
        jwtProvider.validateRefreshToken(refreshToken);
        String userId = jwtProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        return generateLoginResponse(user);
    }

    private LoginResponse generateLoginResponse(User user) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Tài khoản đang bị khóa hoặc chưa kích hoạt");
        }

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        return LoginResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(user)
                .build();
    }
}
