package atmin.modules.chat.ai;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;

/**
 * Những năng lực an toàn được phép cho @CloseFriend gọi.
 * AI chỉ có thể yêu cầu chạy các hàm tại đây, không có quyền truy cập trực tiếp hệ thống.
 */
@Component
public class CloseFriendTools {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Tool(description = "Lấy ngày giờ hiện tại tại Việt Nam khi người dùng hỏi hôm nay, bây giờ hoặc giờ hiện tại.")
    public String getVietnamCurrentTime() {
        return ZonedDateTime.now(VIETNAM_ZONE)
                .format(DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy HH:mm (z)"));
    }
}
