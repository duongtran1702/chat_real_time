package atmin.core.security.jwt;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

public final class JwtAuthorityMapper {

    private JwtAuthorityMapper() {
    }

    public static List<GrantedAuthority> map(List<String> roles, List<String> permissions) {
        Stream<String> roleAuthorities = safeStream(roles).flatMap(JwtAuthorityMapper::normalizeRole);
        return Stream.concat(roleAuthorities, safeStream(permissions))
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();
    }

    private static Stream<String> normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return Stream.empty();
        }
        String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase(Locale.ROOT);
        if (authority.toUpperCase(Locale.ROOT).startsWith("ROLE_STAFF_")) {
            return Stream.of(authority, "ROLE_STAFF");
        }
        return Stream.of(authority);
    }

    private static Stream<String> safeStream(List<String> values) {
        return values == null ? Stream.empty() : values.stream();
    }
}
