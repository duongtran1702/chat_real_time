import { create } from 'zustand';

export interface User {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    online: boolean;
}

export interface Conversation {
    id: string;
    group: boolean;
    participants: User[];
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    clientMessageId: string | null;
    content: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
    type: 'TEXT' | 'IMAGE' | 'SYSTEM';
    createdAt: string;
}

interface ChatState {
    activeConversationId: string | null;
    conversations: Conversation[];
    setActiveConversationId: (id: string | null) => void;
    setConversations: (conversations: Conversation[]) => void;
    updateParticipantProfile: (userId: string, profile: Pick<User, 'fullName' | 'avatarUrl'>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    activeConversationId: null,
    conversations: [],
    setActiveConversationId: (id) => set({ activeConversationId: id }),
    setConversations: (conversations) => set((state) => ({
        conversations,
        activeConversationId: conversations.some(({ id }) => id === state.activeConversationId)
            ? state.activeConversationId
            : conversations[0]?.id ?? null,
    })),
    updateParticipantProfile: (userId, profile) => set((state) => ({
        conversations: state.conversations.map((conversation) => ({
            ...conversation,
            participants: conversation.participants.map((participant) => (
                participant.id === userId ? { ...participant, ...profile } : participant
            )),
        })),
    })),
}));
