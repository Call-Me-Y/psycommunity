/**
 * 消息轮询服务
 * 负责定时检查新消息并处理通知
 */
import Database from './database.js'
import ChatCache from './chatCache.js'

class MessagePoller {
  constructor() {
    this.isRunning = false
    this.pollInterval = 15000 // 15秒轮询一次，提高响应速度
    this.intervalId = null
    this.lastMessageId = null
    this.currentUser = null
    this.callbacks = new Set()
    this.isPolling = false // 防止重复轮询
  }

  /**
   * 启动消息轮询
   */
  start(userInfo) {
    if (this.isRunning) {
      console.log('消息轮询已在运行中')
      return
    }

    this.currentUser = userInfo
    this.isRunning = true

    // 立即执行一次检查
    this.pollMessages()

    // 设置定时轮询
    this.intervalId = setInterval(() => {
      this.pollMessages()
    }, this.pollInterval)
  }

  /**
   * 停止消息轮询
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('消息轮询服务已停止')
  }

  /**
   * 轮询消息
   */
  async pollMessages() {
    if (!this.currentUser) {
      console.log('用户未登录，停止轮询')
      this.stop()
      return
    }

    // 防止重复轮询
    if (this.isPolling) {
      console.log('正在轮询中，跳过本次请求')
      return
    }

    this.isPolling = true

    try {
      console.log('开始轮询新消息...')
      
      // 获取最新消息
      const messagesRes = await Database.getLatestMessages()
      if (!messagesRes.success) {
        console.log('获取消息失败:', messagesRes.message)
        return
      }

      // 获取缓存中的消息
      const cachedMessages = ChatCache.getLatestMessagesCache() || []
      const cachedMessageIds = new Set(cachedMessages.map(msg => msg.id))

      // 找出新消息（排除自己发送的消息）
      const newMessages = messagesRes.messages.filter(msg => 
        !cachedMessageIds.has(msg.id) && 
        msg.sender_uid !== this.currentUser.uid
      )

      if (newMessages.length > 0) {
        console.log('发现', newMessages.length, '条新消息')
        
        // 使用增量更新方式合并消息
        ChatCache.mergeMessagesToCache(messagesRes.messages)
        
        // 通知所有监听器
        this.notifyCallbacks({
          type: 'newMessages',
          messages: newMessages,
          count: newMessages.length,
          timestamp: Date.now()
        })
      }

      // 更新最后检查的消息ID
      if (messagesRes.messages.length > 0) {
        this.lastMessageId = messagesRes.messages[0].id
      }

    } catch (error) {
      console.error('轮询消息失败:', error)
    } finally {
      this.isPolling = false
    }
  }

  /**
   * 添加回调监听器
   */
  addCallback(callback) {
    this.callbacks.add(callback)
  }

  /**
   * 移除回调监听器
   */
  removeCallback(callback) {
    this.callbacks.delete(callback)
  }

  /**
   * 通知所有回调
   */
  notifyCallbacks(data) {
    this.callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('执行回调失败:', error)
      }
    })
  }

  /**
   * 设置轮询间隔
   */
  setPollInterval(interval) {
    this.pollInterval = interval
    if (this.isRunning) {
      this.stop()
      this.start(this.currentUser)
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollInterval: this.pollInterval,
      currentUser: this.currentUser ? this.currentUser.uid : null,
      lastMessageId: this.lastMessageId,
      callbackCount: this.callbacks.size
    }
  }

  /**
   * 手动触发轮询
   */
  async manualPoll() {
    if (this.currentUser) {
      await this.pollMessages()
    }
  }
}

// 创建单例实例
const messagePoller = new MessagePoller()

export default messagePoller
