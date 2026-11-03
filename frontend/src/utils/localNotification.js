import config from '../config/api.js'
/**
 * 本地通知服务
 * 负责处理各种平台的通知显示
 */
class LocalNotification {
  constructor() {
    this.platform = this.getPlatform()
    this.isSupported = false
    this.permissionGranted = false
  }

  /**
   * 获取当前平台
   */
  getPlatform() {
    // #ifdef APP-PLUS
    return 'app'
    // #endif
    // #ifdef H5
    return 'h5'
    // #endif
    // #ifdef MP-WEIXIN
    return 'mp-weixin'
    // #endif
    return 'unknown'
  }

  /**
   * 初始化本地通知服务
   */
  async init() {
    try {
      console.log('初始化本地通知服务，平台:', this.platform)
      
      switch (this.platform) {
        case 'app':
          await this.initAppNotification()
          break
        case 'h5':
          await this.initH5Notification()
          break
        case 'mp-weixin':
          await this.initWeixinNotification()
          break
        default:
          console.log('当前平台不支持本地通知')
          this.isSupported = false
      }
    } catch (error) {
      console.error('初始化本地通知服务失败:', error)
      this.isSupported = false
    }
  }

  /**
   * 初始化APP通知
   */
  async initAppNotification() {
    // #ifdef APP-PLUS
    try {
      // 检查推送服务是否可用
      const clientInfo = await new Promise((resolve, reject) => {
        plus.push.getClientInfo((info) => {
          resolve(info)
        }, (error) => {
          reject(error)
        })
      })

      if (clientInfo) {
        this.isSupported = true
        this.permissionGranted = true
        console.log('APP本地通知服务可用')
      } else {
        this.isSupported = false
        console.log('APP本地通知服务不可用')
      }
    } catch (error) {
      console.error('初始化APP通知失败:', error)
      this.isSupported = false
    }
    // #endif
  }

  /**
   * 初始化H5通知
   */
  async initH5Notification() {
    // #ifdef H5
    if ('Notification' in window) {
      this.isSupported = true
      this.permissionGranted = Notification.permission === 'granted'
      console.log('H5本地通知服务可用，权限状态:', Notification.permission)
    } else {
      this.isSupported = false
      console.log('当前浏览器不支持通知功能')
    }
    // #endif
  }

  /**
   * 初始化微信小程序通知
   */
  async initWeixinNotification() {
    // #ifdef MP-WEIXIN
    this.isSupported = true
    this.permissionGranted = false // 需要用户主动订阅
    console.log('微信小程序通知服务可用')
    // #endif
  }

  /**
   * 请求通知权限
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('当前平台不支持通知功能')
    }

    try {
      switch (this.platform) {
        case 'app':
          return await this.requestAppPermission()
        case 'h5':
          return await this.requestH5Permission()
        case 'mp-weixin':
          return await this.requestWeixinPermission()
        default:
          throw new Error('不支持的平台')
      }
    } catch (error) {
      console.error('请求通知权限失败:', error)
      throw error
    }
  }

  /**
   * 请求APP通知权限
   */
  async requestAppPermission() {
    // #ifdef APP-PLUS
    try {
      const clientInfo = await new Promise((resolve, reject) => {
        plus.push.getClientInfo((info) => {
          resolve(info)
        }, (error) => {
          reject(error)
        })
      })

      if (clientInfo) {
        this.permissionGranted = true
        return true
      } else {
        this.permissionGranted = false
        return false
      }
    } catch (error) {
      console.error('请求APP通知权限失败:', error)
      this.permissionGranted = false
      return false
    }
    // #endif
    return false
  }

  /**
   * 请求H5通知权限
   */
  async requestH5Permission() {
    // #ifdef H5
    try {
      if (!('Notification' in window)) {
        throw new Error('当前浏览器不支持通知功能')
      }

      if (Notification.permission === 'granted') {
        this.permissionGranted = true
        return true
      }

      if (Notification.permission === 'denied') {
        this.permissionGranted = false
        return false
      }

      const permission = await Notification.requestPermission()
      this.permissionGranted = permission === 'granted'
      
      return this.permissionGranted
    } catch (error) {
      console.error('请求H5通知权限失败:', error)
      this.permissionGranted = false
      return false
    }
    // #endif
    return false
  }

