// URL处理工具函数
import config from '../config/api.js';

/**
 * 获取完整的静态资源URL
 * @param {string} path - 资源路径
 * @returns {string} 完整的URL
 */
export function getStaticUrl(path) {
  if (!path) return '';
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 如果是服务器路径，添加完整URL
  if (path.startsWith('/uploads/') || path.startsWith('/static/')) {
    return `${config.STATIC_BASE_URL}${path}`;
  }
  
  return path;
}

/**
 * 获取完整的API URL
 * @param {string} path - API路径
 * @returns {string} 完整的API URL
 */
export function getApiUrl(path) {
  if (!path) return '';
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 确保路径以/开头
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.API_BASE_URL}${apiPath}`;
}

/**
 * 获取前端页面URL（用于分享等）
 * @param {string} path - 页面路径
 * @returns {string} 完整的前端URL
 */
export function getFrontendUrl(path) {
  if (!path) return '';
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 确保路径以/开头
  const frontendPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.FRONTEND_BASE_URL}${frontendPath}`;
}
