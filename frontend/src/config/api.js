// API endpoints can be overridden per deployment with Vite environment variables.
const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const staticBase = (import.meta.env.VITE_STATIC_BASE_URL || apiBase.replace(/\/api$/, '')).replace(/\/$/, '');

function resolveWebSocketUrl() {
  const configured = (import.meta.env.VITE_WS_BASE_URL || '').replace(/\/$/, '');
  if (configured) {
    if (configured.endsWith('/ws/chat')) return configured;
    return `${configured}/ws/chat`;
  }

  let origin = '';
  if (/^https?:\/\//i.test(apiBase)) {
    const match = apiBase.match(/^(https?:\/\/[^/]+)/i);
    if (!match) return '';
    origin = match[1];
  } else if (typeof window !== 'undefined' && window.location) {
    origin = window.location.origin;
  } else {
    return '';
  }

  const socketOrigin = origin.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  return `${socketOrigin}/ws/chat`;
}

const config = {
  API_BASE_URL: apiBase,
  STATIC_BASE_URL: staticBase,
  FRONTEND_BASE_URL: (import.meta.env.VITE_FRONTEND_BASE_URL || '').replace(/\/$/, ''),
  WEBSOCKET_URL: resolveWebSocketUrl()
};

export default config;
