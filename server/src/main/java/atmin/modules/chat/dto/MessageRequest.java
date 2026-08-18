package atmin.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @Size(max = 4000, message = "Nội dung tin nhắn không được vượt quá 4000 ký tự")
    private String content;

    @NotBlank(message = "ID phòng chat không được để trống")
    private String conversationId;

    @NotBlank(message = "Mã tin nhắn phía người gửi không được để trống")
    @Pattern(
            regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
            message = "Mã tin nhắn phía người gửi không hợp lệ"
    )
    private String clientMessageId;

    // Optional: ID tin nhắn gốc khi reply
    private String replyToMessageId;
}
