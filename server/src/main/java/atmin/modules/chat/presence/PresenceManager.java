package atmin.modules.chat.presence;

import atmin.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceManager {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final Map<String, Set<String>> userSessions = new ConcurrentHashMap<>();
    private final Map<String, ScheduledFuture<?>> pendingOffline = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    @Transactional
    public void onConnect(String userId, String sessionId) {
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);

        // Hủy lịch Offline nếu có (Ví dụ người dùng vừa F5 hoặc rớt mạng và kết nối lại ngay)
        ScheduledFuture<?> pending = pendingOffline.remove(userId);
        boolean wasPendingOffline = pending != null;
        if (wasPendingOffline) {
            pending.cancel(false);
            log.info("Đã hủy lịch báo Offline cho user {}", userId);
        }

        // Luôn xác nhận Online cho session đầu tiên. Việc phát lặp an toàn hơn bỏ lỡ
        // trạng thái khi tác vụ Offline cũ vừa bắt đầu đúng lúc kết nối lại.
        if (userSessions.get(userId).size() == 1) {
            setOnlineStatus(userId, true);
        }
    }

    public void onDisconnect(String userId, String sessionId) {
        Set<String> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
                
                // Đợi 5 giây mới báo Offline để chống nhấp nháy UI
                ScheduledFuture<?> task = scheduler.schedule(() -> {
                    try {
                        Set<String> activeSessions = userSessions.get(userId);
                        if (activeSessions == null || activeSessions.isEmpty()) {
                            setOnlineStatus(userId, false);
                        } else {
                            log.info("Bỏ qua trạng thái Offline vì user {} đã kết nối lại", userId);
                        }
                    } catch (Exception e) {
                        log.error("Lỗi khi cập nhật trạng thái offline cho user {}", userId, e);
                    } finally {
                        pendingOffline.remove(userId);
                    }
                }, 5, TimeUnit.SECONDS);
                
                pendingOffline.put(userId, task);
                log.info("Lên lịch báo Offline sau 5s cho user {}", userId);
            }
        }
    }

    /** Phát trạng thái hiện tại để Client mới kết nối không bỏ lỡ người đã online từ trước. */
    public void broadcastSnapshot() {
        userSessions.forEach((userId, sessions) -> {
            if (!sessions.isEmpty()) {
                broadcastStatus(userId, true);
            }
        });
    }

    private void setOnlineStatus(String userId, boolean isOnline) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setOnline(isOnline);
            if (!isOnline) {
                user.setLastSeen(LocalDateTime.now());
            }
            userRepository.save(user);
            log.info("Đã cập nhật User {} trạng thái isOnline={}", userId, isOnline);
            
            // Broadcast trạng thái mới nhất qua WebSocket
            broadcastStatus(userId, isOnline);
        });
    }

    private void broadcastStatus(String userId, boolean isOnline) {
        messagingTemplate.convertAndSend(
                "/topic/presence",
                (Object) Map.of("userId", userId, "online", isOnline)
        );
    }
}
