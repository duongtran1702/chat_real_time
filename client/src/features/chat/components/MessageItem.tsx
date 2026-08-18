import React, { useCallback } from 'react';
import type { Message, User } from '../store/useChatStore';
import { UserAvatar } from './UserAvatar';
import { BotAvatar } from './BotAvatar';
import { Check, Reply } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isMine: boolean;
  isLastInGroup: boolean;
  recipient: User | null | undefined;
  sender: User | null | undefined;
  showDeliveryStatus: boolean;
  onReply?: (message: Message) => void;
  onScrollToMessage?: (messageId: string) => void;
  participants?: User[];
}

const formatMessageTime = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) {
    return time;
  }
  const dateFormatted = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time}, ${dateFormatted}`;
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMine,
  isLastInGroup,
  recipient,
  sender,
  showDeliveryStatus,
  onReply,
  onScrollToMessage,
  participants,
}) => {
  const isBot = message.senderId === 'bot_closefriend';
  const isRead = message.status === 'READ';
  const contentParts = message.type === 'TEXT' ? message.content.split(/(@CloseFriend)/gi) : [];
  const replied = message.repliedMessage;

  const handleReply = useCallback(() => {
    onReply?.(message);
  }, [onReply, message]);

  const handleQuoteClick = useCallback(() => {
    if (replied?.id) {
      onScrollToMessage?.(replied.id);
    }
  }, [replied, onScrollToMessage]);

  const getRepliedSenderName = () => {
    if (!replied) return '';
    if (replied.senderId === 'bot_closefriend') return 'Chat Together AI';
    const participant = participants?.find((p) => p.id === replied.senderId);
    return participant?.fullName ?? 'Người dùng';
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={`group/row relative flex w-full min-w-0 items-end gap-1.5 sm:gap-2 hover:z-20 ${showDeliveryStatus ? 'mb-7' : isLastInGroup ? 'mb-4' : 'mb-1.5'} ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
    >
      {isBot && isLastInGroup ? (
        <BotAvatar className="h-7 w-7 sm:h-8 sm:w-8" />
      ) : !isMine && !isBot && isLastInGroup ? (
        <UserAvatar user={sender} className="h-7 w-7 flex-shrink-0 shadow-sm sm:h-8 sm:w-8" />
      ) : !isMine ? (
        <span className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" aria-hidden="true" />
      ) : null}
      <div
        tabIndex={0}
        className={`group/message relative min-w-0 max-w-[76%] rounded-[18px] px-3 py-[7px] text-[15px] outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0066ff]/30 sm:max-w-[70%] lg:max-w-[62%] hover:z-10 focus:z-10 ${
          isMine
            ? 'rounded-br-[5px] bg-gradient-to-br from-[#0066ff] to-[#4d7cff] text-white shadow-sm shadow-blue-500/15'
            : isBot
            ? 'rounded-bl-[5px] bg-gradient-to-br from-[#eef2ff] to-[#e8ecff] text-slate-900 shadow-sm shadow-indigo-500/5 border border-indigo-100/40'
            : 'rounded-bl-[5px] bg-white text-slate-950 shadow-sm shadow-black/5 border border-black/[0.04]'
        }`}
      >
        {isBot && (
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#4d6ad9]">
            <span>Chat Together AI</span>
            <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] uppercase text-[#0066ff] shadow-sm">Bot</span>
          </div>
        )}

        {/* Quote block khi reply */}
        {replied && (
          <button
            type="button"
            onClick={handleQuoteClick}
            className={`reply-quote-block ${isMine ? 'reply-quote-mine' : 'reply-quote-other'}`}
            title="Nhấn để xem tin nhắn gốc"
          >
            <span className="reply-quote-sender">{getRepliedSenderName()}</span>
            <span className="reply-quote-content">{replied.type === 'IMAGE' ? '📷 Ảnh' : replied.content}</span>
          </button>
        )}
        
        {message.type === 'IMAGE' ? (
          <a href={message.content} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[12px]">
            <img
              src={message.content}
              alt="Ảnh trong cuộc trò chuyện"
              loading="lazy"
              className="max-h-[360px] w-auto max-w-full object-contain"
            />
          </a>
        ) : <p className="message-content whitespace-pre-wrap leading-[1.42]">
          {contentParts.map((contentPart, index) => (
            contentPart.toLocaleLowerCase('vi') === '@closefriend' ? (
              <span
                key={`${contentPart}-${index}`}
                className={`font-bold ${isMine ? 'text-blue-100' : 'text-[#0066ff]'}`}
              >
              {contentPart}
              </span>
            ) : contentPart
          ))}
        </p>}

        {/* Nút Reply — hiện khi hover */}
        {onReply && (
          <button
            type="button"
            onClick={handleReply}
            className={`reply-action-btn ${isMine ? 'reply-action-mine' : 'reply-action-other'}`}
            title="Trả lời"
            aria-label="Trả lời tin nhắn này"
          >
            <Reply size={13} />
          </button>
        )}
        
        {showDeliveryStatus ? (
          <div className="absolute -bottom-[22px] right-0 flex h-4 items-center gap-1.5 whitespace-nowrap text-[10px] font-medium z-10">
            <span className="pointer-events-none text-slate-400 opacity-0 transition-all duration-200 group-hover/message:opacity-100 group-focus/message:opacity-100 rounded-full bg-white/95 px-1.5 shadow-sm backdrop-blur-sm">
              {formatMessageTime(message.createdAt)}
            </span>
            {isRead ? (
              <span className="flex items-center gap-1 font-semibold text-[#0066ff]" title="Người nhận đã xem tin nhắn">
                <UserAvatar user={recipient} className="h-4 w-4 shadow-none ring-0" />
                Đã xem
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-slate-400" title="Người nhận chưa xem tin nhắn">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-300">
                  <Check size={9} strokeWidth={2.5} aria-hidden="true" />
                </span>
                Chưa xem
              </span>
            )}
          </div>
        ) : (
          <div
            className={`pointer-events-none absolute -bottom-[15px] whitespace-nowrap text-[9px] font-medium text-slate-400 opacity-0 transition-all duration-200 group-hover/message:opacity-100 group-focus/message:opacity-100 rounded-full bg-white/95 px-1.5 shadow-sm backdrop-blur-sm z-10 ${isMine ? 'right-1' : 'left-1'}`}
          >
            {formatMessageTime(message.createdAt)}
          </div>
        )}
      </div>
      {isMine && isLastInGroup ? (
        <UserAvatar user={sender} className="hidden h-8 w-8 lg:flex" />
      ) : isMine ? (
        <span className="hidden h-8 w-8 shrink-0 lg:block" aria-hidden="true" />
      ) : null}
    </div>
  );
};
