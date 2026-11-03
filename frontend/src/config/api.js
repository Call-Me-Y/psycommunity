// API endpoints can be overridden per deployment with Vite environment variables.
const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const staticBase = (import.meta.env.VITE_STATIC_BASE_URL || apiBase.replace(/\/api$/, '')).replace(/\/$/, '');

const config = {
  API_BASE_URL: apiBase,
  STATIC_BASE_URL: staticBase,
  FRONTEND_BASE_URL: (import.meta.env.VITE_FRONTEND_BASE_URL || '').replace(/\/$/, '')
};

export default config;
