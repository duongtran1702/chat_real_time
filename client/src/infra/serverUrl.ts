/** Domain thật dùng cho bản production trên Railway. */
const PRODUCTION_SERVER_ORIGIN = 'https://chat.atmin.io.vn';

/**
 * Địa chỉ local chỉ được Vite sử dụng khi chạy `npm run dev`.
 * Khi build production, nhánh này bị loại và ứng dụng dùng domain thật phía trên.
 */
const DEVELOPMENT_SERVER_ORIGIN = 'http://localhost:8080';

const configuredOrigin = import.meta.env.VITE_SERVER_ORIGIN?.trim();

export const serverOrigin = configuredOrigin
  || (import.meta.env.DEV ? DEVELOPMENT_SERVER_ORIGIN : PRODUCTION_SERVER_ORIGIN);

export const apiBaseUrl = `${serverOrigin}/api/v1`;
export const webSocketEndpoint = `${serverOrigin}/ws-chat`;
