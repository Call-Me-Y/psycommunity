/**
 * 通知权限管理工具类
 * 负责处理各种平台的通知权限请求和管理
 */
class NotificationManager {
  constructor() {
    this.permissionStatus = 'default'
    this.isSupported = false
    this.platform = this.getPlatform()
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
    // #ifdef MP-ALIPAY
    return 'mp-alipay'
    // #endif
    // #ifdef MP-BAIDU
    return 'mp-baidu'
    // #endif
    // #ifdef MP-TOUTIAO
    return 'mp-toutiao'
    // #endif
    return 'unknown'
  }

  /**
   * 初始化通知管理器
   */
  async init() {
    try {
      console.log('初始化通知管理器，平台:', this.platform)
      
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
          console.log('当前平台不支持通知功能')
          this.isSupported = false
      }
    } catch (error) {
      console.error('初始化通知管理器失败:', error)
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
        this.permissionStatus = 'granted'
        console.log('APP推送服务可用')
      } else {
        this.isSupported = false
        console.log('APP推送服务不可用')
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
      this.permissionStatus = Notification.permission
      console.log('H5通知支持，当前权限状态:', this.permissionStatus)
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
    try {
      // 微信小程序需要用户主动订阅消息
      this.isSupported = true
      this.permissionStatus = 'default'
      console.log('微信小程序通知支持')
    } catch (error) {
      console.error('初始化微信小程序通知失败:', error)
      this.isSupported = false
    }
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
      // APP通常需要在manifest.json中配置权限
      // 这里主要是检查权限状态
      const clientInfo = await new Promise((resolve, reject) => {
        plus.push.getClientInfo((info) => {
          resolve(info)
        }, (error) => {
          reject(error)
        })
      })

      if (clientInfo) {
        this.permissionStatus = 'granted'
        return true
      } else {
        this.permissionStatus = 'denied'
        return false
      }
    } catch (error) {
      console.error('请求APP通知权限失败:', error)
      this.permissionStatus = 'denied'
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
        this.permissionStatus = 'granted'
        return true
      }

      if (Notification.permission === 'denied') {
        this.permissionStatus = 'denied'
        return false
      }

      // 请求权限
      const permission = await Notification.requestPermission()
      this.permissionStatus = permission
      
      if (permission === 'granted') {
        console.log('H5通知权限已授予')
        return true
      } else {
        console.log('H5通知权限被拒绝')
        return false
      }
    } catch (error) {
      console.error('请求H5通知权限失败:', error)
      this.permissionStatus = 'denied'
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
      // 微信小程序需要用户主动订阅消息
      const result = await new Promise((resolve, reject) => {
        uni.requestSubscribeMessage({
          tmplIds: ['message_notification'], // 需要在微信公众平台配置模板
          success: (res) => {
            console.log('微信小程序订阅消息结果:', res)
            resolve(res)
          },
          fail: (error) => {
            console.error('微信小程序订阅消息失败:', error)
            reject(error)
          }
        })
      })

      // 检查是否有模板被用户接受
      const accepted = Object.values(result).some(status => status === 'accept')
      this.permissionStatus = accepted ? 'granted' : 'denied'
      
      return accepted
    } catch (error) {
      console.error('请求微信小程序通知权限失败:', error)
      this.permissionStatus = 'denied'
      return false
    }
    // #endif
    return false
  }

  /**
   * 检查通知权限状态
   */
  getPermissionStatus() {
    return {
      isSupported: this.isSupported,
      permissionStatus: this.permissionStatus,
      platform: this.platform
    }
  }

  /**
   * 显示权限说明弹窗
   */
  showPermissionDialog() {
    return new Promise((resolve) => {
      uni.showModal({
        title: '通知权限',
        content: '为了及时接收新消息提醒，请允许应用发送通知。您可以在系统设置中随时修改此权限。',
        confirmText: '去设置',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            this.openSystemSettings()
          }
          resolve(res.confirm)
        }
      })
    })
  }

  /**
   * 打开系统设置
   */
  openSystemSettings() {
    // #ifdef APP-PLUS
    try {
      plus.runtime.openURL('app-settings:')
    } catch (error) {
      console.error('打开系统设置失败:', error)
      uni.showToast({
        title: '请手动前往系统设置开启通知权限',
        icon: 'none',
        duration: 3000
      })
    }
    // #endif

    // #ifdef H5
    uni.showToast({
      title: '请在浏览器设置中开启通知权限',
      icon: 'none',
      duration: 3000
    })
    // #endif

    // #ifdef MP-WEIXIN
    uni.showToast({
      title: '请在微信设置中开启消息通知',
      icon: 'none',
      duration: 3000
    })
    // #endif
  }

  /**
   * 发送测试通知
   */
  async sendTestNotification() {
    if (!this.isSupported || this.permissionStatus !== 'granted') {
      throw new Error('通知权限未授予或平台不支持')
    }

    try {
      const title = '测试通知'
      const content = '这是一条测试通知，如果您看到此消息，说明通知功能正常工作。'

      // #ifdef APP-PLUS
      plus.push.createMessage(content, 'test', {
        title: title,
        cover: true,
        badge: 1,
        sound: 'default',
        vibrate: true
      })
      // #endif

      // #ifdef H5
      if (this.permissionStatus === 'granted') {
        const notification = new Notification(title, {
          body: content,
          icon: '/static/ico.svg',
          badge: '/static/ico.svg'
        })

        setTimeout(() => {
          notification.close()
        }, 3000)
      }
      // #endif

      // #ifdef MP-WEIXIN
      uni.showToast({
        title: '微信小程序通知测试',
        icon: 'none'
      })
      // #endif

      return true
    } catch (error) {
      console.error('发送测试通知失败:', error)
      throw error
    }
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
    return this.permissionStatus === 'granted'
  }

  /**
   * 获取权限状态文本
   */
  getPermissionStatusText() {
    if (!this.isSupported) {
      return '当前平台不支持通知功能'
    }

    switch (this.permissionStatus) {
      case 'granted':
        return '通知权限已授予'
      case 'denied':
        return '通知权限被拒绝'
      case 'default':
        return '通知权限未设置'
      default:
        return '通知权限状态未知'
    }
  }
}

// 创建单例实例
const notificationManager = new NotificationManager()

export default notificationManager
