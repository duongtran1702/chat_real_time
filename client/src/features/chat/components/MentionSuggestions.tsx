import { CornerDownLeft } from 'lucide-react';
import { BotAvatar } from './BotAvatar';

interface MentionSuggestionsProps {
  isOpen: boolean;
  onSelect: () => void;
}

export function MentionSuggestions({ isOpen, onSelect }: MentionSuggestionsProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-[calc(100%+.5rem)] left-0 z-30 w-[min(19rem,calc(100vw-1.25rem))] overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-scale-in"
      role="listbox"
      aria-label="Gợi ý nhắc đến"
    >
      <p className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Gợi ý</p>
      <button
        type="button"
        role="option"
        aria-selected="true"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-xl bg-[#0066ff]/[0.06] px-2.5 py-2 text-left transition-all duration-200 hover:bg-[#0066ff]/[0.10] hover:shadow-sm active:scale-[0.99]"
      >
        <BotAvatar className="h-9 w-9" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-slate-800">CloseFriend AI</span>
          <span className="block truncate text-xs text-slate-500">Trợ lý robot trong cuộc trò chuyện</span>
        </span>
        <span className="hidden items-center gap-1 text-[10px] font-semibold text-slate-400 sm:flex">
          Enter <CornerDownLeft size={12} aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