  /**
   * 请求微信小程序通知权限
   */
  async requestWeixinPermission() {
    // #ifdef MP-WEIXIN
    try {
      const result = await new Promise((resolve, reject) => {
        uni.requestSubscribeMessage({
          tmplIds: ['message_notification'],
          success: (res) => {
            resolve(res)
          },
          fail: (error) => {
            reject(error)
          }
        })
      })

      const accepted = Object.values(result).some(status => status === 'accept')
      this.permissionGranted = accepted
      
      return accepted
    } catch (error) {
      console.error('请求微信小程序通知权限失败:', error)
      this.permissionGranted = false
      return false
    }
    // #endif
    return false
  }

  /**
   * 发送通知
   */
  async sendNotification(options) {
    if (!this.isSupported || !this.permissionGranted) {
      throw new Error('通知功能不可用或权限未授予')
    }

    try {
      switch (this.platform) {
        case 'app':
          return await this.sendAppNotification(options)
        case 'h5':
          return await this.sendH5Notification(options)
        case 'mp-weixin':
          return await this.sendWeixinNotification(options)
        default:
          throw new Error('不支持的平台')
      }
    } catch (error) {
      console.error('发送通知失败:', error)
      throw error
    }
  }

  /**
   * 发送APP通知
   */
  async sendAppNotification(options) {
    // #ifdef APP-PLUS
    try {
      const {
        title = '新消息',
        content = '',
        icon = '/static/ico.svg',
        badge = 1,
        sound = 'default',
        vibrate = true,
        tag = 'message',
        data = {}
      } = options

      plus.push.createMessage(content, tag, {
        title: title,
        cover: true,
        badge: badge,
        sound: sound,
        vibrate: vibrate,
        when: Date.now(),
        largeIcon: icon,
        smallIcon: icon,
        data: data
      })

      return true
    } catch (error) {
      console.error('发送APP通知失败:', error)
      throw error
    }
    // #endif
    return false
  }

  /**
   * 发送H5通知
   */
  async sendH5Notification(options) {
    // #ifdef H5
    try {
      const {
        title = '新消息',
        body = '',
        icon = '/static/ico.svg',
        badge = '/static/ico.svg',
        tag = 'message',
        data = {},
        requireInteraction = false,
        silent = false
      } = options

      const notification = new Notification(title, {
        body: body,
        icon: icon,
        badge: badge,
        tag: tag,
        data: data,
        requireInteraction: requireInteraction,
        silent: silent
      })

      // 点击通知时的处理
      notification.onclick = () => {
        window.focus()
        // 可以在这里添加跳转到具体页面的逻辑
        if (data.url) {
          window.location.href = data.url
        }
      }

      // 自动关闭通知
      setTimeout(() => {
        notification.close()
      }, 5000)

      return true
    } catch (error) {
      console.error('发送H5通知失败:', error)
      throw error
    }
    // #endif
    return false
  }

  /**
   * 发送微信小程序通知
   */
  async sendWeixinNotification(options) {
    // #ifdef MP-WEIXIN
    try {
      const { title = '新消息', content = '' } = options
      
      // 微信小程序只能显示Toast，不能发送系统通知
      uni.showToast({
        title: `${title}: ${content}`,
        icon: 'none',
        duration: 3000
      })

      return true
    } catch (error) {
      console.error('发送微信小程序通知失败:', error)
      throw error
    }
    // #endif
    return false
  }

  /**
   * 发送消息通知
   */
  async sendMessageNotification(message) {
    try {
      const title = this.getNotificationTitle(message)
      const content = this.getNotificationContent(message)
      const icon = this.getNotificationIcon(message)
      const tag = `${message.chat_type}_${message.contact_id}`

      await this.sendNotification({
        title: title,
        content: content,
        body: content,
        icon: icon,
        tag: tag,
        data: {
          chatType: message.chat_type,
          contactId: message.contact_id,
          messageId: message.id
        }
      })

      return true
    } catch (error) {
      console.error('发送消息通知失败:', error)
      throw error
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
        if (content.length > 50) {
          content = content.substring(0, 50) + '...'
        }
    }

    return content
  }

  /**
   * 获取通知图标
   */
  getNotificationIcon(message) {
    if (message.contact_avatar) {
      if (message.contact_avatar.startsWith('http')) {
        return message.contact_avatar
      } else if (message.contact_avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${message.contact_avatar}`
      }
    }
    
    return message.chat_type === 'group' ? '/static/avatarg.png' : '/static/avatar.png'
  }

  /**
   * 检查是否支持通知
   */
  isNotificationSupported() {
    return this.isSupported
  }

  /**
   * 检查权限是否已授予
   */
  isPermissionGranted() {
    return this.permissionGranted
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      platform: this.platform,
      isSupported: this.isSupported,
      permissionGranted: this.permissionGranted
    }
  }
}

// 创建单例实例
const localNotification = new LocalNotification()

export default localNotification
