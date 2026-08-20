import { useCallback, useEffect, useRef, useState } from 'react';
import type { Client, StompSubscription } from '@stomp/stompjs';

interface TypingUser {
  userId: string;
  fullName: string;
}

interface UseTypingIndicatorOptions {
  client: Client | null;
  conversationId: string | null;
  currentUserId: string | null;
}

/**
 * Hook quản lý typing indicator:
 * - Gửi: debounce 500ms khi user gõ phím
 * - Nhận: subscribe STOMP topic, lưu map userId → fullName
 * - Tự ẩn: timeout 3s sau lần nhận cuối
 */
export function useTypingIndicator({ client, conversationId, currentUserId }: UseTypingIndicatorOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const subscriptionRef = useRef<StompSubscription | null>(null);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const sendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<number>(0);

  // Dọn dẹp timeouts khi chuyển conversation
  const clearAllTimeouts = useCallback(() => {
    typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    typingTimeoutsRef.current.clear();
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
      sendTimeoutRef.current = null;
    }
  }, []);

  // Subscribe vào typing topic
  useEffect(() => {
    subscriptionRef.current?.unsubscribe();
    setTypingUsers([]);
    clearAllTimeouts();

    if (!client?.connected || !conversationId || !currentUserId) return;

    subscriptionRef.current = client.subscribe(
      `/topic/conversation/${conversationId}/typing`,
      (stompMessage) => {
        const data = JSON.parse(stompMessage.body) as { userId: string; fullName: string };

        // Bỏ qua typing event của chính mình
        if (data.userId === currentUserId) return;

        setTypingUsers((current) => {
          const exists = current.some((u) => u.userId === data.userId);
          if (!exists) {
            return [...current, { userId: data.userId, fullName: data.fullName }];
          }
          return current;
        });

        // Reset timeout 3s cho user này
        const existingTimeout = typingTimeoutsRef.current.get(data.userId);
        if (existingTimeout) clearTimeout(existingTimeout);

        typingTimeoutsRef.current.set(
          data.userId,
          setTimeout(() => {
            setTypingUsers((current) => current.filter((u) => u.userId !== data.userId));
            typingTimeoutsRef.current.delete(data.userId);
          }, 3000),
        );
      },
    );

    return () => {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
      clearAllTimeouts();
      setTypingUsers([]);
    };
  }, [client, conversationId, currentUserId, clearAllTimeouts]);

  // Gửi typing event — throttle 2s
  const emitTyping = useCallback(() => {
    if (!client?.connected || !conversationId) return;

    const now = Date.now();
    if (now - lastSentRef.current < 2000) return;

    client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId }),
    });
    lastSentRef.current = now;
  }, [client, conversationId]);

  return { typingUsers, emitTyping };
}
