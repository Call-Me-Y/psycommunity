<script>
import backgroundService from '@/utils/backgroundService.js'
import notificationManager from '@/utils/notificationManager.js'

export default {
  onLaunch: function () {
    console.log('App启动')
    this.initApp()
  },
  onShow: function () {
    console.log('App显示')
    this.handleAppShow()
  },
  onHide: function () {
    console.log('App隐藏')
    this.handleAppHide()
  },
  methods: {
    /**
     * 初始化应用
     */
    async initApp() {
      try {
        // 先订阅登录状态，避免首次登录快于 token 检查而错过实时连接。
        this.setupMessageListeners()

        // 初始化通知管理器
        await notificationManager.init()
        
        // 初始化后台服务
        await backgroundService.init()
        
        console.log('应用初始化完成')
      } catch (error) {
        console.error('应用初始化失败:', error)
      }
    },

    /**
     * 处理应用显示
     */
    handleAppShow() {
      // 应用显示时，启动后台服务
      if (backgroundService.getStatus().currentUser) {
        backgroundService.startBackgroundTask()
      } else {
        // App 启动时若网络暂不可用，恢复前台后重新检查登录态并连线。
        backgroundService.refreshCurrentUser()
      }
    },

    /**
     * 处理应用隐藏
     */
    handleAppHide() {
      // 应用隐藏时，保持后台服务运行
      // 后台服务会在后台继续检查新消息
      console.log('应用隐藏，后台服务继续运行')
    },

    /**
     * 设置消息监听器
     */
    setupMessageListeners() {
      // 监听新消息事件
      uni.$on('newMessagesReceived', (data) => {
        console.log('收到新消息事件:', data)
        this.handleNewMessages(data)
      })

      // 监听页面显示事件，用于刷新消息列表
      uni.$on('pageShow', () => {
        this.refreshMessageList()
      })

      uni.$on('userAuthenticated', this.handleUserAuthenticated)
      uni.$on('userLoggedOut', this.handleUserLoggedOut)
    },

    handleUserAuthenticated() {
      backgroundService.refreshCurrentUser()
    },

    handleUserLoggedOut() {
      backgroundService.currentUser = null
      backgroundService.stopBackgroundTask()
    },

    /**
     * 处理新消息
     */
    handleNewMessages(data) {
      const { messages, count } = data
      

      // 更新应用角标（如果支持）
      this.updateAppBadge(count)
    },

    /**
     * 更新应用角标
     */
    updateAppBadge(count) {
      // #ifdef APP-PLUS
      try {
        plus.runtime.setBadgeNumber(count)
      } catch (error) {
        console.error('设置应用角标失败:', error)
      }
      // #endif
    },

    /**
     * 刷新消息列表
     */
    refreshMessageList() {
      // 通知聊天页面刷新数据
      uni.$emit('refreshMessageList')
    }
  }
}
</script>

<style>
/*每个页面公共css */

/* 隐藏所有页面的滚动条 */
page {
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

page::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}

/* 针对所有可滚动元素隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}

/* 确保滚动条在所有平台上都被隐藏 */
* {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

*::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}

/* 确保所有文字都可以被选中 */
* {
  -webkit-user-select: text ;
  -moz-user-select: text ;
  -ms-user-select: text ;
  user-select: text ;
}

/* 特别针对文本元素确保可选择 */
text, view, div, span, p, h1, h2, h3, h4, h5, h6, label, button {
  -webkit-user-select: text ;
  -moz-user-select: text ;
  -ms-user-select: text ;
  user-select: text ;
}

/* 确保输入框和文本区域可以选择 */
input, textarea {
  -webkit-user-select: text ;
  -moz-user-select: text ;
  -ms-user-select: text ;
  user-select: text ;
}

/* 全局emoji字体支持 - 应用到所有文本元素 */
/* 针对不同平台的字体配置 */
page, text, view, input, textarea, button {
  /* iOS平台字体 */
  font-family: -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", system-ui, sans-serif;
}

/* 安卓平台专用字体配置 */
/* #ifdef MP-ANDROID */
page, text, view, input, textarea, button {
  font-family: "Noto Color Emoji", "Noto Emoji", "Android Emoji", "EmojiOne Color", "Twemoji", "Segoe UI Emoji", "Apple Color Emoji", "Segoe UI Symbol", "Roboto", "Droid Sans", "sans-serif";
}
/* #endif */

/* 专门的emoji文本类 */
.emoji-text {
  font-family: -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", system-ui, sans-serif;
  font-variant-emoji: emoji;
}

/* 安卓平台专用emoji文本类 */
/* #ifdef MP-ANDROID */
.emoji-text {
  font-family: "Noto Color Emoji", "Noto Emoji", "Android Emoji", "EmojiOne Color", "Twemoji", "Segoe UI Emoji", "Apple Color Emoji", "Segoe UI Symbol", "Roboto", "Droid Sans", "sans-serif";
  font-variant-emoji: emoji;
}
/* #endif */

/* 确保消息文本支持emoji */
.message-text {
  font-family: -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", system-ui, sans-serif !important;
  font-variant-emoji: emoji;
}

/* 安卓平台专用消息文本 */
/* #ifdef MP-ANDROID */
.message-text {
  font-family: "Noto Color Emoji", "Noto Emoji", "Android Emoji", "EmojiOne Color", "Twemoji", "Segoe UI Emoji", "Apple Color Emoji", "Segoe UI Symbol", "Roboto", "Droid Sans", "sans-serif" !important;
  font-variant-emoji: emoji;
}
/* #endif */

/* 输入框emoji支持 */
.message-input {
  font-family: -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", system-ui, sans-serif !important;
  font-variant-emoji: emoji;
}

/* 安卓平台专用输入框 */
/* #ifdef MP-ANDROID */
.message-input {
  font-family: "Noto Color Emoji", "Noto Emoji", "Android Emoji", "EmojiOne Color", "Twemoji", "Segoe UI Emoji", "Apple Color Emoji", "Segoe UI Symbol", "Roboto", "Droid Sans", "sans-serif" !important;
  font-variant-emoji: emoji;
}
/* #endif */
</style>
