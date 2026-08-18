import { Bot, Sparkles } from 'lucide-react';

interface BotAvatarProps {
  className?: string;
}

export function BotAvatar({ className = 'h-9 w-9' }: BotAvatarProps) {
  return (
    <div
      className={`${className} relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0066ff] to-[#7048e8] text-white ring-2 ring-white shadow-md shadow-blue-500/20 animate-pulse-glow`}
      role="img"
      aria-label="CloseFriend AI"
    >
      <Bot className="h-[58%] w-[58%]" strokeWidth={2.1} aria-hidden="true" />
      <span className="absolute -right-[5%] -top-[5%] flex h-[34%] w-[34%] items-center justify-center rounded-full bg-white text-[#0066ff] shadow-sm ring-1 ring-blue-100">
        <Sparkles className="h-[65%] w-[65%]" strokeWidth={2.5} aria-hidden="true" />
      </span>
    </div>
  );
}
