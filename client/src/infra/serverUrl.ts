/**
 * Địa chỉ local chỉ được Vite sử dụng khi chạy `npm run dev`.
 * Production chạy React và Spring Boot cùng origin nên tự dùng domain đang mở.
 */
const DEVELOPMENT_SERVER_ORIGIN = 'http://localhost:8080';

const configuredOrigin = import.meta.env.VITE_SERVER_ORIGIN?.trim();
const defaultOrigin = import.meta.env.DEV
  ? DEVELOPMENT_SERVER_ORIGIN
  : window.location.origin;

export const serverOrigin = (configuredOrigin || defaultOrigin).replace(/\/+$/, '');

export const apiBaseUrl = `${serverOrigin}/api/v1`;
export const webSocketEndpoint = `${serverOrigin}/ws-chat`;
