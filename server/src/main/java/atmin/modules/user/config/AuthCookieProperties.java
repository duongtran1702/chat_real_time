package atmin.modules.user.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.auth.cookie")
public class AuthCookieProperties {

    private boolean secure;
    private String sameSite = "Lax";
}
