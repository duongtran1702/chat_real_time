import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { MessageItem } from './MessageItem';
import { Bot, ChevronLeft, Send, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { UserAvatar } from './UserAvatar';
import { MentionSuggestions } from './MentionSuggestions';
import { useBotMention } from '../hooks/useBotMention';

interface ChatBoxProps {
  presenceMap: Record<string, { online: boolean }>;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ presenceMap }) => {
  const { activeConversationId, conversations, setActiveConversationId } = useChatStore();
  const activeConv = conversations.find(c => c.id === activeConversationId);
  
  const { token, currentUser } = useAuthStore();
  const currentUserId = currentUser?.id ?? null;
  const otherParticipant = activeConv?.participants.find(({ id }) => id !== currentUserId);
  const isOtherParticipantOnline = otherParticipant
    ? presenceMap[otherParticipant.id]?.online ?? otherParticipant.online
    : false;
  
  const { messages, sendMessage, isConnected } = useChatWebSocket({
    token,
    conversationId: activeConversationId,
    userId: currentUserId
  });
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    handleInputChange,
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (sendMessage(inputText.trim())) {
      setInputText('');
    }
  };

  const lastOwnMessageIndex = messages.reduce(
    (lastIndex, message, index) => message.senderId === currentUserId ? index : lastIndex,
    -1,
  );

  if (!activeConversationId) {
    return (
      <div className="flex-1 bg-white/20 hidden md:flex items-center justify-center backdrop-blur-sm">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 bg-indigo-50/50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100/50 shadow-inner">
             <UserIcon size={36} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Bắt đầu trò chuyện</h2>
          <p className="text-gray-500 mt-2 font-light">Chọn một người dùng bên trái để nhắn tin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="z-20 flex min-h-16 min-w-0 shrink-0 items-center overflow-hidden border-b border-[#e5e7eb] bg-white px-2.5 sm:px-4 lg:px-5">
        <button 
          type="button"
          onClick={() => setActiveConversationId(null)}
          className="mr-1 flex h-10 w-10 items-center justify-center rounded-full text-[#0084ff] transition-colors hover:bg-[#f0f2f5] sm:mr-2 md:hidden"
          aria-label="Quay lại danh sách trò chuyện"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="relative">
          <UserAvatar user={otherParticipant} className="h-10 w-10 shadow-none ring-0" />
          {isOtherParticipantOnline && isConnected && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" aria-hidden="true" />
          )}
        </div>
        <div className="ml-3 min-w-0 sm:ml-4">
          <h2 className="truncate text-[15px] font-bold text-slate-950">{otherParticipant?.fullName || 'Người dùng'}</h2>
          <p className="text-xs text-slate-500">
            {!isConnected ? 'Đang kết nối lại...' : isOtherParticipantOnline ? 'Đang hoạt động' : 'Đang ngoại tuyến'}
          </p>
        </div>
        <div className="ml-auto hidden shrink-0 items-center gap-2 rounded-full bg-[#eaf3ff] px-3 py-1.5 text-xs font-semibold text-[#0084ff] lg:flex">
          <Bot size={15} aria-hidden="true" />
          CloseFriend AI
        </div>
      </header>

      {/* Message Area */}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-white px-2.5 py-3 scroll-smooth sm:px-5 sm:py-5 lg:px-8">
        {messages.length === 0 && (
          <div className="flex h-full min-h-56 items-center justify-center px-6 text-center">
            <div className="max-w-xs">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf3ff] text-[#0084ff]">
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
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative min-w-0 shrink-0 bg-white px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-3 sm:py-2.5">
        <form onSubmit={handleSend} className="relative flex w-full min-w-0 max-w-full items-center gap-1 sm:gap-1.5">
          <MentionSuggestions isOpen={isSuggestionOpen} onSelect={selectBotMention} />
          <button
            type="button"
            onClick={insertBotMention}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0084ff] transition hover:bg-[#f0f2f5] active:scale-95 sm:h-10 sm:w-10"
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
            className="h-10 min-w-0 flex-1 rounded-full border-0 bg-[#f0f2f5] px-4 text-[16px] text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#0084ff]/30"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0084ff] text-white transition-colors hover:bg-[#0078e8] active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-[#0084ff] sm:h-10 sm:w-10"
            aria-label="Gửi tin nhắn"
          >
            <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
};
