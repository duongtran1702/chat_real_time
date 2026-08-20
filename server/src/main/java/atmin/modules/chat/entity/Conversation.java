package atmin.modules.chat.entity;

import atmin.core.base.BaseEntity;
import atmin.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(
    name = "conversations",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_private_conversation", columnNames = {"user_low_id", "user_high_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Conversation extends BaseEntity {

    @Id
    @Column(length = 50)
    private String id = UUID.randomUUID().toString();

    @Column(length = 255)
    private String name; // Tên nhóm (nếu là group)

    @Column(nullable = false)
    private boolean isGroup = false;

    @Column(name = "user_low_id", length = 50)
    private String userLowId;

    @Column(name = "user_high_id", length = 50)
    private String userHighId;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "conversation_participants",
            joinColumns = @JoinColumn(name = "conversation_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants = new HashSet<>();
}
