package atmin.core.security.jwt;

import atmin.modules.user.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtProvider {
    private final JwtProperties jwtProperties;

    private Key signingKey() {
        String configuredSecret = jwtProperties.getSecretKey();
        if (configuredSecret == null || configuredSecret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET_KEY chưa được cấu hình");
        }

        try {
            byte[] keyBytes = MessageDigest.getInstance("SHA-256")
                    .digest(configuredSecret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Môi trường Java không hỗ trợ SHA-256", exception);
        }
    }

    public String generateAccessToken(User user) {
        long nowMillis = System.currentTimeMillis();
        Date issuedDate = new Date(nowMillis);
        Date expirationDate = new Date(nowMillis + jwtProperties.getAccessExpiration());

        List<String> roles = List.of();
        List<String> permissions = List.of();

        return Jwts.builder()
                .subject(user.getId())
                .claim("roles", roles)
                .claim("permissions", permissions)
                .claim("type", "access_token")
                .signWith(signingKey())
                .issuedAt(issuedDate)
                .expiration(expirationDate)
                .compact();
    }

    public String generateRefreshToken(User user) {
        long nowMillis = System.currentTimeMillis();
        Date issuedDate = new Date(nowMillis);
        Date expirationDate = new Date(nowMillis + jwtProperties.getRefreshExpiration());

        return Jwts.builder()
                .subject(user.getId())
                .claim("type", "refresh_token")
                .signWith(signingKey())
                .issuedAt(issuedDate)
                .expiration(expirationDate)
                .compact();
    }

    private Claims extractClaimsJws(String token) {
        return Jwts
                .parser()
                .verifyWith((SecretKey) signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private void validateTokenWithType(String token, String expectedType) {
        try {
            String type = extractClaimsJws(token).get("type", String.class);
            if (!expectedType.equals(type)) {
                throw new JwtException("Invalid token type. Expected " + expectedType);
            }
        } catch (ExpiredJwtException e) {
            throw new JwtException("Token has expired");
        } catch (SignatureException | MalformedJwtException e) {
            throw new JwtException("Signature or structure not valid");
        } catch (UnsupportedJwtException e) {
            throw new JwtException("Unsupported token type");
        } catch (IllegalArgumentException e) {
            throw new JwtException("Invalid token argument");
        }
    }

    public void validateAccessToken(String token) {
        validateTokenWithType(token, "access_token");
    }

    public void validateRefreshToken(String token) {
        validateTokenWithType(token, "refresh_token");
    }

    public String getUsernameFromToken(String token) {
        return extractClaimsJws(token).getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        return extractClaimsJws(token).get("roles", List.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> getPermissionsFromToken(String token) {
        List<String> permissions = extractClaimsJws(token).get("permissions", List.class);
        return permissions == null ? List.of() : permissions;
    }

    public Date getExpirationDateFromToken(String token) {
        return extractClaimsJws(token).getExpiration();
    }

    public Date getIssuedAtFromToken(String token) {
        return extractClaimsJws(token).getIssuedAt();
    }

}
