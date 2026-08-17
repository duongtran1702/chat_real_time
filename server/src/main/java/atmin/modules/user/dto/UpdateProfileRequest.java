package atmin.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Tên hiển thị không được để trống")
    @Size(min = 2, max = 100, message = "Tên hiển thị phải có từ 2 đến 100 ký tự")
    @Pattern(
            regexp = "^(?=.*\\p{L})[\\p{L}\\p{M} .'-]+$",
            message = "Tên hiển thị chỉ được chứa chữ cái, khoảng trắng, dấu chấm, dấu nháy hoặc gạch nối"
    )
    private String fullName;
}
