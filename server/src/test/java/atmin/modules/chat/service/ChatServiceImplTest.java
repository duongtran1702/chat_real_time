package atmin.modules.chat.service;

import atmin.modules.chat.dto.MessageRequest;
import atmin.modules.chat.entity.Conversation;
import atmin.modules.chat.entity.Message;
import atmin.modules.chat.repository.ConversationRepository;
import atmin.modules.chat.repository.MessageRepository;
import atmin.modules.chat.service.impl.ChatServiceImpl;
import atmin.modules.user.entity.User;
import atmin.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private ChatServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ChatServiceImpl(
                messageRepository,
                conversationRepository,
                userRepository,
                messagingTemplate,
                eventPublisher
        );
    }

    @Test
    void processMessageRejectsReplyFromAnotherConversation() {
        Conversation currentConversation = conversation("conversation-current");
        Conversation otherConversation = conversation("conversation-other");
        Message originalMessage = new Message();
        originalMessage.setId("message-original");
        originalMessage.setConversation(otherConversation);

        MessageRequest request = new MessageRequest(
                "Nội dung trả lời",
                currentConversation.getId(),
                "01234567-89ab-4cde-8fab-0123456789ab",
                originalMessage.getId()
        );

        when(conversationRepository.findById(currentConversation.getId()))
                .thenReturn(Optional.of(currentConversation));
        when(conversationRepository.existsByIdAndParticipants_Id(currentConversation.getId(), "user-a"))
                .thenReturn(true);
        when(messageRepository.findById(originalMessage.getId())).thenReturn(Optional.of(originalMessage));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.processMessage(request, "user-a")
        );

        assertEquals("Không thể trả lời tin nhắn thuộc phòng chat khác", exception.getMessage());
        verify(messageRepository, never()).save(any(Message.class));
    }

    @Test
    void getOrCreatePrivateConversationLocksUsersInStableOrder() {
        User firstUser = user("user-a");
        User secondUser = user("user-z");
        when(userRepository.findByIdForUpdate("user-a")).thenReturn(Optional.of(firstUser));
        when(userRepository.findByIdForUpdate("user-z")).thenReturn(Optional.of(secondUser));
        when(conversationRepository.findPrivateConversationBetweenUsers("user-z", "user-a"))
                .thenReturn(Optional.empty());

        service.getOrCreatePrivateConversation("user-z", "user-a");

        InOrder order = inOrder(userRepository, conversationRepository);
        order.verify(userRepository).findByIdForUpdate("user-a");
        order.verify(userRepository).findByIdForUpdate("user-z");
        order.verify(conversationRepository).findPrivateConversationBetweenUsers("user-z", "user-a");
        order.verify(conversationRepository).save(any(Conversation.class));
    }

    @Test
    void processImageMessageStoresImageTypeAndBroadcastsIt() {
        Conversation currentConversation = conversation("conversation-current");
        when(conversationRepository.findById(currentConversation.getId()))
                .thenReturn(Optional.of(currentConversation));
        when(conversationRepository.existsByIdAndParticipants_Id(currentConversation.getId(), "user-a"))
                .thenReturn(true);

        service.processImageMessage(
                currentConversation.getId(),
                "https://res.cloudinary.com/demo/image/upload/chat.jpg",
                "01234567-89ab-4cde-8fab-0123456789ab",
                null,
                "user-a"
        );

        verify(messageRepository).save(org.mockito.ArgumentMatchers.argThat(message ->
                message.getType() == Message.MessageType.IMAGE
                        && message.getContent().startsWith("https://res.cloudinary.com/")
        ));
        verify(messagingTemplate).convertAndSend(
                org.mockito.ArgumentMatchers.eq("/topic/conversation/" + currentConversation.getId()),
                any(Object.class)
        );
    }

    private Conversation conversation(String id) {
        Conversation conversation = new Conversation();
        conversation.setId(id);
        return conversation;
    }

    private User user(String id) {
        User user = new User();
        user.setId(id);
        user.setUsername(id);
        user.setFullName(id);
        user.setPassword("encoded-password");
        return user;
    }
}
