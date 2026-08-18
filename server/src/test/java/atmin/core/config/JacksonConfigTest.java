package atmin.core.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JacksonConfigTest {

    @Test
    void objectMapperSerializesJavaTimeValues() {
        ObjectMapper objectMapper = new JacksonConfig().objectMapper();
        LocalDateTime timestamp = LocalDateTime.of(2026, 8, 18, 18, 5, 59);

        String json = assertDoesNotThrow(() -> objectMapper.writeValueAsString(Map.of("timestamp", timestamp)));

        assertTrue(json.contains("2026-08-18T18:05:59"));
    }
}
