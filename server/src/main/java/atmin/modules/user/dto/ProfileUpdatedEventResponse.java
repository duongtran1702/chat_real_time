package atmin.modules.user.dto;

public record ProfileUpdatedEventResponse(String userId, String fullName, String avatarUrl) {
}
