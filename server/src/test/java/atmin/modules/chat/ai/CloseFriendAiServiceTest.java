package atmin.modules.chat.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CloseFriendAiServiceTest {

    @Test
    void recognizesCloseFriendMentionCaseInsensitively() {
        assertTrue(CloseFriendAiService.isMentioned("@CloseFriend giúp tôi với"));
        assertTrue(CloseFriendAiService.isMentioned("@closefriend xin chào"));
        assertFalse(CloseFriendAiService.isMentioned("@ChatTogether xin chào"));
    }
}
