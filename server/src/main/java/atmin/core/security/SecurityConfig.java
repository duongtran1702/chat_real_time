package atmin.core.security;

import atmin.common.response.ApiErrorResponse;
import atmin.core.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;

import static jakarta.servlet.DispatcherType.ERROR;

@Configuration
@RequiredArgsConstructor
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    private final MdcLoggingFilter mdcLoggingFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            ApiErrorResponse apiError = ApiErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(401)
                    .error("Unauthorized")
                    .message("Xác thực thất bại: " + authException.getMessage())
                    .path(request.getRequestURI())
                    .build();
            response.getWriter().write(objectMapper.writeValueAsString(apiError));
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(403);
            response.setContentType("application/json;charset=UTF-8");
            ApiErrorResponse apiError = ApiErrorResponse.builder()
                    .timestamp(LocalDateTime.now())
                    .status(403)
                    .error("Forbidden")
                    .message("Bạn không có quyền truy cập tài nguyên này")
                    .path(request.getRequestURI())
                    .build();
            response.getWriter().write(objectMapper.writeValueAsString(apiError));
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(ERROR).permitAll()
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/favicon.svg",
                                "/icons.svg",
                                "/avatars/**",
                                "/assets/**",
                                "/health"
                        ).permitAll()
                        .requestMatchers("/api/v1/auth/change-password", "/api/v1/auth/logout").authenticated()
                        .requestMatchers("/api/v1/auth/**", "/api/v1/payment/webhook", "/ws-chat/**", "/error").permitAll()
                        .requestMatchers("/api/v1/admin/agents/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_STAFF")
                        .requestMatchers("/api/v1/admin/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/v1/staff/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_STAFF")
                        .requestMatchers("/api/v1/manager/**").hasAuthority("ROLE_MANAGER")
                        .requestMatchers("/api/v1/customer/**").hasAuthority("ROLE_CUSTOMER")
                        .anyRequest().authenticated())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler()))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(mdcLoggingFilter, JwtAuthenticationFilter.class);
        return http.build();
    }
}
