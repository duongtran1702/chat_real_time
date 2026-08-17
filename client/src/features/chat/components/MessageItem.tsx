import React from 'react';
import type { Message, User } from '../store/useChatStore';
import { UserAvatar } from './UserAvatar';
import { BotAvatar } from './BotAvatar';
import { Check } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isMine: boolean;
  isLastInGroup: boolean;
  recipient: User | null | undefined;
  sender: User | null | undefined;
  showDeliveryStatus: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMine,
  isLastInGroup,
  recipient,
  sender,
  showDeliveryStatus,
}) => {
  const isBot = message.senderId === 'bot_closefriend';
  const isRead = message.status === 'READ';
  const contentParts = message.content.split(/(@CloseFriend)/gi);
  
  return (
    <div className={`flex w-full min-w-0 items-end gap-1.5 sm:gap-2 ${showDeliveryStatus ? 'mb-7' : isLastInGroup ? 'mb-4' : 'mb-1.5'} ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      {isBot && isLastInGroup ? (
        <BotAvatar className="h-7 w-7 sm:h-8 sm:w-8" />
      ) : !isMine && !isBot && isLastInGroup ? (
        <UserAvatar user={sender} className="h-7 w-7 flex-shrink-0 shadow-sm sm:h-8 sm:w-8" />
      ) : !isMine ? (
        <span className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" aria-hidden="true" />
      ) : null}
      <div
        tabIndex={0}
        className={`group/message relative min-w-0 max-w-[76%] rounded-[18px] px-3 py-[7px] text-[15px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#0084ff]/40 sm:max-w-[70%] lg:max-w-[62%] ${
          isMine
            ? 'rounded-br-[5px] bg-[#0084ff] text-white'
            : isBot
            ? 'rounded-bl-[5px] bg-[#eaf3ff] text-slate-900'
            : 'rounded-bl-[5px] bg-[#e4e6eb] text-slate-950'
        }`}
      >
        {isBot && (
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-[#006edc]">
            <span>CloseFriend AI</span>
            <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] uppercase text-[#0084ff]">Bot</span>
          </div>
        )}
        
        <p className="message-content whitespace-pre-wrap leading-[1.42]">
          {contentParts.map((contentPart, index) => (
            contentPart.toLocaleLowerCase('vi') === '@closefriend' ? (
              <span
                key={`${contentPart}-${index}`}
                className={`font-bold ${isMine ? 'text-[#d9efff]' : 'text-[#0084ff]'}`}
              >
                {contentPart}
              </span>
            ) : contentPart
          ))}
        </p>
        
        {showDeliveryStatus ? (
          <div className="absolute -bottom-[22px] right-0 flex h-4 items-center gap-1.5 whitespace-nowrap text-[10px] font-medium">
            <span className="pointer-events-none text-slate-400 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus/message:opacity-100">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isRead ? (
              <span className="flex items-center gap-1 font-semibold text-[#0084ff]" title="Người nhận đã xem tin nhắn">
                <UserAvatar user={recipient} className="h-4 w-4 shadow-none ring-0" />
                Đã xem
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-slate-500" title="Người nhận chưa xem tin nhắn">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-400">
                  <Check size={9} strokeWidth={2.5} aria-hidden="true" />
                </span>
                Chưa xem
              </span>
            )}
          </div>
        ) : (
          <div
            className={`pointer-events-none absolute -bottom-[15px] whitespace-nowrap text-[9px] font-medium text-slate-400 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus/message:opacity-100 ${isMine ? 'right-1' : 'left-1'}`}
          >
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
