package atmin.modules.media.service;

import atmin.common.exception.CloudStorageException;
import atmin.modules.media.config.CloudinaryProperties;
import atmin.modules.media.dto.CloudinaryUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CloudinaryMediaUploadService implements MediaUploadService {

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final int MAX_IMAGE_DIMENSION = 4096;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final String AVATAR_FOLDER = "chat-realtime/avatars";
    private static final String CHAT_IMAGE_FOLDER = "chat-realtime/messages";

    private final RestClient.Builder restClientBuilder;
    private final CloudinaryProperties properties;

    @Override
    public String uploadAvatar(String userId, MultipartFile file) {
        validateImage(file);
        validateConfiguration();

        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> signedParameters = new TreeMap<>();
        signedParameters.put("folder", AVATAR_FOLDER);
        signedParameters.put("invalidate", "true");
        signedParameters.put("overwrite", "true");
        signedParameters.put("public_id", userId);
        signedParameters.put("timestamp", Long.toString(timestamp));

        try {
            CloudinaryUploadResponse response = uploadFile(file, signedParameters);
            if (response == null || response.secureUrl() == null || response.secureUrl().isBlank()) {
                throw new CloudStorageException("Cloudinary không trả về đường dẫn ảnh hợp lệ");
            }
            return response.secureUrl();
        } catch (CloudStorageException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new CloudStorageException(
                    "Dịch vụ lưu ảnh tạm thời không khả dụng. Vui lòng thử lại sau",
                    exception
            );
        }
    }

    @Override
    public String uploadChatImage(String conversationId, String userId, MultipartFile file) {
        validateImage(file);
        validateConfiguration();

        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> signedParameters = new TreeMap<>();
        signedParameters.put("folder", CHAT_IMAGE_FOLDER + "/" + conversationId);
        signedParameters.put("public_id", userId + "-" + UUID.randomUUID());
        signedParameters.put("timestamp", Long.toString(timestamp));

        try {
            CloudinaryUploadResponse response = uploadFile(file, signedParameters);
            if (response == null || response.secureUrl() == null || response.secureUrl().isBlank()) {
                throw new CloudStorageException("Cloudinary không trả về đường dẫn ảnh hợp lệ");
            }
            return response.secureUrl();
        } catch (CloudStorageException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new CloudStorageException(
                    "Không thể lưu ảnh tin nhắn. Vui lòng thử lại sau",
                    exception
            );
        }
    }

    private CloudinaryUploadResponse uploadFile(
            MultipartFile file,
            Map<String, String> signedParameters) throws IOException {
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", createFileResource(file))
                .contentType(MediaType.parseMediaType(file.getContentType()));
        bodyBuilder.part("api_key", properties.getApiKey());
        bodyBuilder.part("signature", createSignature(signedParameters));
        signedParameters.forEach(bodyBuilder::part);

        return restClientBuilder.build()
                .post()
                .uri("https://api.cloudinary.com/v1_1/{cloudName}/image/upload", properties.getCloudName())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(bodyBuilder.build())
                .retrieve()
                .body(CloudinaryUploadResponse.class);
    }

    private ByteArrayResource createFileResource(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        byte[] content = file.getBytes();
        return new ByteArrayResource(content) {
            @Override
            public String getFilename() {
                return filename == null || filename.isBlank() ? "avatar.jpg" : filename;
            }
        };
    }

    private String createSignature(Map<String, String> parameters) {
        String parametersToSign = parameters.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"));
        String signatureSource = parametersToSign + properties.getApiSecret();

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(digest.digest(signatureSource.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("JVM không hỗ trợ thuật toán SHA-1 cần cho chữ ký Cloudinary", exception);
        }
    }

    private void validateConfiguration() {
        if (!properties.isConfigured()) {
            throw new CloudStorageException(
                    "Cloudinary chưa được cấu hình. Vui lòng thiết lập ba biến môi trường Cloudinary",
                    new IllegalStateException("Thiếu cấu hình Cloudinary")
            );
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn một ảnh");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Ảnh không được vượt quá 5 MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Chỉ chấp nhận ảnh PNG, JPG hoặc JPEG");
        }

        String filename = file.getOriginalFilename();
        int extensionSeparator = filename == null ? -1 : filename.lastIndexOf('.');
        String extension = extensionSeparator < 0 ? "" : filename.substring(extensionSeparator + 1)
                .toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Tên tệp ảnh phải có đuôi PNG, JPG hoặc JPEG");
        }

        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                throw new IllegalArgumentException("Tệp đã chọn không phải là ảnh hợp lệ");
            }
            if (image.getWidth() > MAX_IMAGE_DIMENSION || image.getHeight() > MAX_IMAGE_DIMENSION) {
                throw new IllegalArgumentException("Kích thước ảnh tối đa là 4096 × 4096 pixel");
            }
        } catch (IOException exception) {
            throw new IllegalArgumentException("Không thể đọc tệp ảnh đã chọn", exception);
        }
    }
}
