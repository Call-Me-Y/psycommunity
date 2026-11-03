<template>
  <view class="chat-container">
    <!-- 顶部导航栏 -->
    <view class="chat-header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-center">
        <image class="contact-avatar" :src="getAvatarUrl(contactInfo.avatar)" mode="aspectFill" />
        <view class="contact-info">
          <text class="contact-name">{{ contactInfo.name }}</text>
        </view>
      </view>
      <view class="header-right" @click="showContactDetail">
        <text class="detail-icon">⋯</text>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view 
      class="message-list" 
      scroll-y 
      :scroll-top="scrollTop"
      @scrolltoupper="loadMoreMessages"
      @scroll="onScroll"
    >
      <!-- 加载中提示 -->
      <view v-if="loading && messages.length === 0" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <view class="message-container" v-else>
        <view 
          v-for="(message, index) in messages" 
          :key="message.id"
          class="message-group"
        >
          <!-- 时间分隔线 -->
          <view 
            v-if="shouldShowTime(message, index)" 
            class="time-divider"
          >
            <text class="time-text">{{ formatTime(message.sent_time) }}</text>
          </view>

          <!-- 消息项 -->
          <view 
            class="message-item"
            :class="{'message-right': isCurrentUserMessage(message), 'message-left': !isCurrentUserMessage(message)}"
          >
            <!-- 发送者头像和名称 -->
            <view 
              v-if="!isCurrentUserMessage(message)"
              class="sender-info"
            >
              <image class="sender-avatar" :src="getAvatarUrl(getSenderAvatar(message))" mode="aspectFill" />
              <text class="sender-name">{{ getSenderName(message) }}</text>
            </view>

            <!-- 消息气泡 -->
            <view class="message-bubble-container">
              <view 
                class="message-bubble"
                :class="{'bubble-right': isCurrentUserMessage(message), 'bubble-left': !isCurrentUserMessage(message)}"
              >
                <!-- 消息箭头 -->
                <view 
                  class="bubble-arrow"
                  :class="{'arrow-right': isCurrentUserMessage(message), 'arrow-left': !isCurrentUserMessage(message)}"
                ></view>
                
                 <!-- 消息内容 -->
                 <view class="message-content">
                   <!-- 文字消息 -->
                   <text 
                     v-if="message.msg_type === 0" 
                     class="message-text"
                     :class="{'highlight-message': highlightMessageIds.includes(message.id)}"
                     v-html="highlightText(message.content)"
                   ></text>
                   
                   <!-- 图片消息 -->
                   <view v-else-if="message.msg_type === 1" class="image-message">
                     <image 
                       :src="getImageUrl(message.link)" 
                       mode="aspectFill" 
                       class="message-image"
                       @click="previewImage(message.link)"
                     />
                   </view>
                   
                   <!-- 文件消息 -->
                   <view v-else-if="message.msg_type === 2" class="file-message" @click="downloadFile(message.link)">
                     <text class="file-icon">📂</text>
                     <text class="file-name">{{ message.content }}</text>
                   </view>
                   
                   <!-- 验证信息消息 -->
                   <view v-else-if="message.msg_type === 3" class="verification-message">
                     <view class="verification-content">
                       <text class="verification-text">{{ message.content }}</text>
                       <button v-if="message.sender_uid !== currentUser.uid && !message.approved" class="approve-btn-inline" @click="approveFriendRequest(message)">同意</button>
                     </view>
                   </view>
                   
                   <!-- 分享消息 -->
                   <view v-else-if="message.msg_type === 4" class="share-message">
                     <text class="share-text">{{ message.content }}</text>
                     <view class="share-jump-btn" @click.stop="jumpToShare(message)">
                       <text class="jump-text">点击跳转</text>
                     </view>
                   </view>
                   
                   <!-- 其他类型消息 -->
                   <text v-else class="message-text">{{ message.content }}</text>
                 </view>
                 
               </view>
             </view>
           </view>
        </view>
      </view>
    </scroll-view>

    <!-- 输入框 -->
    <view class="input-container">
      <view class="input-box">
        <view class="add-button" @click="showUploadDialog">
          <text class="add-icon">+</text>
        </view>
        <input 
          class="message-input" 
          v-model="newMessage"
          placeholder="输入消息..."
          @confirm="sendMessage"
          :focus="inputFocus"
          maxlength="250"
        />
        <view class="send-button" @click="sendMessage">
          <text class="send-icon">发送</text>
        </view>
      </view>
    </view>

    <!-- 文件上传选择弹窗 -->
    <view class="dialog-overlay" v-if="showUploadDialogFlag" @click="hideUploadDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">选择文件类型</text>
          <text class="dialog-close" @click="hideUploadDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="upload-options">
            <view class="upload-option" @click="selectImage">
              <text class="upload-icon">📷</text>
              <text class="upload-text">选择图片</text>
            </view>
            <view class="upload-option" @click="selectFile">
              <text class="upload-icon">📁</text>
              <text class="upload-text">选择文件</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索对话框 -->
    <view class="dialog-overlay" v-if="showSearchDialogFlag" @click="hideSearchDialog">
      <view class="search-dialog" @click.stop>
        <view class="search-header">
          <text class="search-title">查找信息</text>
          <text class="search-close" @click="hideSearchDialog">×</text>
        </view>
        <view class="search-content">
          <view class="search-input-container">
            <input 
              class="search-input" 
              v-model="searchText"
              placeholder="输入要查找的文字..."
              @confirm="performSearch"
              :focus="true"
              maxlength="20"
            />
            <view class="search-btn" @click="performSearch">
              <text class="search-btn-text">搜索</text>
            </view>
          </view>
          
          <!-- 搜索结果控制 -->
          <view v-if="searchResults.length > 0" class="search-controls">
            <view class="search-info">
              <text class="search-count">{{ currentSearchIndex + 1 }} / {{ searchResults.length }}</text>
            </view>
            <view class="search-navigation">
              <view class="nav-btn" @click="searchPrevious">
                <text class="nav-icon">↑</text>
              </view>
              <view class="nav-btn" @click="searchNext">
                <text class="nav-icon">↓</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js'
import secureParamsManager from '@/utils/secureParams.js'
import ChatCache from '@/utils/chatCache.js'
import * as ChatScroll from '@/utils/chatScroll.js'

