import React, { useState } from 'react';
import { MessageCircle, Search } from 'lucide-react';
import type { Conversation } from '../store/useChatStore';
import { UserAvatar } from './UserAvatar';
import { api } from '../../../infra/api';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

interface SearchUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  online: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  presenceMap: Record<string, { online: boolean }>;
  currentUserId: string;
  onNewConversation?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  presenceMap,
  currentUserId,
  onNewConversation,
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  React.useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/users/search?username=${encodeURIComponent(searchText.trim())}`);
        if (response.data.success) {
          setSearchResults(response.data.data || []);
        }
      } catch (error) {
        console.error('Lỗi tìm kiếm bạn bè', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  const handleStartChat = async (userId: string) => {
    try {
      const response = await api.post(`/chat/conversations/user/${userId}`);
      if (response.data.success) {
        setSearchText('');
        setSearchResults([]);
        if (onNewConversation) onNewConversation();
        onSelect(response.data.data.id);
      }
    } catch (error: unknown) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || 'Có lỗi xảy ra khi tạo cuộc trò chuyện');
    }
  };

  const normalizedSearchText = searchText.trim().toLocaleLowerCase('vi');
  const visibleConversations = conversations.filter((conversation) => {
    const otherParticipant = conversation.participants.find(({ id }) => id !== currentUserId);
    return !normalizedSearchText
      || otherParticipant?.fullName.toLocaleLowerCase('vi').includes(normalizedSearchText);
  });

  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5 sm:pt-5">
        <h1 className="text-gradient text-[26px] font-extrabold tracking-[-0.03em] sm:text-[30px]">Đoạn chat</h1>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200" size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Tìm kiếm trên Chat Together"
            aria-label="Tìm kiếm cuộc trò chuyện"
            className="h-9 w-full rounded-full border border-white/60 bg-white/50 pl-9 pr-4 text-[15px] text-slate-800 outline-none backdrop-blur-sm transition-all duration-200 placeholder:text-slate-400 focus:bg-white/80 focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]/20"
          />
        </div>
      </div>
      
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {searchText.trim().length > 0 ? (
          <>
            <div className="px-3 pb-2 pt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isSearching ? 'Đang tìm kiếm...' : 'Kết quả tìm kiếm'}
            </div>
            {searchResults.map((user) => {
              const isOnline = presenceMap[user.id]?.online ?? user.online;
              return (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => handleStartChat(user.id)}
                  className="group flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-all duration-200 hover:bg-black/[0.03] hover:shadow-sm active:scale-[0.99]"
                >
                  <div className="relative">
                    <UserAvatar user={user} className="h-14 w-14 shadow-none ring-0" />
                    {isOnline && (
                      <div className="online-dot absolute bottom-0.5 right-0.5 z-10 h-3.5 w-3.5 rounded-full border-[2.5px] border-white bg-[#22c55e]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-slate-900">
                      {user.fullName || 'Người dùng'}
                    </h3>
                    <p className="truncate text-[13px] text-slate-400">
                      @{user.username}
                    </p>
                  </div>
                </button>
              );
            })}
            {!isSearching && searchResults.length === 0 && (
              <div className="px-3 py-6 text-center text-sm font-medium text-gray-500">
                Không tìm thấy người dùng nào khớp với "{searchText}"
              </div>
            )}
          </>
        ) : (
          <>
            {visibleConversations.map((conv) => {
              const otherParticipant = conv.participants.find(({ id }) => id !== currentUserId);
              const isOnline = otherParticipant
                ? presenceMap[otherParticipant.id]?.online ?? otherParticipant.online
                : false;
              const isActive = activeId === conv.id;

              return (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`group flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0066ff]/[0.07] shadow-sm'
                      : 'hover:bg-black/[0.03] hover:shadow-sm active:scale-[0.99]'
                  }`}
                >
                  <div className="relative">
                    <UserAvatar user={otherParticipant} className="h-14 w-14 shadow-none ring-0" />
                    {isOnline && (
                      <div className="online-dot absolute bottom-0.5 right-0.5 z-10 h-3.5 w-3.5 rounded-full border-[2.5px] border-white bg-[#22c55e]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`truncate text-[15px] font-semibold ${isActive ? 'text-[#0052d9]' : 'text-slate-900'}`}>
                      {otherParticipant?.fullName || 'Người dùng'}
                    </h3>
                    <p className={`truncate text-[13px] ${
                      isActive
                        ? 'font-medium text-[#0066ff]/80'
                        : isOnline
                          ? 'font-medium text-emerald-600'
                          : 'text-slate-400'
                    }`}>
                      {isOnline ? 'Đang hoạt động' : 'Đang ngoại tuyến'}
                    </p>
                  </div>
                  {isActive && (
                    <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#0066ff] to-[#5c7cfa]" />
                  )}
                </button>
              );
            })}
            {visibleConversations.length === 0 && (
              <div className="flex flex-col items-center px-3 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <MessageCircle size={22} />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {conversations.length === 0 ? 'Chưa tìm thấy cuộc trò chuyện của hai bạn.' : 'Không tìm thấy người phù hợp.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
