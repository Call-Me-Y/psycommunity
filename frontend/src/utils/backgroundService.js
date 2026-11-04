import config from '../config/api.js'
/**
 * 后台消息服务工具类
 * 负责处理后台消息获取、通知推送等功能
 */
import Database from './database.js'
import localNotification from './localNotification.js'
import messageSocket from './messageSocket.js'

class BackgroundService {
  constructor() {
    this.isRunning = false
    this.lastCheckTime = null
    this.currentUser = null
    this.notificationEnabled = false
    this.backgroundTaskId = null
    this.messageCallback = null
  }

  /**
   * 初始化后台服务
   */
  async init() {
    try {
      console.log('初始化后台消息服务...')
      
      // 初始化本地通知服务
      await localNotification.init()
      
      // 检查通知权限
      await this.checkNotificationPermission()
      
      // 获取当前用户信息
      await this.getCurrentUser()
      
      // 设置 WebSocket 消息回调
      this.setupMessageSocket()
      
      // 启动后台任务
      this.startBackgroundTask()
      
      console.log('后台消息服务初始化完成')
    } catch (error) {
      console.error('后台服务初始化失败:', error)
    }
  }

  /**
   * 检查通知权限
   */
  async checkNotificationPermission() {
    try {
      this.notificationEnabled = localNotification.isPermissionGranted()
      console.log('通知权限状态:', this.notificationEnabled ? '已授予' : '未授予')
    } catch (error) {
      console.error('检查通知权限失败:', error)
      this.notificationEnabled = false
    }
  }

  /**
   * 设置实时消息回调
   */
  setupMessageSocket() {
    if (this.messageCallback) messageSocket.removeCallback(this.messageCallback)
    this.messageCallback = (data) => {
      if (data.type === 'newMessages') {
        this.handleNewMessages(data.messages)
      }
    }
    messageSocket.addCallback(this.messageCallback)
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    try {
      const userRes = await Database.verifyToken()
      if (userRes.success) {
        this.currentUser = userRes.user
      } else {
        console.log('用户未登录，停止后台服务')
        this.currentUser = null
        this.stopBackgroundTask()
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      this.currentUser = null
      this.stopBackgroundTask()
    }
  }

  async refreshCurrentUser() {
    await this.getCurrentUser()
    if (this.currentUser) {
      this.setupMessageSocket()
      this.startBackgroundTask()
    } else {
      this.stopBackgroundTask()
    }
  }

  /**
   * 启动后台任务
   */
  startBackgroundTask() {
    if (!this.currentUser) {
      console.log('用户未登录，无法启动后台任务')
      return
    }

    this.isRunning = true
    console.log('启动 WebSocket 实时消息服务')
    messageSocket.start(this.currentUser)

    // #ifdef APP-PLUS
    // 注册后台任务
    this.registerBackgroundTask()
    // #endif
  }

  /**
   * 停止后台任务
   */
  stopBackgroundTask() {
    messageSocket.stop()
    
    this.isRunning = false
    console.log('后台任务已停止')

    // #ifdef APP-PLUS
    // 取消后台任务
    this.unregisterBackgroundTask()
    // #endif
  }

  /**
   * 检查新消息
   */
  async checkNewMessages() {
    if (!this.currentUser) return
    await messageSocket.manualSync()
    this.lastCheckTime = new Date()
  }

  /**
   * 处理新消息
   */
  async handleNewMessages(messages) {
    if (!messages || messages.length === 0) {
      return
    }

    console.log('处理新消息:', messages.length, '条')
    this.lastCheckTime = new Date()

    // 触发页面更新事件
    this.triggerMessageUpdateEvent(messages)

    // 本地通知可能涉及平台异步 API，放在页面事件之后执行。
    await this.sendNotifications(messages)
  }

  /**
   * 发送通知
   */
  async sendNotifications(messages) {
    if (!this.notificationEnabled || !messages.length) {
      return
    }

    try {
      for (const message of messages) {
        await this.sendSingleNotification(message)
      }
    } catch (error) {
      console.error('发送通知失败:', error)
    }
  }

  /**
   * 发送单个通知
   */
  async sendSingleNotification(message) {
    try {
      await localNotification.sendMessageNotification(message)
    } catch (error) {
      console.error('发送单个通知失败:', error)
    }
  }

  /**
   * 获取通知标题
   */
  getNotificationTitle(message) {
    if (message.chat_type === 'private') {
      return message.contact_name || message.sender_name || '新消息'
    } else {
      return `${message.contact_name || '群组'} - ${message.sender_name || '群成员'}`
    }
  }

  /**
   * 获取通知内容
   */
  getNotificationContent(message) {
    let content = message.content || ''
    
    // 根据消息类型处理内容
    switch (message.msg_type) {
      case 1: // 图片
        content = '[图片]'
        break
      case 2: // 文件
        content = '[文件]'
        break
      case 3: // 语音
        content = '[语音]'
        break
      default:
        // 文本消息，限制长度
        if (content.length > 50) {
          content = content.substring(0, 50) + '...'
        }
    }

    return content
  }

  /**
   * 获取通知头像
   */
  getNotificationAvatar(message) {
    if (message.contact_avatar) {
      if (message.contact_avatar.startsWith('http')) {
        return message.contact_avatar
      } else if (message.contact_avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${message.contact_avatar}`
      }
    }
    
    // 默认头像
    return message.chat_type === 'group' ? '/static/avatarg.png' : '/static/avatar.png'
  }

  /**
   * 触发消息更新事件
   */
  triggerMessageUpdateEvent(newMessages) {
    // 使用uni.$emit发送全局事件
    uni.$emit('newMessagesReceived', {
      messages: newMessages,
      count: newMessages.length,
      timestamp: Date.now()
    })
  }

  /**
   * 导航到聊天页面
   */
  navigateToChat(message) {
    try {
      if (message.chat_type === 'group') {
        uni.navigateTo({
          url: `/pages/chat/group?gid=${message.contact_id}&name=${encodeURIComponent(message.contact_name)}&avatar=${encodeURIComponent(message.contact_avatar || '')}`
        })
      } else {
        uni.navigateTo({
          url: `/pages/chat/private?uid=${message.contact_id}&name=${encodeURIComponent(message.contact_name)}&avatar=${encodeURIComponent(message.contact_avatar || '')}`
        })
      }
    } catch (error) {
      console.error('导航到聊天页面失败:', error)
    }
  }

  /**
   * 注册后台任务（APP-PLUS）
   */
  registerBackgroundTask() {
    // #ifdef APP-PLUS
    try {
      this.backgroundTaskId = plus.backgroundTask.start(() => {
        console.log('后台任务执行中...')
        this.checkNewMessages()
      })
      console.log('后台任务注册成功，ID:', this.backgroundTaskId)
    } catch (error) {
      console.error('注册后台任务失败:', error)
    }
    // #endif
  }

  /**
   * 取消后台任务（APP-PLUS）
   */
  unregisterBackgroundTask() {
    // #ifdef APP-PLUS
    if (this.backgroundTaskId) {
      try {
        plus.backgroundTask.stop(this.backgroundTaskId)
        this.backgroundTaskId = null
        console.log('后台任务已取消')
      } catch (error) {
        console.error('取消后台任务失败:', error)
      }
    }
    // #endif
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      notificationEnabled: this.notificationEnabled,
      currentUser: this.currentUser ? this.currentUser.uid : null
    }
  }

  /**
   * 手动检查消息
   */
  async manualCheck() {
    if (this.currentUser) {
      await this.checkNewMessages()
    }
  }
}

// 创建单例实例
const backgroundService = new BackgroundService()

export default backgroundService
