/**
 * 安全参数管理工具
 * 用于保护聊天页面URL中的敏感信息
 */

class SecureParamsManager {
  constructor() {
    this.sessionStorage = new Map()
    this.sessionTimeout = 30 * 60 * 1000 // 30分钟过期
    this.cleanupInterval = 5 * 60 * 1000 // 5分钟清理一次
    
    // 启动定期清理
    this.startCleanup()
  }

  /**
   * 生成安全的会话ID
   */
  generateSessionId() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `chat_${timestamp}_${random}`
  }

  /**
   * 存储聊天会话参数
   * @param {Object} params - 聊天参数
   * @param {string} params.type - 聊天类型 ('private' | 'group')
   * @param {string} params.targetId - 目标ID (uid或gid)
   * @param {string} params.name - 显示名称
   * @param {string} params.avatar - 头像路径
   * @returns {string} 会话ID
   */
  storeChatParams(params) {
    const sessionId = this.generateSessionId()
    const sessionData = {
      ...params,
      timestamp: Date.now(),
      expires: Date.now() + this.sessionTimeout
    }
    
    this.sessionStorage.set(sessionId, sessionData)
    return sessionId
  }

  /**
   * 获取聊天会话参数
   * @param {string} sessionId - 会话ID
   * @returns {Object|null} 会话参数或null
   */
  getChatParams(sessionId) {
    const sessionData = this.sessionStorage.get(sessionId)
    
    if (!sessionData) {
      return null
    }
    
    // 检查是否过期
    if (Date.now() > sessionData.expires) {
      this.sessionStorage.delete(sessionId)
      return null
    }
    
    // 更新访问时间
    sessionData.timestamp = Date.now()
    return sessionData
  }

  /**
   * 删除会话数据
   * @param {string} sessionId - 会话ID
   */
  removeSession(sessionId) {
    this.sessionStorage.delete(sessionId)
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    const now = Date.now()
    for (const [sessionId, sessionData] of this.sessionStorage.entries()) {
      if (now > sessionData.expires) {
        this.sessionStorage.delete(sessionId)
      }
    }
  }

  /**
   * 启动定期清理
   */
  startCleanup() {
    setInterval(() => {
      this.cleanupExpiredSessions()
    }, this.cleanupInterval)
  }

  /**
   * 创建安全的聊天URL
   * @param {string} pagePath - 页面路径
   * @param {Object} params - 聊天参数
   * @returns {string} 安全的URL
   */
  createSecureChatUrl(pagePath, params) {
    const sessionId = this.storeChatParams(params)
    return `${pagePath}?session=${sessionId}`
  }

  /**
   * 验证会话ID格式
   * @param {string} sessionId - 会话ID
   * @returns {boolean} 是否有效
   */
  isValidSessionId(sessionId) {
    return typeof sessionId === 'string' && 
           sessionId.startsWith('chat_') && 
           sessionId.length > 20
  }
}

// 创建单例实例
const secureParamsManager = new SecureParamsManager()

export default secureParamsManager
