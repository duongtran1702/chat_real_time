import { useEffect } from 'react';

const updateViewportVariables = () => {
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const offsetTop = viewport?.offsetTop ?? 0;

  document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(height)}px`);
  document.documentElement.style.setProperty('--app-viewport-offset-top', `${Math.round(offsetTop)}px`);
};

export const useVisualViewport = () => {
  useEffect(() => {
    const viewport = window.visualViewport;
    updateViewportVariables();

    viewport?.addEventListener('resize', updateViewportVariables);
    viewport?.addEventListener('scroll', updateViewportVariables);
    window.addEventListener('resize', updateViewportVariables);
    window.addEventListener('orientationchange', updateViewportVariables);

    return () => {
      viewport?.removeEventListener('resize', updateViewportVariables);
      viewport?.removeEventListener('scroll', updateViewportVariables);
      window.removeEventListener('resize', updateViewportVariables);
      window.removeEventListener('orientationchange', updateViewportVariables);
      document.documentElement.style.removeProperty('--app-viewport-height');
      document.documentElement.style.removeProperty('--app-viewport-offset-top');
    };
  }, []);
};
