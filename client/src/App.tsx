import { useCallback, useEffect, useState } from 'react';
import { BotAvatar, ChatBox, ConversationList, UserAvatar, useChatStore, useChatWebSocket, type ProfileUpdate } from './features/chat';
import { Login } from './features/auth/components/Login';
import { Register } from './features/auth/components/Register';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { Camera, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { api } from './infra/api';
import { ProfileModal } from './features/profile';
import { useVisualViewport } from './hooks/useVisualViewport';

function App() {
  useVisualViewport();
  const { conversations, activeConversationId, setActiveConversationId, setConversations, updateParticipantProfile } = useChatStore();
  const { token, currentUser, logout, updateUser, updateProfile } = useAuthStore();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleProfileUpdated = useCallback((update: ProfileUpdate) => {
    const profile = { fullName: update.fullName, avatarUrl: update.avatarUrl };
    updateParticipantProfile(update.userId, profile);
    if (useAuthStore.getState().currentUser?.id === update.userId) {
      updateProfile(profile);
    }
  }, [updateParticipantProfile, updateProfile]);
  
  // Initialize websocket just to get presence map for the sidebar
  const { presenceMap } = useChatWebSocket({
    token,
    conversationId: null,
    userId: currentUser?.id || null,
    onProfileUpdated: handleProfileUpdated,
  });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void api.get('/chat/conversations').then((response) => {
      if (!cancelled) setConversations(response.data?.data ?? []);
    }).catch(() => {
      if (!cancelled) setConversations([]);
    });

    return () => { cancelled = true; };
  }, [setConversations, token, currentUser]);

  if (!token || !currentUser) {
     return (
        <>
          <Toaster position="top-right" />
          {isRegistering ? (
            <Register onSwitchToLogin={() => setIsRegistering(false)} />
          ) : (
            <Login onSwitchToRegister={() => setIsRegistering(true)} />
          )}
        </>
     );
  }

  return (
    <main className="app-viewport flex w-full max-w-[100vw] overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50/30 to-indigo-50/20 font-sans antialiased">
      <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
      
      {/* Sidebar - Conversation List with Logout */}
      <aside className={`z-10 w-full flex-col border-r border-black/[0.04] glass-subtle transition-all duration-200 md:w-[340px] md:shrink-0 lg:w-[360px] ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <ConversationList 
              conversations={conversations} 
              activeId={activeConversationId} 
              onSelect={setActiveConversationId}
              presenceMap={presenceMap}
              currentUserId={currentUser.id}
              onNewConversation={() => {
                // Fetch lại danh sách conversation
                api.get('/chat/conversations').then((res) => {
                  setConversations(res.data?.data ?? []);
                }).catch(console.error);
              }}
            />
          </div>
          <div className="glass-elevated flex items-center justify-between border-t border-black/[0.04] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="group relative rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                    title="Chỉnh sửa hồ sơ"
                    aria-label="Chỉnh sửa hồ sơ"
                  >
                    <UserAvatar user={currentUser} className="h-9 w-9" />
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#0066ff] to-[#5c7cfa] text-white shadow-sm">
                      <Camera size={8} strokeWidth={3} />
                    </span>
                  </button>
                  <div className="flex flex-col">
                     <span className="text-sm font-bold text-gray-800 truncate max-w-[120px]">{currentUser.fullName}</span>
                     <span className="text-xs font-medium text-emerald-500">Đang trực tuyến</span>
                  </div>
              </div>
              <button 
                  onClick={async () => {
                      try {
                          await api.post('/auth/logout');
                      } catch (e) {
                          console.error('Logout API failed', e);
                      } finally {
                          logout();
                      }
                  }} 
                  title="Đăng xuất"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 active:scale-95"
              >
                  <LogOut size={18} />
              </button>
          </div>
      </aside>

      {/* Main Chat Area */}
      {activeConversationId ? (
        <section className="min-w-0 flex-1 overflow-hidden transition-all duration-300">
          <ChatBox presenceMap={presenceMap} />
        </section>
      ) : (
        <div className="relative hidden flex-1 items-center justify-center chat-bg-pattern md:flex">
          <div className="text-center animate-slide-up">
            <BotAvatar className="mx-auto mb-6 h-24 w-24 animate-float" />
            <h2 className="text-3xl font-bold text-slate-900">Chat Together</h2>
            <p className="mt-3 text-lg font-light text-gray-400">Chọn một cuộc trò chuyện để bắt đầu.</p>
            <p className="mt-2 text-sm font-medium text-gradient">Robot Chat Together luôn sẵn sàng khi bạn cần.</p>
          </div>
        </div>
      )}
      {isAvatarModalOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setIsAvatarModalOpen(false)}
          onUpdated={(updatedUser) => {
            updateUser(updatedUser);
            updateParticipantProfile(updatedUser.id, {
              fullName: updatedUser.fullName,
              avatarUrl: updatedUser.avatarUrl,
            });
          }}
        />
      )}
    </main>
  );
}

export default App;