export default {
  data() {
    return {
      contactInfo: {
        uid: '',
        name: '',
        avatar: '',
        type: null
      },
      currentUser: {
        uid: '',
        name: '',
        avatar: '',
        type: null
      },
      messages: [],
      newMessage: '',
      scrollTop: 999999,
      chatLastTop: 0, chatViewportHeight: 0, chatNearBottom: true, chatScrollReady: false,
      inputFocus: false,
      loading: false,
      page: 1,
      hasMore: true,
      showUploadDialogFlag: false,
      // 搜索相关
      showSearchDialogFlag: false,
      searchText: '',
      searchResults: [],
      currentSearchIndex: 0,
      highlightMessageIds: [],
      // 缓存相关
      isDataFromCache: false,
      backgroundUpdateInProgress: false,
      // 已读状态相关
      readStatusTimer: null,
      lastReadMsgId: 0,
      // 消息更新相关
      messageUpdateTimer: null,
      updateInterval: 3000, // 3秒轮询一次
      backgroundUpdateInterval: 10000, // 后台10秒轮询一次
      isPageVisible: true,
      isPageFocused: true,
      lastMessageCount: 0,
      // 请求防重复
      isCheckingNewMessages: false,
      lastCheckTime: 0,
      minCheckInterval: 1000, // 最小检查间隔1秒
      // 发送消息防重复检查
      lastSendTime: 0,
      sendCooldownTime: 2000 // 发送消息后2秒内不检查新消息
    }
  },
  computed: {
    // 安全地检查消息是否由当前用户发送
    isCurrentUserMessage() {
      return (message) => {
        return !message.is_auto_alert && this.currentUser.uid && message.sender_uid === this.currentUser.uid
      }
    }
  },
  async onLoad(options) {
    // 安全地获取传递的参数
    this.loadChatParams(options)
    // 先加载用户信息，再加载消息
    await this.loadUserInfo()
    this.loadMessages()
    // 设置页面焦点监听器
    this.setupFocusListeners()
  },
  onShow() {
    // 页面显示时检查是否需要后台更新
    this.checkAndUpdateMessages()
    // 更新已读状态
    this.updateReadStatus()
    // 启动已读状态定时更新
    this.startReadStatusTimer()
    // 启动消息更新定时器
    this.startMessageUpdateTimer()
    // 设置页面为可见状态
    this.isPageVisible = true
  },
  onUnload() {
    ChatScroll.remember(this, 'private', this.contactInfo.uid)
    // 页面卸载时清除缓存
    uni.removeStorageSync('private_chat_contact')
    // 停止已读状态定时器
    this.stopReadStatusTimer()
    // 停止消息更新定时器
    this.stopMessageUpdateTimer()
    // 移除焦点监听器
    this.removeFocusListeners()
    // 设置页面为不可见状态
    this.isPageVisible = false
    this.isPageFocused = false
  },
  onHide() {
    ChatScroll.remember(this, 'private', this.contactInfo.uid)
    // 页面隐藏时停止消息更新定时器
    this.stopMessageUpdateTimer()
    // 设置页面为不可见状态
    this.isPageVisible = false
  },
  methods: {
    /**
     * 安全地加载聊天参数
     */
    loadChatParams(options) {
      // 优先使用新的安全会话参数
      if (options.session && secureParamsManager.isValidSessionId(options.session)) {
        const sessionData = secureParamsManager.getChatParams(options.session)
        if (sessionData && sessionData.type === 'private') {
          this.contactInfo.uid = sessionData.targetId
          this.contactInfo.name = sessionData.name
          this.contactInfo.avatar = sessionData.avatar || '/static/avatar.png'
          
          // 保存到本地缓存
          this.saveContactToCache()
          
          // 使用后立即删除会话数据，确保一次性使用
          secureParamsManager.removeSession(options.session)
          return
        }
      }
      
      // 兼容旧的直接参数传递方式（向后兼容）
      if (options.uid) {
        this.contactInfo.uid = options.uid
        this.contactInfo.name = options.name || '未知用户'
        this.contactInfo.avatar = options.avatar || '/static/avatar.png'
        
        // 保存到本地缓存
        this.saveContactToCache()
        return
      }
      
      // 尝试从本地缓存读取
      const cachedContact = this.getContactFromCache()
      if (cachedContact) {
        this.contactInfo = cachedContact
        return
      }
      
      // 如果没有有效参数，显示错误并返回
      uni.showToast({
        title: '无效的聊天参数',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 2000)
    },
    
    async loadUserInfo() {
      try {
        // 获取当前用户信息
        const userRes = await Database.verifyToken()
        if (userRes.success) {
          this.currentUser.uid = userRes.user.uid
          this.currentUser.type = userRes.user.type
          // 获取用户详细信息
          const userDetailRes = await Database.getUserById(userRes.user.uid)
          if (userDetailRes.success) {
            this.currentUser.name = userDetailRes.user.name
            this.currentUser.avatar = this.getAvatarUrl(userDetailRes.user.avatar, 'private')
          }
          const contactRes = await Database.getUserById(this.contactInfo.uid)
          if (contactRes.success) {
            this.contactInfo.type = contactRes.user.type
            this.contactInfo.avatar = this.getAvatarUrl(contactRes.user.avatar, 'private')
          }
        }
      } catch (error) {
      }
    },
    async loadMessages() {
      this.loading = true;
      this.isDataFromCache = false;
      
      try {
        // 1. 优先从缓存加载消息
        await this.loadMessagesFromCache()
        // 入会话时总是核对最新消息，避免缓存掩盖新提醒。
        try {
          const latest = await Database.getPrivateMessages(this.contactInfo.uid, 50, 0)
          if (latest.success) this.messages = ChatCache.mergePrivateMessagesToCache(this.contactInfo.uid, latest.messages.reverse())
        } catch (_) { /* Keep cached messages visible when the network is unavailable. */ }
        await this.updateReadStatus()
        ChatScroll.restore(this, 'private', this.contactInfo.uid)
        
        // 2. 后台异步更新消息
        this.updateMessagesInBackground()
        
      } catch (error) {
        uni.showToast({
          title: '加载消息失败',
          icon: 'none'
        })
      } finally {
        this.loading = false;
      }
    },

    /**
     * 从缓存加载消息
     */
    async loadMessagesFromCache() {
      try {
        // 尝试从缓存加载消息
        const cachedMessages = ChatCache.getPrivateMessagesCache(this.contactInfo.uid)
        if (cachedMessages && cachedMessages.length > 0) {
          this.messages = [...cachedMessages]
          this.isDataFromCache = true
          
        } else {
          // 缓存中没有数据，从服务器加载历史消息
          await this.loadHistoryMessages()
        }
      } catch (error) {
        // 缓存加载失败，从服务器加载
        await this.loadHistoryMessages()
      }
    },

    /**
     * 加载历史消息（当缓存为空时）
     */
    async loadHistoryMessages() {
      try {
        const res = await Database.getPrivateMessages(this.contactInfo.uid, 20, 0)
        if (res.success) {
          this.messages = res.messages.reverse() // 反转数组，让最新消息在底部
          
          // 保存到缓存
          ChatCache.savePrivateMessagesCache(this.contactInfo.uid, this.messages)
          
          // 更新已读状态
          await this.updateReadStatus()
          
          
        } else {
          uni.showToast({
            title: res.message || '加载历史消息失败',
            icon: 'none'
          })
        }
      } catch (error) {
        throw error
      }
    },

    /**
     * 从服务器加载消息
     */
    async loadMessagesFromServer() {
      try {
        const res = await Database.getPrivateMessages(this.contactInfo.uid, 50, 0)
        if (res.success) {
          this.messages = res.messages.reverse() // 反转数组，让最新消息在底部
          
          // 保存到缓存
          ChatCache.savePrivateMessagesCache(this.contactInfo.uid, this.messages)
          
          // 更新已读状态
          await this.updateReadStatus()
          
          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        } else {
          uni.showToast({
            title: res.message || '加载消息失败',
            icon: 'none'
          })
        }
      } catch (error) {
        throw error
      }
    },

    /**
     * 更新已读状态
     */
    async updateReadStatus() {
      try {
        if (!this.currentUser.uid || !this.contactInfo.uid) {
          return
        }

        let lastReadMsgId = 0
        let readTime = new Date().toISOString()

        // 历史消息的时间和编号顺序可能不同，只使用已确认的服务器消息编号。
        lastReadMsgId = this.messages.reduce((max, message) => {
          const id = Number(message.id)
          return !message.pending && Number.isSafeInteger(id) && id > max ? id : max
        }, 0)

        // 如果已读状态没有变化，不需要更新
        if (lastReadMsgId === this.lastReadMsgId) {
          return
        }

        // 只有服务器确认后才记录本地状态，失败时可重试。
        try {
          const result = await Database.updatePrivateReadStatus(this.contactInfo.uid, lastReadMsgId)
          if (!result.success) throw new Error('更新已读状态失败')
          this.lastReadMsgId = Math.max(this.lastReadMsgId, Number(result.last_read_msg_id) || 0)
          ChatCache.savePrivateReadStatus(this.currentUser.uid, this.contactInfo.uid, this.lastReadMsgId, readTime)
          console.log('私聊已读状态已更新到服务器，lastReadMsgId:', lastReadMsgId)
        } catch (error) {
          console.error('更新服务器已读状态失败:', error)
          // 服务器更新失败不影响本地功能
        }
      } catch (error) {
        console.error('更新已读状态失败:', error)
      }
    },

    /**
     * 启动已读状态定时更新
     */
    startReadStatusTimer() {
      // 清除现有定时器
      this.stopReadStatusTimer()
      
      // 每5秒检查一次已读状态
      this.readStatusTimer = setInterval(() => {
        this.updateReadStatus()
      }, 5000)
    },

    /**
     * 停止已读状态定时更新
     */
    stopReadStatusTimer() {
      if (this.readStatusTimer) {
        clearInterval(this.readStatusTimer)
        this.readStatusTimer = null
      }
    },

    /**
     * 启动消息更新定时器
     */
    startMessageUpdateTimer() {
      // 清除现有定时器
      this.stopMessageUpdateTimer()
      
      // 根据页面焦点状态选择更新间隔
      const interval = this.isPageFocused ? this.updateInterval : this.backgroundUpdateInterval
      
      // 设置定时器，定期检查新消息
      this.messageUpdateTimer = setInterval(() => {
        if (this.isPageVisible && !this.backgroundUpdateInProgress) {
          this.checkForNewMessages()
        }
      }, interval)
    },

    /**
     * 停止消息更新定时器
     */
    stopMessageUpdateTimer() {
      if (this.messageUpdateTimer) {
        clearInterval(this.messageUpdateTimer)
        this.messageUpdateTimer = null
      }
    },

    /**
     * 检查新消息
     */
    async checkForNewMessages() {
      // 防重复检查
      if (this.isCheckingNewMessages) {
        return
      }
      
      // 检查最小间隔
      const now = Date.now()
      if (now - this.lastCheckTime < this.minCheckInterval) {
        return
      }
      
      // 如果刚发送过消息，暂时不检查新消息（避免重复处理自己的消息）
      if (now - this.lastSendTime < this.sendCooldownTime) {
        return
      }
      
      this.isCheckingNewMessages = true
      this.lastCheckTime = now
      
      try {
        // 记录当前消息数量和最新消息ID
        const currentMessageCount = this.messages.length
        const currentMessageIds = new Set(this.messages.map(msg => msg.id))
        
        // 检查是否有新消息
        const res = await Database.getPrivateMessages(this.contactInfo.uid, 10, 0)
        if (res.success && res.messages.length > 0) {
          const serverMessages = res.messages.reverse()
          
          // 找出真正的新消息（排除已存在的消息和自己发送的消息）
          const newMessages = serverMessages.filter(msg => 
            !currentMessageIds.has(msg.id) && (msg.sender_uid !== this.currentUser.uid || msg.is_auto_alert)
          )
          
          // 只有真正有新消息时才进行更新
          if (newMessages.length > 0) {
            // 合并服务器消息到缓存
            const mergedMessages = ChatCache.mergePrivateMessagesToCache(this.contactInfo.uid, serverMessages)
            
            // 更新消息列表
            this.messages = mergedMessages
            
            // 显示新消息提示（此时newMessages已经过滤掉了自己的消息）
            this.showNewMessageNotification(newMessages.length)
            
            // 自动滚动到底部（如果用户在底部附近）
            this.autoScrollToBottomIfNeeded()
            
            // 更新已读状态
            this.updateReadStatus()
          }
        }
      } catch (error) {
        console.error('检查新消息失败:', error)
      } finally {
        this.isCheckingNewMessages = false
      }
    },



    /**
     * 如果用户在底部附近则自动滚动到底部
     */
    autoScrollToBottomIfNeeded() {
      // 这里可以根据需要添加判断逻辑，比如检查用户是否在聊天底部
      // 为了简化，我们直接滚动到底部
      if (this.chatNearBottom) this.$nextTick(() => this.scrollToBottom())
    },

    /**
     * 设置页面焦点监听器
     */
    setupFocusListeners() {
      // #ifdef H5
      // 监听页面可见性变化
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
      // 监听窗口焦点变化
      window.addEventListener('focus', this.handleWindowFocus)
      window.addEventListener('blur', this.handleWindowBlur)
      // #endif
    },

    /**
     * 移除页面焦点监听器
     */
    removeFocusListeners() {
      // #ifdef H5
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
      window.removeEventListener('focus', this.handleWindowFocus)
      window.removeEventListener('blur', this.handleWindowBlur)
      // #endif
    },

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
      // #ifdef H5
      this.isPageFocused = !document.hidden
      if (this.isPageFocused) {
        // 页面变为可见时，立即检查新消息并重启定时器
        this.checkForNewMessages()
        this.startMessageUpdateTimer()
      } else {
        // 页面变为不可见时，降低更新频率
        this.startMessageUpdateTimer()
      }
      // #endif
    },

    /**
     * 处理窗口获得焦点
     */
    handleWindowFocus() {
      this.isPageFocused = true
      // 立即检查新消息并重启定时器
      this.checkForNewMessages()
      this.startMessageUpdateTimer()
    },

    /**
     * 处理窗口失去焦点
     */
    handleWindowBlur() {
      this.isPageFocused = false
      // 降低更新频率
      this.startMessageUpdateTimer()
    },

    /**
     * 滚动事件处理
     */
    onScroll(e) {
      ChatScroll.capture(this, e)
      // 滚动时也更新已读状态
      this.updateReadStatus()
    },

    /**
     * 后台更新消息
     */
    async updateMessagesInBackground() {
      if (this.backgroundUpdateInProgress) {
        return // 避免重复更新
      }
      
      this.backgroundUpdateInProgress = true
      
      try {
        
        // 检查缓存是否需要更新
        const shouldUpdate = ChatCache.shouldUpdateMessagesCache('private', this.contactInfo.uid)
        if (!shouldUpdate) {
          return
        }
        
        // 记录当前消息ID集合
        const currentMessageIds = new Set(this.messages.map(msg => msg.id))
        
        // 从服务器获取最新消息
        const res = await Database.getPrivateMessages(this.contactInfo.uid, 50, 0)
        if (res.success) {
          const serverMessages = res.messages.reverse()
          
          // 检查是否有真正的新消息（排除自己发送的消息）
          const newMessages = serverMessages.filter(msg => 
            !currentMessageIds.has(msg.id) && (msg.sender_uid !== this.currentUser.uid || msg.is_auto_alert)
          )
          
          // 只有在有新消息时才进行更新
          if (newMessages.length > 0) {
            // 合并服务器消息到缓存
            const mergedMessages = ChatCache.mergePrivateMessagesToCache(this.contactInfo.uid, serverMessages)
            
            // 更新本地消息列表
            this.messages = mergedMessages
            
            // 如果有新消息且页面可见，滚动到底部
            if (this.isPageVisible && this.chatNearBottom) {
              this.$nextTick(() => {
                this.scrollToBottom()
              })
            }
          }
          
        }
      } catch (error) {
        console.error('后台更新私聊消息失败:', error)
      } finally {
        this.backgroundUpdateInProgress = false
      }
    },

    /**
     * 检查并更新消息（页面显示时调用）
     */
    async checkAndUpdateMessages() {
      if (this.backgroundUpdateInProgress) {
        return
      }
      
      try {
        // 检查缓存是否需要更新
        const shouldUpdate = ChatCache.shouldUpdateMessagesCache('private', this.contactInfo.uid)
        if (shouldUpdate) {
          this.updateMessagesInBackground()
        }
      } catch (error) {
        console.error('检查消息更新失败:', error)
      }
    },
    async sendMessage() {
      if (!this.newMessage.trim()) return
      
      const messageContent = this.newMessage.trim()
      
      try {
        // 检查是否需要验证好友关系（自己和管理员不需要）
        const needFriendCheck = this.contactInfo.uid !== this.currentUser.uid && this.currentUser.type !== 0 && this.contactInfo.type !== 0
        
        if (needFriendCheck) {
          // 检查好友关系
          const friendCheck = await Database.checkFriendRelationship(this.contactInfo.uid)
          if (!friendCheck.success) {
            uni.showToast({
              title: '检查好友关系失败',
              icon: 'none'
            })
            return
          }
          
          if (!friendCheck.is_friend) {
            uni.showToast({
              title: '您与该用户不是好友关系，无法发送消息',
              icon: 'none'
            })
            return
          }
        }
        
        // 先添加到消息列表（乐观更新）
        const tempMessage = {
          id: Date.now(),
          pending: true,
          sender_uid: this.currentUser.uid,
          receiver_uid: this.contactInfo.uid,
          content: messageContent,
          sent_time: new Date().toISOString(),
          msg_type: 0,
          link: null
        }
        
        this.messages.push(tempMessage)
        
        // 清空输入框
        this.newMessage = ''
        
        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom()
        })
        
        // 发送消息到服务器
        const res = await Database.sendPrivateMessage(this.contactInfo.uid, messageContent, 0, null)
        if (res.success) {
          // 更新消息ID
          tempMessage.id = res.message_id
          tempMessage.pending = false
          
          // 记录发送时间，用于防止立即检查新消息
          this.lastSendTime = Date.now()
          
          // 将新消息添加到缓存
          ChatCache.addPrivateMessageToCache(this.contactInfo.uid, tempMessage)
          
          // 更新通讯首页的最新消息缓存
          this.updateLatestMessagesCache(tempMessage)
          await this.updateReadStatus()
        } else {
          // 发送失败，移除消息
          const index = this.messages.findIndex(m => m.id === tempMessage.id)
          if (index > -1) {
            this.messages.splice(index, 1)
          }
          uni.showToast({
            title: res.message || '发送失败',
            icon: 'none'
          })
        }
        
      } catch (error) {
        console.error('发送消息失败:', error)
        uni.showToast({
          title: '发送失败',
          icon: 'none'
        })
      }
    },
    loadMoreMessages() {
      // 加载更多历史消息
      if (this.hasMore) {
        this.page++
        // 这里需要实现加载更多消息的逻辑
      }
    },
    shouldShowTime(message, index) {
      if (index === 0) return true
      
      // 检查时间字段是否存在
      if (!message.sent_time || !this.messages[index - 1] || !this.messages[index - 1].sent_time) {
        return false
      }
      
      // 处理数据库时间格式
      let currentTime, prevTime
      
      if (message.sent_time.includes('T') || message.sent_time.includes('Z') || message.sent_time.includes('+')) {
        currentTime = new Date(message.sent_time)
      } else {
        currentTime = new Date(message.sent_time + '+08:00')
      }
      
      const prevTimeString = this.messages[index - 1].sent_time
      if (prevTimeString.includes('T') || prevTimeString.includes('Z') || prevTimeString.includes('+')) {
        prevTime = new Date(prevTimeString)
      } else {
        prevTime = new Date(prevTimeString + '+08:00')
      }
      
      const diffMinutes = (currentTime - prevTime) / (1000 * 60)
      
      return diffMinutes >= 10
    },
    formatTime(timeString) {
      if (!timeString) return ''
      
      // 处理数据库时间格式 "2025-10-02 14:15:00"
      // 如果时间字符串不包含时区信息，假设它是服务器本地时间（东八区）
      let time
      if (timeString.includes('T') || timeString.includes('Z') || timeString.includes('+')) {
        // 已包含时区信息的ISO格式
        time = new Date(timeString)
      } else {
        // MySQL DATETIME格式，需要手动处理时区
        // 假设数据库时间是东八区时间，转换为本地时间
        const dbTime = new Date(timeString + '+08:00') // 添加东八区时区标识
        time = dbTime
      }
      
      const now = new Date()
      const diffMinutes = (now - time) / (1000 * 60)
      
      if (diffMinutes < 1) {
        return '刚刚'
      } else if (diffMinutes < 60) {
        return `${Math.floor(diffMinutes)}分钟前`
      } else if (diffMinutes < 1440) {
        return `${Math.floor(diffMinutes / 60)}小时前`
      } else {
        // 格式化为 "m月d日"
        const month = time.getMonth() + 1
        const day = time.getDate()
        return `${month}月${day}日`
      }
    },
    getSenderAvatar(message) {
      // 确保用户信息已加载
      if (!this.currentUser.uid) {
        return '/static/avatar.png'
      }
      
      if (message.sender_uid === this.currentUser.uid) {
        return this.getAvatarUrl(this.currentUser.avatar, 'private') || '/static/avatar.png'
      }
      // 如果是对方发送的消息，使用对方头像
      return this.getAvatarUrl(this.contactInfo.avatar, 'private') || '/static/avatar.png'
    },
    getSenderName(message) {
      if (message.is_auto_alert) return '系统自动预警'
      // 确保用户信息已加载
      if (!this.currentUser.uid) {
        return '未知用户'
      }
      
      if (message.sender_uid === this.currentUser.uid) {
        return this.currentUser.name || '我'
      }
      // 如果是对方发送的消息，使用对方名称
      return this.contactInfo.name || '未知用户'
    },
    scrollToBottom() {
      ChatScroll.bottom(this)
    },
    goBack() {
      uni.switchTab({
        url: '/pages/chat/index'
      })
    },
    showContactDetail() {
      // 特殊处理管理员
      if (this.contactInfo.uid === 'psyadmin') {
        this.showAdminDetail()
        return
      }
      
      uni.showActionSheet({
        itemList: ['查看资料', '设置备注', '查找信息', '删除好友'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 查看资料 - 跳转到个人空间
            uni.navigateTo({
              url: `/pages/personalSpace/index?uid=${this.contactInfo.uid}`
            })
          } else if (res.tapIndex === 1) {
            // 设置备注
            this.showSetRemarkDialog()
          } else if (res.tapIndex === 2) {
            // 查找信息
            this.showSearchDialog()
          } else if (res.tapIndex === 3) {
            // 删除好友
            this.showDeleteFriendDialog()
          }
        }
      })
    },
    
    showSetRemarkDialog() {
      uni.showModal({
        title: '设置备注',
        editable: true,
        placeholderText: '请输入备注名称（最多20字）',
        success: async (res) => {
          if (res.confirm) {
            const remark = res.content.trim()
            try {
              const result = await Database.updateContactRemark(this.contactInfo.uid, remark)
              if (result.success) {
                uni.showToast({
                  title: '设置备注成功',
                  icon: 'success'
                })
                // 更新联系人信息显示
                this.contactInfo.remark = remark
                this.contactInfo.displayName = remark || this.contactInfo.name
              } else {
                uni.showToast({
                  title: result.message || '设置备注失败',
                  icon: 'none'
                })
              }
            } catch (error) {
              console.error('设置备注失败:', error)
              uni.showToast({
                title: '设置备注失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    
    showDeleteFriendDialog() {
      uni.showModal({
        title: '删除好友',
        content: `确定要删除好友"${this.contactInfo.displayName || this.contactInfo.name}"吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await Database.deleteContact(this.contactInfo.uid)
              if (result.success) {
                uni.showToast({
                  title: '删除好友成功',
                  icon: 'success'
                })
                setTimeout(() => {
                  uni.navigateBack()
                }, 1500)
              } else {
                uni.showToast({
                  title: result.message || '删除好友失败',
                  icon: 'none'
                })
              }
            } catch (error) {
              console.error('删除好友失败:', error)
              uni.showToast({
                title: '删除好友失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },
    showAdminDetail() {
      uni.showActionSheet({
        itemList: ['致电管理员', '其他功能'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 致电管理员
            uni.showModal({
              title: '联系管理员',
              content: '是否要联系管理员？',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  uni.showToast({
                    title: '正在联系管理员...',
                    icon: 'loading'
                  })
                }
              }
            })
          } else if (res.tapIndex === 1) {
            // 其他功能
            uni.showActionSheet({
              itemList: ['意见反馈', '帮助中心', '关于我们'],
              success: (actionRes) => {
                switch (actionRes.tapIndex) {
                  case 0:
                    uni.showToast({
                      title: '意见反馈功能开发中',
                      icon: 'none'
                    })
                    break
                  case 1:
                    uni.showToast({
                      title: '帮助中心功能开发中',
                      icon: 'none'
                    })
                    break
                  case 2:
                    uni.showToast({
                      title: '关于我们功能开发中',
                      icon: 'none'
                    })
                    break
                }
              }
            })
          }
        }
      })
    },
    getAvatarUrl(avatar) {
      if (!avatar) {
        return '/static/avatar.png'
      }
      
      // 如果是完整URL，直接返回
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar
      }
      
      // 如果是相对路径，添加后端基础URL
      if (avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${avatar}`
      }
      
      // 如果是默认头像路径，直接返回
      if (avatar.startsWith('/static/')) {
        return avatar
      }
      
      // 默认情况
      return '/static/avatar.png'
    },
    showUploadDialog() {
      this.showUploadDialogFlag = true
    },
    hideUploadDialog() {
      this.showUploadDialogFlag = false
    },
    selectImage() {
      this.hideUploadDialog()
      this.chooseImage()
    },
    selectFile() {
      this.hideUploadDialog()
      this.chooseFile()
    },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const filePath = res.tempFilePaths[0]
          const fileName = "[图片]"
          this.uploadFile("[图片]", 1, filePath) // 1表示图片
        },
        fail: (err) => {
          console.error('选择图片失败:', err)
          uni.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      })
    },
    chooseFile() {
      uni.chooseFile({
        count: 1,
        type: 'all',
        success: (res) => {
          const filePath = res.tempFilePaths[0]
          // 尝试从tempFiles获取原始文件名，如果没有则从路径提取
          const fileName = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].name 
            ? res.tempFiles[0].name 
            : this.getFileName(filePath)
          this.uploadFile(fileName, 2, filePath) // 2表示文件
        },
        fail: (err) => {
          console.error('选择文件失败:', err)
          uni.showToast({
            title: '选择文件失败',
            icon: 'none'
          })
        }
      })
    },
    async uploadFile(name, msgType, filePath) {
      try {
        // 检查文件大小（15MB限制）
        const fileInfo = await this.getFileInfo(filePath)
        const maxSize = 15 * 1024 * 1024 // 15MB
        
        if (fileInfo.size > maxSize) {
          uni.showToast({
            title: '文件大小不能超过15MB',
            icon: 'none'
          })
          return
        }
        
        uni.showLoading({
          title: msgType === 1 ? '上传图片中...' : '上传文件中...'
        })
        
        try {
          // 上传文件
          const uploadRes = await this.uploadToServer(filePath, msgType)
          
          if (uploadRes.success) {
            // 发送消息
            await this.sendMessageWithContent(name, msgType, uploadRes.url)
          } else {
            uni.showToast({
              title: uploadRes.message || '上传失败',
              icon: 'none'
            })
          }
        } catch (uploadError) {
          console.error('上传文件失败:', uploadError)
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          })
        } finally {
          uni.hideLoading()
        }
        
      } catch (error) {
        console.error('检查文件失败:', error)
        uni.showToast({
          title: '检查文件失败',
          icon: 'none'
        })
      }
    },
    getFileInfo(filePath) {
      return new Promise((resolve, reject) => {
        uni.getFileInfo({
          filePath,
          success: resolve,
          fail: reject
        })
      })
    },
    uploadToServer(filePath, msgType) {
      return new Promise((resolve, reject) => {
        const uploadUrl = msgType === 1 ? '/upload/message-image' : '/upload/message-file'
        const token = Database.getToken()
        
        if (!token) {
          reject(new Error('未找到认证令牌'))
          return
        }
        
        uni.uploadFile({
          url: `${config.API_BASE_URL}${uploadUrl}`,
          filePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data)
              resolve(data)
            } catch (e) {
              reject(e)
            }
          },
          fail: reject
        })
      })
    },
    async sendMessageWithContent(content, msgType, link=null) {
      try {
        // 检查是否需要验证好友关系（自己和管理员不需要）
        const needFriendCheck = this.contactInfo.uid !== this.currentUser.uid && this.currentUser.type !== 0 && this.contactInfo.type !== 0
        
        if (needFriendCheck) {
          // 检查好友关系
          const friendCheck = await Database.checkFriendRelationship(this.contactInfo.uid)
          if (!friendCheck.success) {
            uni.showToast({
              title: '检查好友关系失败',
              icon: 'none'
            })
            return
          }
          
          if (!friendCheck.is_friend) {
            uni.showToast({
              title: '您与该用户不是好友关系，无法发送消息',
              icon: 'none'
            })
            return
          }
        }
        
        // 根据消息类型设置content内容
        let messageContent = content
        if (msgType === 1) {
          // 图片消息
          messageContent = '[图片]'
        } else if (msgType === 2) {
          // 文件消息
          messageContent = `[文件]${content}`
        }
        
        // 先添加到消息列表（乐观更新）
        const tempMessage = {
          id: Date.now(),
          pending: true,
          sender_uid: this.currentUser.uid,
          receiver_uid: this.contactInfo.uid,
          content: messageContent,
          sent_time: new Date().toISOString(),
          msg_type: msgType,
          link: link
        }
        
        this.messages.push(tempMessage)
        
        // 滚动到底部
        this.$nextTick(() => {
          this.scrollToBottom()
        })
        
        // 发送消息到服务器
        const res = await Database.sendPrivateMessage(this.contactInfo.uid, content, msgType, link)
        if (res.success) {
          // 更新消息ID
          tempMessage.id = res.message_id
          tempMessage.pending = false
          
          // 将新消息添加到缓存
          ChatCache.addPrivateMessageToCache(this.contactInfo.uid, tempMessage)
          
          // 更新通讯首页的最新消息缓存
          this.updateLatestMessagesCache(tempMessage)
          await this.updateReadStatus()
        } else {
          // 发送失败，移除消息
          const index = this.messages.findIndex(m => m.id === tempMessage.id)
          if (index > -1) {
            this.messages.splice(index, 1)
          }
          uni.showToast({
            title: res.message || '发送失败',
            icon: 'none'
          })
        }
        
      } catch (error) {
        console.error('发送消息失败:', error)
        uni.showToast({
          title: '发送失败',
          icon: 'none'
        })
      }
    },
    getImageUrl(imagePath) {
      if (!imagePath) return '/static/avatar.png'
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath
      }
      if (imagePath.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${imagePath}`
      }
      return imagePath
    },
    getFileName(filePath) {
      if (!filePath) return '未知文件'
      const fileName = filePath.split('/').pop()
      return fileName || '未知文件'
    },
    previewImage(imagePath) {
      uni.previewImage({
        urls: [this.getImageUrl(imagePath)],
        current: this.getImageUrl(imagePath)
      })
    },
    downloadFile(filePath) {
      uni.showModal({
        title: '下载文件',
        content: '是否要下载此文件？',
        success: (res) => {
          if (res.confirm) {
            const fileName = this.getFileName(filePath)
            const fileUrl = this.getImageUrl(filePath)
            
            // 在H5环境下，使用window.open下载
            // #ifdef H5
            const link = document.createElement('a')
            link.href = fileUrl
            link.download = fileName
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            uni.showToast({
              title: '开始下载',
              icon: 'success'
            })
            // #endif
            
            // 在APP环境下，使用uni.downloadFile
            // #ifndef H5
            uni.downloadFile({
              url: fileUrl,
              success: (downloadRes) => {
                if (downloadRes.statusCode === 200) {
                  // 保存到相册或文件系统
                  uni.saveFile({
                    tempFilePath: downloadRes.tempFilePath,
                    success: () => {
                      uni.showToast({
                        title: '下载成功',
                        icon: 'success'
                      })
                    },
                    fail: () => {
                      uni.showToast({
                        title: '保存失败',
                        icon: 'none'
                      })
                    }
                  })
                } else {
                  uni.showToast({
                    title: '下载失败',
                    icon: 'none'
                  })
                }
              },
              fail: () => {
                uni.showToast({
                  title: '下载失败',
                  icon: 'none'
                })
              }
            })
            // #endif
          }
        }
      })
    },
    
    async approveFriendRequest(message) {
      try {
        // 从消息的link字段读取申请者UID
        const requesterUid = message.link
        if (!requesterUid) {
          uni.showToast({
            title: '无法获取申请者信息',
            icon: 'none'
          })
          return
        }
        
        // 调用后端API添加双向好友关系
        const res = await Database.addFriend(requesterUid)
        if (res.success) {
          uni.showToast({
            title: '已同意好友申请',
            icon: 'success'
          })
          // 更新消息内容，显示已同意状态
          message.content = message.content + ' (已同意)'
          // 禁用按钮
          message.approved = true
        } else {
          uni.showToast({
            title: res.message || '同意申请失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('同意好友申请失败:', error)
        uni.showToast({
          title: '同意申请失败',
          icon: 'none'
        })
      }
    },
    
    jumpToShare(message) {
      try {
        // 从消息的link字段获取URL
        const url = message.link;
        
        if (url) {
          // 解析URL参数
          const urlObj = new URL(url, 'http://localhost');
          const pathname = urlObj.pathname;
          
          if (pathname.includes('/pages/community/postDetail')) {
            const pid = urlObj.searchParams.get('pid');
            if (pid) {
              uni.navigateTo({
                url: `/pages/community/postDetail?pid=${pid}`
              });
            }
          } else if (pathname.includes('/pages/survey/detail')) {
            const id = urlObj.searchParams.get('id');
            if (id) {
              uni.navigateTo({
                url: `/pages/survey/detail?id=${id}`
              });
            }
          } else {
            uni.showToast({
              title: '无法识别的分享链接',
              icon: 'none'
            });
          }
        } else {
          uni.showToast({
            title: '未找到有效的分享链接',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('跳转分享失败:', error);
        uni.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    },
    
    // 搜索相关方法
    showSearchDialog() {
      this.showSearchDialogFlag = true
      this.searchText = ''
      this.searchResults = []
      this.currentSearchIndex = 0
      this.highlightMessageIds = []
    },
    
    hideSearchDialog() {
      this.showSearchDialogFlag = false
      this.searchText = ''
      this.searchResults = []
      this.currentSearchIndex = 0
      this.highlightMessageIds = []
    },
    
    performSearch() {
      if (!this.searchText.trim()) {
        uni.showToast({
          title: '请输入搜索内容',
          icon: 'none'
        })
        return
      }
      
      const searchTerm = this.searchText.trim().toLowerCase()
      this.searchResults = []
      this.highlightMessageIds = []
      
      // 搜索所有消息
      this.messages.forEach((message, messageIndex) => {
        if (message.msg_type === 0 && message.content.toLowerCase().includes(searchTerm)) {
          this.searchResults.push({
            messageId: message.id,
            messageIndex: messageIndex,
            content: message.content,
            link: message.link
          })
          this.highlightMessageIds.push(message.id)
        }
      })
      
      if (this.searchResults.length === 0) {
        uni.showToast({
          title: '未找到相关内容',
          icon: 'none'
        })
      } else {
        this.currentSearchIndex = 0
        this.scrollToSearchResult(0)
        uni.showToast({
          title: `找到 ${this.searchResults.length} 条结果`,
          icon: 'success'
        })
      }
    },
    
    scrollToSearchResult(index) {
      if (index < 0 || index >= this.searchResults.length) return
      
      this.currentSearchIndex = index
      const result = this.searchResults[index]
      const messageIndex = result.messageIndex
      
      // 计算滚动位置
      const scrollTop = messageIndex * 100 // 估算每条消息高度
      this.scrollTop = scrollTop
      
      // 高亮当前搜索结果
      this.$nextTick(() => {
        this.highlightMessageIds = [result.messageId]
      })
    },
    
    searchPrevious() {
      if (this.searchResults.length === 0) return
      
      const newIndex = this.currentSearchIndex > 0 
        ? this.currentSearchIndex - 1 
        : this.searchResults.length - 1
      this.scrollToSearchResult(newIndex)
    },
    
    searchNext() {
      if (this.searchResults.length === 0) return
      
      const newIndex = this.currentSearchIndex < this.searchResults.length - 1 
        ? this.currentSearchIndex + 1 
        : 0
      this.scrollToSearchResult(newIndex)
    },
    
    highlightText(text) {
      const escapeHtml = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
      const safeText = escapeHtml(text)
      const term = escapeHtml(this.searchText.trim())
      if (!term) return safeText
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      return safeText.replace(regex, '<span class="highlight-text">$1</span>')
    },
    
    /**
     * 保存联系人信息到本地缓存
     */
    saveContactToCache() {
      try {
        const cacheData = {
          uid: this.contactInfo.uid,
          name: this.contactInfo.name,
          avatar: this.contactInfo.avatar,
          timestamp: Date.now()
        }
        uni.setStorageSync('private_chat_contact', cacheData)
      } catch (error) {
        console.error('保存联系人缓存失败:', error)
      }
    },
    
    /**
     * 从本地缓存读取联系人信息
     */
    getContactFromCache() {
      try {
        const cacheData = uni.getStorageSync('private_chat_contact')
        if (cacheData && cacheData.uid) {
          // 检查缓存是否过期（24小时）
          const now = Date.now()
          const cacheTime = cacheData.timestamp || 0
          const expireTime = 24 * 60 * 60 * 1000 // 24小时
          
          if (now - cacheTime < expireTime) {
            return {
              uid: cacheData.uid,
              name: cacheData.name,
              avatar: cacheData.avatar
            }
          } else {
            // 缓存过期，清除
            this.clearContactCache()
          }
        }
        return null
      } catch (error) {
        console.error('读取联系人缓存失败:', error)
        return null
      }
    },
    
    /**
     * 更新通讯首页的最新消息缓存
     */
    updateLatestMessagesCache(message) {
      try {
        // 构造最新消息格式
        const latestMessage = {
          chat_type: 'private',
          contact_id: this.contactInfo.uid,
          contact_name: this.contactInfo.name,
          contact_avatar: this.contactInfo.avatar,
          sender_uid: message.sender_uid,
          sender_name: this.currentUser.name,
          content: message.content,
          sent_time: message.sent_time,
          msg_type: message.msg_type
        }
        
        // 更新最新消息缓存
        ChatCache.updateMessageCache(latestMessage)
      } catch (error) {
        console.error('更新最新消息缓存失败:', error)
      }
    },

    /**
     * 清除联系人缓存
     */
    clearContactCache() {
      try {
        uni.removeStorageSync('private_chat_contact')
        // 同时清除该联系人的消息缓存
        ChatCache.clearPrivateMessagesCache(this.contactInfo.uid)
      } catch (error) {
        console.error('清除联系人缓存失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  background-image: url('/static/bgc.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

.chat-header {
  display: flex;
  align-items: center;
  height: 88rpx;
  background: white;
  border-bottom: 1rpx solid #e0e0e0;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.header-left, .header-right {
  width: 80rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon, .detail-icon {
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
}

.contact-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.message-list {
  flex: 1;
  padding: 20rpx;
  box-sizing: border-box;
  overflow-y: auto;
}

.message-container {
  min-height: 100%;
}

.message-group {
  margin-bottom: 20rpx;
}

.time-divider {
  text-align: center;
  margin: 20rpx 0;
}

.time-text {
  font-size: 24rpx;
  color: #999;
  background: #f0f0f0;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.message-item {
  display: flex;
  margin-bottom: 20rpx;
}

.message-right {
  justify-content: flex-end;
}

.message-left {
  justify-content: flex-start;
}

.sender-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16rpx;
  min-width: 80rpx;
}

.sender-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-bottom: 8rpx;
}

.sender-name {
  font-size: 20rpx;
  color: #999;
  text-align: center;
}

.message-bubble-container {
  max-width: 70%;
  position: relative;
}

.message-bubble {
  position: relative;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  word-wrap: break-word;
}

.bubble-right {
  background:rgb(80, 192, 121);
  color: white;
}

.bubble-left {
  background: white;
  color: #333;
  border: 1rpx solid #e0e0e0;
}

.bubble-arrow {
  position: absolute;
  top: 20rpx;
  width: 0;
  height: 0;
  border: 8rpx solid transparent;
}

.arrow-right {
  right: -16rpx;
  border-left-color: #36b062;
}

.arrow-left {
  left: -16rpx;
  border-right-color: white;
  border-left: none;
}

.message-content {
  line-height: 1.4;
}

.message-text {
  font-size: 28rpx;
  line-height: 1.4;
  white-space: pre-wrap;
}

.input-container {
  background: white;
  border-top: 1rpx solid #e0e0e0;
  padding: 20rpx;
  box-sizing: border-box;
}

.input-box {
  display: flex;
  align-items: center;
  background: #f8f8f8;
  border-radius: 24rpx;
  padding: 0 20rpx;
  height: 80rpx;
  gap: 16rpx;
}

.message-input {
  flex: 1;
  height: 60rpx;
  font-size: 28rpx;
  color: #333;
  background: transparent;
  border: none;
}

.send-button {
  background: #55B99E;
  color: white;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  margin-left: 16rpx;
}

.send-icon {
  font-size: 24rpx;
  color: white;
}

/* 圆形加号按钮 */
.add-button {
  width: 60rpx;
  height: 60rpx;
  background: #55B99E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-button:active {
  transform: scale(0.95);
  background: #0056CC;
}

.add-icon {
  font-size: 28rpx;
  color: white;
  font-weight: bold;
}

/* 图片消息样式 */
.image-message {
  height: 120rpx;  /* 固定高度 */
  width: 200rpx;
  border-radius: 8rpx;
}

/* 图片本身 */
.message-image {
  width: auto;      /* 宽度自动 */
  height: 100%;     /* 高度100%填充容器 */
  display: block;   /* 消除图片底部间隙 */
  object-fit: cover; /* 填充方式，H5可用 */
}

/* 文件消息样式 */
.file-message {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8rpx;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.file-message:active {
  background: rgba(0, 0, 0, 0.1);
}

.file-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.file-name {
  font-size: 24rpx;
  color: #333;
  text-decoration: underline;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 16rpx;
  width: 80%;
  max-width: 500rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.dialog-title {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
}

.dialog-close {
  font-size: 40rpx;
  color: #7f8c8d;
  cursor: pointer;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.dialog-close:active {
  background-color: #f0f0f0;
}

.dialog-content {
  padding: 40rpx;
}

.upload-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.upload-option {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  transition: background-color 0.2s ease;
}

.upload-option:active {
  background-color: #e9ecef;
}

.upload-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
}

/* 验证信息消息样式 */
.verification-message {
  padding: 16rpx;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 8rpx;
  border: 1rpx solid rgba(52, 152, 219, 0.3);
}

.verification-content {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.verification-text {
  font-size: 26rpx;
  color: #2c3e50;
  line-height: 1.4;
  flex: 1;
}

.approve-btn-inline {
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 16rpx;
  padding: 8rpx 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.approve-btn-inline:active {
  background: #229954;
  transform: scale(0.95);
}

/* 分享消息样式 */
.share-message {
  padding: 16rpx;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 8rpx;
  border: 1rpx solid rgba(52, 152, 219, 0.3);
  display: block;
}

.share-text {
  font-size: 26rpx;
  color: #2c3e50;
  line-height: 1.4;
  margin-bottom: 12rpx;
  display: block;
  word-wrap: break-word;
}

.share-jump-btn {
  background: #55B99E;
  color: white;
  border: none;
  border-radius: 16rpx;
  padding: 8rpx 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-block;
  text-align: center;
  margin-top: 8rpx;
  cursor: pointer;
  width: auto;
  min-width: 120rpx;
}

.share-jump-btn:active {
  background: #2980b9;
  transform: scale(0.95);
}

.jump-text {
  color: white;
  font-size: 22rpx;
  font-weight: 500;
}

/* 加载提示样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  height: 100%;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #2ca163;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 搜索相关样式 */
.search-dialog {
  background: white;
  border-radius: 16rpx;
  width: 90%;
  max-width: 600rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-title {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
}

.search-close {
  font-size: 40rpx;
  color: #7f8c8d;
  cursor: pointer;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.search-close:active {
  background-color: #f0f0f0;
}

.search-content {
  padding: 40rpx;
}

.search-input-container {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  padding: 0 24rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #333;
  background: #f8f9fa;
}

.search-input:focus {
  border-color: #55B99E;
  background: white;
}

.search-btn {
  background: #55B99E;
  color: white;
  padding: 20rpx 32rpx;
  border-radius: 40rpx;
  transition: all 0.2s ease;
}

.search-btn:active {
  background: #0056CC;
  transform: scale(0.95);
}

.search-btn-text {
  font-size: 28rpx;
  color: white;
  font-weight: 500;
}

.search-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.search-info {
  flex: 1;
}

.search-count {
  font-size: 26rpx;
  color: #666;
  font-weight: 500;
}

.search-navigation {
  display: flex;
  gap: 16rpx;
}

.nav-btn {
  width: 60rpx;
  height: 60rpx;
  background: #55B99E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-btn:active {
  background: #0056CC;
  transform: scale(0.95);
}

.nav-icon {
  font-size: 24rpx;
  color: white;
  font-weight: bold;
}

/* 高亮样式 */
.highlight-message {
  background: rgba(255, 235, 59, 0.3) !important;
  border: 2rpx solid #ffc107 !important;
  border-radius: 12rpx !important;
}

.highlight-text {
  background: #ffeb3b;
  color: #333;
  padding: 2rpx 4rpx;
  border-radius: 4rpx;
  font-weight: bold;
}

</style>

