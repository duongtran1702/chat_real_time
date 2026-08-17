import { Bot, Sparkles } from 'lucide-react';

interface BotAvatarProps {
  className?: string;
}

export function BotAvatar({ className = 'h-9 w-9' }: BotAvatarProps) {
  return (
    <div
      className={`${className} relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00b2ff] to-[#006aff] text-white ring-2 ring-white`}
      role="img"
      aria-label="CloseFriend AI"
    >
      <Bot className="h-[58%] w-[58%]" strokeWidth={2.1} aria-hidden="true" />
      <span className="absolute -right-[5%] -top-[5%] flex h-[34%] w-[34%] items-center justify-center rounded-full bg-white text-[#0084ff] ring-1 ring-[#d9ecff]">
        <Sparkles className="h-[65%] w-[65%]" strokeWidth={2.5} aria-hidden="true" />
      </span>
    </div>
  );
}
