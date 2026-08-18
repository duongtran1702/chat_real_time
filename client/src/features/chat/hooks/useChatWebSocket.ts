import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';
import type { Message } from '../store/useChatStore';
import { api } from '../../../infra/api';
import { webSocketEndpoint } from '../../../infra/serverUrl';

interface UseChatOptions {
  token: string | null;
  conversationId: string | null;
  userId: string | null;
  onProfileUpdated?: (update: ProfileUpdate) => void;
}

export interface ProfileUpdate {
  userId: string;
  fullName: string;
  avatarUrl: string;
}

export function useChatWebSocket({ token, conversationId, userId, onProfileUpdated }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, { online: boolean }>>({});
  const [isConnected, setIsConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const conversationIdRef = useRef(conversationId);
  const subscriptionRef = useRef<StompSubscription | null>(null);
  const readSubRef = useRef<StompSubscription | null>(null);
  const markAsReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileUpdatedRef = useRef(onProfileUpdated);

  useEffect(() => {
    profileUpdatedRef.current = onProfileUpdated;
  }, [onProfileUpdated]);

  const subscribeToConversation = useCallback((client: Client, convId: string) => {
    subscriptionRef.current?.unsubscribe();
    readSubRef.current?.unsubscribe();
    setMessages([]);

    void api.get(`/chat/conversations/${convId}/messages`, { params: { size: 100 } })
      .then((response) => {
        const history = (response.data?.data ?? []) as Message[];
        setMessages((current) => {
          const byId = new Map(current.map((message) => [message.id, message]));
          history.forEach((message) => byId.set(message.id, message));
          return Array.from(byId.values()).sort(
            (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
          );
        });
        client.publish({
          destination: '/app/chat.markAsRead',
          body: JSON.stringify({ conversationId: convId }),
        });
      })
      .catch(() => {
        setMessages([]);
        toast.error('Không thể tải lịch sử tin nhắn');
      });

    subscriptionRef.current = client.subscribe(`/topic/conversation/${convId}`, (stompMessage: IMessage) => {
      const newMessage: Message = JSON.parse(stompMessage.body);

      setMessages((current) => {
        if (current.some((message) => message.id === newMessage.id)) return current;

        const temporaryIndex = newMessage.clientMessageId
          ? current.findIndex((message) => message.clientMessageId === newMessage.clientMessageId)
          : -1;

        if (temporaryIndex !== -1) {
          const updatedMessages = [...current];
          updatedMessages[temporaryIndex] = newMessage;
          return updatedMessages;
        }
        return [...current, newMessage];
      });

      if (newMessage.senderId !== userId) {
        if (markAsReadTimeoutRef.current) clearTimeout(markAsReadTimeoutRef.current);
        markAsReadTimeoutRef.current = setTimeout(() => {
          client.publish({
            destination: '/app/chat.markAsRead',
            body: JSON.stringify({ conversationId: convId }),
          });
        }, 1000);
      }
    });

    readSubRef.current = client.subscribe(`/topic/conversation/${convId}/read`, (stompMessage: IMessage) => {
      const { readerId } = JSON.parse(stompMessage.body) as { readerId: string };
      setMessages((current) => current.map((message) => (
        message.senderId !== readerId && message.status !== 'READ'
          ? { ...message, status: 'READ' }
          : message
      )));
    });
  }, [userId]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
    if (clientRef.current?.connected && conversationId) {
      subscribeToConversation(clientRef.current, conversationId);
    }
  }, [conversationId, subscribeToConversation]);

  useEffect(() => {
    if (!token || !userId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(webSocketEndpoint),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      setIsConnected(true);
      client.subscribe('/topic/presence', (stompMessage: IMessage) => {
        const data = JSON.parse(stompMessage.body) as { userId: string; online: boolean };
        setPresenceMap((current) => ({
          ...current,
          [data.userId]: { online: data.online },
        }));
      });
      client.publish({ destination: '/app/presence.sync', body: '{}' });
      if (profileUpdatedRef.current) {
        client.subscribe('/topic/profile-updates', (stompMessage: IMessage) => {
          const update = JSON.parse(stompMessage.body) as ProfileUpdate;
          profileUpdatedRef.current?.(update);
        });
      }

      if (conversationIdRef.current) {
        subscribeToConversation(client, conversationIdRef.current);
      }
    };
    client.onDisconnect = () => setIsConnected(false);
    client.onWebSocketClose = () => setIsConnected(false);

    client.activate();
    clientRef.current = client;

    return () => {
      setIsConnected(false);
      void client.deactivate();
      if (markAsReadTimeoutRef.current) clearTimeout(markAsReadTimeoutRef.current);
    };
  }, [subscribeToConversation, token, userId]);

  const sendMessage = useCallback((content: string, replyTo?: { id: string; senderId: string; content: string } | null) => {
    if (!clientRef.current?.connected || !conversationId || !userId) {
      toast.error('Mất kết nối. Vui lòng chờ kết nối lại rồi gửi tin nhắn.');
      return false;
    }

    const clientMessageId = crypto.randomUUID();
    const temporaryMessage: Message = {
      id: `temp-${clientMessageId}`,
      conversationId,
      senderId: userId,
      clientMessageId,
      content,
      status: 'SENT',
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      repliedMessage: replyTo ?? null,
    };
    setMessages((current) => [...current, temporaryMessage]);

    const payload: Record<string, string> = { content, conversationId, clientMessageId };
    if (replyTo?.id) {
      payload.replyToMessageId = replyTo.id;
    }

    clientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(payload),
    });
    return true;
  }, [conversationId, userId]);

  return { messages, presenceMap, sendMessage, isConnected, stompClient: clientRef.current };
}
