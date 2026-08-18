import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { ReplyPreview } from './ReplyPreview';
import { Bot, ChevronLeft, Send, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { UserAvatar } from './UserAvatar';
import { MentionSuggestions } from './MentionSuggestions';
import { useBotMention } from '../hooks/useBotMention';
import type { Message } from '../store/useChatStore';

interface ChatBoxProps {
  presenceMap: Record<string, { online: boolean }>;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ presenceMap }) => {
  const { activeConversationId, conversations, setActiveConversationId, replyingTo, setReplyingTo, clearReplyingTo } = useChatStore();
  const activeConv = conversations.find(c => c.id === activeConversationId);
  
  const { token, currentUser } = useAuthStore();
  const currentUserId = currentUser?.id ?? null;
  const otherParticipant = activeConv?.participants.find(({ id }) => id !== currentUserId);
  const isOtherParticipantOnline = otherParticipant
    ? presenceMap[otherParticipant.id]?.online ?? otherParticipant.online
    : false;
  
  const { messages, sendMessage, isConnected, stompClient } = useChatWebSocket({
    token,
    conversationId: activeConversationId,
    userId: currentUserId
  });

  const { typingUsers, emitTyping } = useTypingIndicator({
    client: stompClient,
    conversationId: activeConversationId,
    currentUserId,
  });
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    handleInputChange: botHandleInputChange,
    handleInputKeyDown,
    insertBotMention,
    isSuggestionOpen,
    selectBotMention,
  } = useBotMention({ inputRef, inputText, setInputText });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const keepComposerVisible = () => {
    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }, 150);
  };

  // Wrapper onChange: gọi bot mention handler + emit typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    botHandleInputChange(e);
    emitTyping();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const replyPayload = replyingTo
      ? { id: replyingTo.id, senderId: replyingTo.senderId, content: replyingTo.content }
      : null;
    if (sendMessage(inputText.trim(), replyPayload)) {
      setInputText('');
      clearReplyingTo();
    }
  };

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  }, [setReplyingTo]);

  const handleScrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('message-highlight-flash');
      setTimeout(() => element.classList.remove('message-highlight-flash'), 1500);
    }
  }, []);

  const getReplyingSenderName = () => {
    if (!replyingTo) return '';
    if (replyingTo.senderId === 'bot_closefriend') return 'CloseFriend AI';
    if (replyingTo.senderId === currentUserId) return 'Chính bạn';
    const participant = activeConv?.participants.find(({ id }) => id === replyingTo.senderId);
    return participant?.fullName ?? 'Người dùng';
  };

  const lastOwnMessageIndex = messages.reduce(
    (lastIndex, message, index) => message.senderId === currentUserId ? index : lastIndex,
    -1,
  );

  if (!activeConversationId) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center chat-bg-pattern">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 text-[#0066ff]/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100/50 shadow-inner">
             <UserIcon size={36} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Bắt đầu trò chuyện</h2>
          <p className="text-gray-400 mt-2 font-light">Chọn một người dùng bên trái để nhắn tin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Header — glass blur */}
      <header className="glass-elevated z-20 flex min-h-16 min-w-0 shrink-0 items-center overflow-hidden border-b border-black/[0.04] px-2.5 sm:px-4 lg:px-5">
        <button 
          type="button"
          onClick={() => setActiveConversationId(null)}
          className="mr-1 flex h-10 w-10 items-center justify-center rounded-full text-[#0066ff] transition-all duration-200 hover:bg-[#0066ff]/[0.06] active:scale-95 sm:mr-2 md:hidden"
          aria-label="Quay lại danh sách trò chuyện"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="relative">
          <UserAvatar user={otherParticipant} className="h-10 w-10 shadow-none ring-0" />
          {isOtherParticipantOnline && isConnected && (
            <span className="online-dot absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
          )}
        </div>
        <div className="ml-3 min-w-0 sm:ml-4">
          <h2 className="truncate text-[15px] font-bold text-slate-900">{otherParticipant?.fullName || 'Người dùng'}</h2>
          <p className={`text-xs font-medium ${!isConnected ? 'text-amber-500' : isOtherParticipantOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
            {!isConnected ? 'Đang kết nối lại...' : isOtherParticipantOnline ? 'Đang hoạt động' : 'Đang ngoại tuyến'}
          </p>
        </div>
        <div className="ml-auto hidden shrink-0 items-center gap-2 rounded-full border border-[#0066ff]/10 bg-[#0066ff]/[0.06] px-3 py-1.5 text-xs font-semibold text-[#0066ff] lg:flex">
          <Bot size={15} aria-hidden="true" />
          CloseFriend AI
        </div>
      </header>

      {/* Message Area — dot pattern background */}
      <div ref={messagesContainerRef} className="chat-bg-pattern min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2.5 py-3 scroll-smooth sm:px-5 sm:py-5 lg:px-8">
        {messages.length === 0 && (
          <div className="flex h-full min-h-56 items-center justify-center px-6 text-center">
            <div className="max-w-xs animate-fade-in-up">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#edf2ff] to-[#e8e0ff] text-[#0066ff] shadow-sm">
                <Send size={24} aria-hidden="true" />
              </div>
              <p className="font-semibold text-slate-700">Bắt đầu cuộc trò chuyện</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">Hãy gửi lời chào đầu tiên cho {otherParticipant?.fullName || 'người ấy'}.</p>
            </div>
          </div>
        )}
        {messages.map((msg, index) => {
          const nextMessage = messages[index + 1];
          return (
            <MessageItem
              key={msg.id}
              message={msg}
              isMine={msg.senderId === currentUserId}
              isLastInGroup={!nextMessage || nextMessage.senderId !== msg.senderId}
              recipient={otherParticipant}
              sender={activeConv?.participants.find(({ id }) => id === msg.senderId)}
              showDeliveryStatus={index === lastOwnMessageIndex}
              onReply={handleReply}
              onScrollToMessage={handleScrollToMessage}
              participants={activeConv?.participants}
            />
          );
        })}
        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — glass effect */}
      <div className="glass-elevated relative min-w-0 shrink-0 border-t border-black/[0.04] px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-3 sm:py-2.5">
        {/* Reply preview bar */}
        {replyingTo && (
          <ReplyPreview
            message={replyingTo}
            senderName={getReplyingSenderName()}
            onCancel={clearReplyingTo}
          />
        )}
        <form onSubmit={handleSend} className="relative flex w-full min-w-0 max-w-full items-center gap-1 sm:gap-1.5">
          <MentionSuggestions isOpen={isSuggestionOpen} onSelect={selectBotMention} />
          <button
            type="button"
            onClick={insertBotMention}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0066ff] transition-all duration-200 hover:bg-[#0066ff]/[0.06] active:scale-95 sm:h-10 sm:w-10"
            title="Gọi CloseFriend AI"
            aria-label="Thêm @CloseFriend vào tin nhắn"
          >
            <Bot size={20} aria-hidden="true" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={keepComposerVisible}
            placeholder="Nhập tin nhắn..."
            maxLength={4000}
            aria-label="Nội dung tin nhắn"
            aria-autocomplete="list"
            aria-expanded={isSuggestionOpen}
            autoComplete="off"
            autoCorrect="off"
            className="h-10 min-w-0 flex-1 rounded-full border border-black/[0.06] bg-slate-50/80 px-4 text-[16px] text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]/15"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95 sm:h-10 sm:w-10 ${
              inputText.trim() && isConnected
                ? 'bg-gradient-to-br from-[#0066ff] to-[#5c7cfa] text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30'
                : 'bg-transparent text-[#0066ff]/40 cursor-not-allowed'
            }`}
            aria-label="Gửi tin nhắn"
          >
            <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
};
