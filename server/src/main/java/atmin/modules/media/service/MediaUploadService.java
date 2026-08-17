package atmin.modules.media.service;

import org.springframework.web.multipart.MultipartFile;

public interface MediaUploadService {

    String uploadAvatar(String userId, MultipartFile file);
}
