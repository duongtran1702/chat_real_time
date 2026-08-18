import { useEffect } from 'react';

type NavigatorWithVirtualKeyboard = Navigator & {
  virtualKeyboard?: {
    overlaysContent: boolean;
  };
};

const updateViewportVariables = () => {
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const offsetTop = viewport?.offsetTop ?? 0;
  const keyboardHeight = Math.max(0, window.innerHeight - height - offsetTop);

  document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(height)}px`);
  document.documentElement.style.setProperty('--app-viewport-offset-top', `${Math.round(offsetTop)}px`);
  document.documentElement.dataset.virtualKeyboard = keyboardHeight > 120 ? 'open' : 'closed';
};

export const useVisualViewport = () => {
  useEffect(() => {
    const viewport = window.visualViewport;
    const navigatorWithKeyboard = navigator as NavigatorWithVirtualKeyboard;
    const delayedUpdates = new Set<number>();

    if (navigatorWithKeyboard.virtualKeyboard) {
      navigatorWithKeyboard.virtualKeyboard.overlaysContent = false;
    }

    const scheduleViewportUpdates = () => {
      [0, 100, 300, 600].forEach((delay) => {
        const timeoutId = window.setTimeout(() => {
          updateViewportVariables();
          delayedUpdates.delete(timeoutId);
        }, delay);
        delayedUpdates.add(timeoutId);
      });
    };

    updateViewportVariables();

    viewport?.addEventListener('resize', updateViewportVariables);
    viewport?.addEventListener('scroll', updateViewportVariables);
    window.addEventListener('resize', updateViewportVariables);
    window.addEventListener('orientationchange', updateViewportVariables);
    document.addEventListener('focusin', scheduleViewportUpdates);
    document.addEventListener('focusout', scheduleViewportUpdates);

    return () => {
      viewport?.removeEventListener('resize', updateViewportVariables);
      viewport?.removeEventListener('scroll', updateViewportVariables);
      window.removeEventListener('resize', updateViewportVariables);
      window.removeEventListener('orientationchange', updateViewportVariables);
      document.removeEventListener('focusin', scheduleViewportUpdates);
      document.removeEventListener('focusout', scheduleViewportUpdates);
      delayedUpdates.forEach((timeoutId) => window.clearTimeout(timeoutId));
      document.documentElement.style.removeProperty('--app-viewport-height');
      document.documentElement.style.removeProperty('--app-viewport-offset-top');
      delete document.documentElement.dataset.virtualKeyboard;
    };
  }, []);
};
