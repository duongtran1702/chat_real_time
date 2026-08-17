import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { Conversation } from '../store/useChatStore';
import { UserAvatar } from './UserAvatar';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  presenceMap: Record<string, { online: boolean }>;
  currentUserId: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  presenceMap,
  currentUserId,
}) => {
  const [searchText, setSearchText] = useState('');
  const normalizedSearchText = searchText.trim().toLocaleLowerCase('vi');
  const visibleConversations = conversations.filter((conversation) => {
    const otherParticipant = conversation.participants.find(({ id }) => id !== currentUserId);
    return !normalizedSearchText
      || otherParticipant?.fullName.toLocaleLowerCase('vi').includes(normalizedSearchText);
  });

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 sm:pt-5">
        <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-slate-950 sm:text-[30px]">Đoạn chat</h1>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Tìm kiếm trên CloseFriend"
            aria-label="Tìm kiếm cuộc trò chuyện"
            className="h-9 w-full rounded-full border-0 bg-[#f0f2f5] pl-9 pr-4 text-[15px] text-slate-800 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#0084ff]/30"
          />
        </div>
      </div>
      
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {visibleConversations.map((conv) => {
          const otherParticipant = conv.participants.find(({ id }) => id !== currentUserId);
          const isOnline = otherParticipant
            ? presenceMap[otherParticipant.id]?.online ?? otherParticipant.online
            : false;

          return (
            <button
              type="button"
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 ${
                activeId === conv.id 
                  ? 'bg-[#eaf3ff]' 
                  : 'hover:bg-[#f2f2f2]'
              }`}
            >
              <div className="relative">
                <UserAvatar user={otherParticipant} className="h-14 w-14 shadow-none ring-0" />
                {isOnline && (
                  <div className="absolute bottom-0.5 right-0.5 z-10 h-3.5 w-3.5 rounded-full border-[2.5px] border-white bg-[#31a24c]"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-[15px] font-semibold text-slate-950">
                  {otherParticipant?.fullName || 'Người dùng'}
                </h3>
                <p className={`truncate text-[13px] ${isOnline ? 'font-medium text-[#0084ff]' : 'text-slate-500'}`}>
                  {isOnline ? 'Đang hoạt động' : 'Đang ngoại tuyến'}
                </p>
              </div>
            </button>
          );
        })}
        {visibleConversations.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-gray-500">
            {conversations.length === 0 ? 'Chưa tìm thấy cuộc trò chuyện của hai bạn.' : 'Không tìm thấy người phù hợp.'}
          </p>
        )}
      </div>
    </div>
  );
};
