package atmin.modules.user.seeder;

import atmin.modules.chat.entity.Conversation;
import atmin.modules.chat.repository.ConversationRepository;
import atmin.modules.user.entity.User;
import atmin.modules.user.entity.UserStatus;
import atmin.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String @NonNull ... args) {
        log.info("Running Database Seeder...");

        User user123 = userRepository.findByUsername("user123").orElseGet(() -> {
            User u = new User();
            u.setId("user123");
            u.setUsername("user123");
            u.setFullName("Nguyễn Văn User");
            u.setPassword(passwordEncoder.encode("12345678"));
            u.setStatus(UserStatus.ACTIVE);
            return userRepository.save(u);
        });
        if (user123.getAvatarUrl() == null || user123.getAvatarUrl().isBlank()) {
            user123.setAvatarUrl("/avatars/user123.svg");
        }
        user123.setOnline(false);
        user123 = userRepository.save(user123);

        User atmin123 = userRepository.findByUsername("atmin123").orElseGet(() -> {
            User u = new User();
            u.setId("atmin123");
            u.setUsername("atmin123");
            u.setFullName("Trần Trí Admin");
            u.setPassword(passwordEncoder.encode("atmin123"));
            u.setStatus(UserStatus.ACTIVE);
            return userRepository.save(u);
        });
        if (atmin123.getAvatarUrl() == null || atmin123.getAvatarUrl().isBlank()) {
            atmin123.setAvatarUrl("/avatars/atmin123.svg");
        }
        atmin123.setOnline(false);
        atmin123 = userRepository.save(atmin123);

        // Hệ thống chỉ có một cuộc trò chuyện riêng tư giữa đúng hai tài khoản.
        Conversation conversation = conversationRepository.findById("conv-demo")
                .orElseGet(Conversation::new);
        conversation.setId("conv-demo");
        conversation.setName(null);
        conversation.setGroup(false);
        conversation.setParticipants(new HashSet<>(Set.of(user123, atmin123)));
        conversationRepository.save(conversation);
        log.info("Đã đồng bộ cuộc trò chuyện riêng tư giữa hai tài khoản");

        log.info("Database Seeding Completed.");
    }
}
