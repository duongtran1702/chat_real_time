import { useCallback, useState, type ChangeEvent, type KeyboardEvent, type RefObject } from 'react';

const BOT_NAME = 'CloseFriend';
const BOT_MENTION = `@${BOT_NAME}`;
const MENTION_PATTERN = /(^|\s)@([^\s@]*)$/;

interface UseBotMentionOptions {
  inputRef: RefObject<HTMLInputElement | null>;
  inputText: string;
  setInputText: (value: string | ((currentValue: string) => string)) => void;
}

export function useBotMention({ inputRef, inputText, setInputText }: UseBotMentionOptions) {
  const [isSuggestionDismissed, setIsSuggestionDismissed] = useState(false);
  const mentionMatch = inputText.match(MENTION_PATTERN);
  const mentionQuery = mentionMatch?.[2]?.toLocaleLowerCase('vi') ?? '';
  const isSuggestionOpen = Boolean(
    !isSuggestionDismissed
    && mentionMatch
    && BOT_NAME.toLocaleLowerCase('vi').startsWith(mentionQuery),
  );

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [inputRef]);

  const selectBotMention = useCallback(() => {
    setInputText((currentText) => {
      const currentMatch = currentText.match(MENTION_PATTERN);
      if (!currentMatch || currentMatch.index === undefined) {
        return `${currentText}${currentText && !currentText.endsWith(' ') ? ' ' : ''}${BOT_MENTION} `;
      }

      const mentionStart = currentMatch.index + currentMatch[1].length;
      return `${currentText.slice(0, mentionStart)}${BOT_MENTION} `;
    });
    setIsSuggestionDismissed(true);
    focusInput();
  }, [focusInput, setInputText]);

  const insertBotMention = useCallback(() => {
    if (inputText.includes(BOT_MENTION)) {
      focusInput();
      return;
    }

    setInputText((currentText) => `${currentText}${currentText && !currentText.endsWith(' ') ? ' ' : ''}${BOT_MENTION} `);
    setIsSuggestionDismissed(true);
    focusInput();
  }, [focusInput, inputText, setInputText]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
    setIsSuggestionDismissed(false);
  }, [setInputText]);

  const handleInputKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionOpen) return;

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      selectBotMention();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsSuggestionDismissed(true);
    }
  }, [isSuggestionOpen, selectBotMention]);

  return {
    handleInputChange,
    handleInputKeyDown,
    insertBotMention,
    isSuggestionOpen,
    selectBotMention,
  };
}
