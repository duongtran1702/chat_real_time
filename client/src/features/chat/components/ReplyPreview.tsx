import React from 'react';
import type { Message } from '../store/useChatStore';
import { Reply, X } from 'lucide-react';

interface ReplyPreviewProps {
  message: Message;
  senderName: string;
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ message, senderName, onCancel }) => {
  const truncatedContent =
    message.content.length > 120 ? message.content.substring(0, 120) + '…' : message.content;

  return (
    <div className="reply-preview-bar animate-reply-slide-down">
      <div className="reply-preview-accent" />
      <Reply size={14} className="reply-preview-icon" aria-hidden="true" />
      <div className="reply-preview-body">
        <span className="reply-preview-sender">{senderName}</span>
        <span className="reply-preview-content">{truncatedContent}</span>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="reply-preview-close"
        aria-label="Hủy trả lời"
      >
        <X size={16} />
      </button>
    </div>
  );
};
