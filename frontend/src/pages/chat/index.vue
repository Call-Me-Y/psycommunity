<template>
  <view class="consultation-container">
    <view class="header">
      <view class="header-content">
        <view class="title-section">
          <text class="page-title">通讯</text>
          <text class="subtitle">我的好友和群组</text>
        </view>
      </view>
    </view>

    <view class="content">
      <!-- 搜索栏 -->
      <view class="search-section">
        <view class="search-container">
          <input 
            class="search-input" 
            placeholder="搜索好友或群组..." 
            v-model="searchKeyword"
            @input="onSearch"
          />
          <view class="add-button" @click="showAddDialog">
            <text class="add-icon">+</text>
          </view>
        </view>
      </view>

      <!-- 消息列表 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">消息</text>
          <text class="section-count">{{ unreadMessageCount }}</text>
          <view class="refresh-button" @click="refreshData" :class="{ 'refreshing': loading }">
            <text class="refresh-icon">🗘</text>
          </view>
        </view>
        
        <!-- 加载中提示 -->
        <view v-if="loading" class="loading-container">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 消息列表 -->
        <view class="list-container" v-else>
          <view 
            v-for="message in filteredMessages" 
            :key="`${message.chat_type}_${message.contact_id}`" 
            class="list-item"
            @click="openChat(message)"
          >
            <image 
              class="avatar" 
              :src="getAvatarUrl(message.contact_avatar, message.chat_type)" 
              mode="aspectFill"
            />
            <view class="item-content">
              <text class="item-name">{{ formatContactName(message) }}</text>
              <text class="item-preview">{{ formatMessagePreview(message) }}</text>
            </view>
            <view class="message-time">
              <text class="time-text">{{ formatTime(message.sent_time) }}</text>
              <!-- 未读消息数量提示 -->
              <view v-if="message.unreadCount > 0" class="unread-badge">
                <text class="unread-count">{{ message.unreadCount }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加好友/群组弹窗 -->
    <view class="dialog-overlay" v-if="showDialog" @click="hideDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">添加</text>
          <text class="dialog-close" @click="hideDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="dialog-options">
            <view class="option-item" @click="showAddFriend">
              <text class="option-icon">👤</text>
              <text class="option-text">查找用户</text>
            </view>
            <view class="option-item" @click="showJoinGroup">
              <text class="option-icon">👥</text>
              <text class="option-text">加入群组</text>
            </view>
            <view class="option-item" @click="showCreateGroup">
              <text class="option-icon">➕</text>
              <text class="option-text">创建群组</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加好友弹窗 -->
    <view class="dialog-overlay" v-if="showAddFriendDialog" @click="hideAddFriendDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">查找用户</text>
          <text class="dialog-close" @click="hideAddFriendDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="search-container">
            <input 
              class="search-input" 
              placeholder="搜索用户ID或昵称..." 
              v-model="friendSearchKeyword"
              @input="searchFriends"
            />
          </view>
          <view class="search-results">
            <view 
              v-for="user in friendSearchResults" 
              :key="user.uid" 
              class="search-result-item"
              @click="goToPersonalSpace(user.uid)"
            >
              <image class="avatar" :src="user.avatar" mode="aspectFill" />
              <view class="result-content">
                <text class="result-name">{{ user.name }}</text>
                <text class="result-id">{{ user.uid }}</text>
              </view>
              <text class="add-btn">查看</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 加入群组弹窗 -->
    <view class="dialog-overlay" v-if="showJoinGroupDialog" @click="hideJoinGroupDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">加入群组</text>
          <text class="dialog-close" @click="hideJoinGroupDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="search-container">
            <input 
              class="search-input" 
              placeholder="搜索群组ID或名称..." 
              v-model="groupSearchKeyword"
              @input="searchGroups"
            />
          </view>
          <view class="search-results">
            <view 
              v-for="group in groupSearchResults" 
              :key="group.gid" 
              class="search-result-item"
              @click="joinGroup(group)"
            >
              <image class="avatar" :src="group.avatar" mode="aspectFill" />
              <view class="result-content">
                <text class="result-name">{{ group.name }}</text>
                <text class="result-id">群组ID: {{ group.gid }}</text>
              </view>
              <text class="add-btn">加入</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 创建群组弹窗 -->
    <view class="dialog-overlay" v-if="showCreateGroupDialog" @click="hideCreateGroupDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">创建群组</text>
          <text class="dialog-close" @click="hideCreateGroupDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="form-item">
            <text class="form-label">群组名称</text>
            <input 
              class="form-input" 
              placeholder="请输入群组名称（最多20字）" 
              v-model="newGroupName"
              maxlength="20"
            />
          </view>
          <view class="form-actions">
            <button class="btn-cancel" @click="hideCreateGroupDialog">取消</button>
            <button class="btn-confirm" @click="createGroup">创建</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js'
import ChatNavigation from '@/utils/chatNavigation.js'
import ChatCache from '@/utils/chatCache.js'
import backgroundService from '@/utils/backgroundService.js'
import notificationManager from '@/utils/notificationManager.js'
import { installMousePullRefresh, removeMousePullRefresh } from '@/utils/mousePullRefresh.js'

export default {
  data() {
    return {
      searchKeyword: '',
      latestMessages: [],
      agentPreview: null,
      currentUser: {
        uid: '',
        name: '',
        avatar: '',
        type: null
      },
      loading: false,
      showDialog: false,
      showAddFriendDialog: false,
      showJoinGroupDialog: false,
      showCreateGroupDialog: false,
      friendSearchKeyword: '',
      groupSearchKeyword: '',
      friendSearchResults: [],
      groupSearchResults: [],
      newGroupName: '',
      isDataFromCache: false, // 标记数据是否来自缓存
      backgroundUpdateInProgress: false, // 标记后台更新是否进行中
      showCacheStats: false, // 是否显示缓存统计
      cacheStatsText: '' // 缓存统计文本
    }
  },
  computed: {
    filteredMessages() {
      const special = [
        { chat_type: 'agent', contact_id: 'agent', contact_name: 'AI 助手', contact_avatar: '/static/avatar.png', sender_name: this.agentPreview && this.agentPreview.role === 'user' ? '我' : 'AI 助手', content: this.agentPreview ? this.agentPreview.content : '点击开始对话', sent_time: this.agentPreview ? this.agentPreview.created_at : '', unreadCount: 0 }
      ]
      const all = special.concat(this.latestMessages)
      if (!this.searchKeyword) return all
      return all.filter(message =>
        message.contact_name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        String(message.contact_id).toLowerCase().includes(this.searchKeyword.toLowerCase())
      )
    },
    unreadMessageCount() {
      return this.latestMessages.reduce((total, message) => {
        return total + (message.unreadCount || 0)
      }, 0)
    }
  },
  onLoad() {
    this.setupVisibilityListener()
  },
  onShow() {
    this.loadAgentPreview()
    this.loadData()
    this.removeBackgroundListeners()
    this.setupBackgroundListeners()
    // 页面显示时立即检查新消息
    this.checkNewMessagesOnShow()
    this.$nextTick(() => installMousePullRefresh(this))
  },
  async onPullDownRefresh() {
    this.loading = true
    try { await Promise.all([this.loadFromServer(), this.loadAgentPreview()]) }
    finally { this.loading = false; uni.stopPullDownRefresh() }
  },
  onHide() { this.removeBackgroundListeners(); removeMousePullRefresh(this) },
  onUnload() {
    removeMousePullRefresh(this)
    this.removeBackgroundListeners()
    this.removeVisibilityListener()
  },
  methods: {
    loadAgentPreview() {
      return new Promise(resolve => uni.request({ url: `${config.API_BASE_URL}/agent/messages`, header: { Authorization: `Bearer ${Database.getToken()}` },
        success: res => { if (res.data.success) { const items = res.data.messages || []; this.agentPreview = items[items.length - 1] || null } },
        complete: () => resolve() }))
    },
    openAgent() {
      uni.navigateTo({ url: '/pages/chat/agent' })
    },
    async loadData() {
      this.loading = true;
      this.isDataFromCache = false;
      
      try {
        // 1. 优先从缓存加载数据
        await this.loadFromCache()

        // 获取最新的联系人资料，避免管理员默认头像或新好友被旧缓存遮盖。
        await this.refreshContactProfiles()
        
        // 2. 后台异步更新数据
        this.updateDataInBackground()
        
      } catch (error) {
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        })
      } finally {
        this.loading = false;
      }
    },

    async refreshContactProfiles() {
      if (!this.currentUser.uid) return
      try {
        const [contactsRes, selfRes] = await Promise.all([
          Database.getContacts(), Database.getUserById(this.currentUser.uid)
        ])
        if (selfRes.success) {
          const user = selfRes.user
          this.currentUser = { ...this.currentUser, name: user.name, type: user.type, avatar: this.getAvatarUrl(user.avatar, 'private') }
          ChatCache.saveUserInfoCache(this.currentUser)
        }
        if (!contactsRes.success) return
        const friends = new Map((contactsRes.contacts || []).map(contact => [contact.uid, contact]))
        friends.set(this.currentUser.uid, { uid: this.currentUser.uid, name: '自己', remark: '', avatar: this.currentUser.avatar, is_admin: this.currentUser.type === 0 })
        const groups = new Map((ChatCache.getGroupsCache() || []).map(group => [String(group.gid), group]))
        const refreshed = this.latestMessages.map(message => {
          const friend = message.chat_type === 'private' ? friends.get(message.contact_id) : null
          return friend ? { ...message, contact_avatar: this.getAvatarUrl(friend.avatar, 'private'), contact_is_admin: !!friend.is_admin } : message
        })
        this.ensureAllContactsInList(refreshed, friends, groups)
        this.latestMessages = refreshed
        ChatCache.saveFriendsCache(Array.from(friends.values()))
        ChatCache.saveLatestMessagesCache(refreshed)
      } catch (_) { /* Keep cached contacts usable while offline. */ }
    },

    /**
     * 从缓存加载数据
     */
    async loadFromCache() {
      try {
        // 确保currentUser对象存在
        if (!this.currentUser) {
          this.currentUser = {}
        }
        
        // 尝试从缓存加载用户信息
        const cachedUserInfo = ChatCache.getUserInfoCache()
        if (cachedUserInfo) {
          // 确保头像URL正确处理
          if (cachedUserInfo.avatar) {
            cachedUserInfo.avatar = this.getAvatarUrl(cachedUserInfo.avatar, 'private')
          }
          this.currentUser = { ...this.currentUser, ...cachedUserInfo }
          this.isDataFromCache = true
        }

        // 尝试从缓存加载最新消息
        const cachedMessages = ChatCache.getLatestMessagesCache()
        if (cachedMessages && cachedMessages.length > 0) {
          // 获取好友和群组信息
          const cachedFriends = ChatCache.getFriendsCache() || []
          const cachedGroups = ChatCache.getGroupsCache() || []
          
          const friendMap = new Map()
          const groupMap = new Map()
          
          cachedFriends.forEach(friend => {
            friendMap.set(friend.uid, friend)
          })
          
          cachedGroups.forEach(group => {
            groupMap.set(group.gid.toString(), group)
          })
          
          // 确保所有好友和群组都显示在聊天列表中
          this.ensureAllContactsInList(cachedMessages, friendMap, groupMap)
          // 已读状态可能刚在聊天页改变，不能直接沿用缓存里的红点。
          await this.calculateUnreadCounts(cachedMessages)
          this.latestMessages = [...cachedMessages]
          ChatCache.saveLatestMessagesCache(cachedMessages)
          this.isDataFromCache = true
        }

        // 如果缓存中没有数据，则从服务器加载
        if (!cachedMessages || !cachedMessages.length) {
          await this.loadFromServer()
        }
      } catch (error) {
        // 缓存加载失败，从服务器加载
        await this.loadFromServer()
      }
    },

    /**
     * 从服务器加载数据
     */
    async loadFromServer(retryCount = 0) {
      const maxRetries = 3
      
      try {
        // 获取当前用户信息
        const userRes = await Database.verifyToken()
        if (userRes.success) {
          // 确保currentUser对象存在
          if (!this.currentUser) {
            this.currentUser = {}
          }
          
          this.currentUser.uid = userRes.user.uid
          this.currentUser.type = userRes.user.type
          
          // 获取用户详细信息
          const userDetailRes = await Database.getUserById(userRes.user.uid)
          if (userDetailRes.success) {
            this.currentUser.name = userDetailRes.user.name
            this.currentUser.avatar = this.getAvatarUrl(userDetailRes.user.avatar, 'private')
          }
          
          // 保存用户信息到缓存
          ChatCache.saveUserInfoCache(this.currentUser)
        } else {
          // token验证失败，跳转到登录页面
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          })
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }, 1500)
          return
        }

        // 获取好友列表（包含备注）
        const contactsRes = await Database.getContacts()
        const friendUids = []
        const friendMap = new Map() // 用于存储好友信息，包括备注
        if (contactsRes.success) {
          contactsRes.contacts.forEach(contact => {
            friendUids.push(contact.uid)
            friendMap.set(contact.uid, contact)
          })
        }
        friendUids.push(userRes.user.uid)
        
        const selfAvatar = this.currentUser.avatar || '/static/avatar.png'
        
        friendMap.set(userRes.user.uid, { 
          uid: userRes.user.uid, 
          name: '自己', 
          remark: '', 
          avatar: selfAvatar
        })

        // 获取用户已加入的群组列表
        const groupsRes = await Database.getUserGroups()
        const groupUids = []
        const groupMap = new Map() // 用于存储群组信息
        if (groupsRes.success) {
          groupsRes.groups.forEach(group => {
            groupUids.push(group.gid.toString())
            groupMap.set(group.gid.toString(), group)
          })
        }

        // 保存好友信息到缓存
        const friendsArray = Array.from(friendMap.values())
        ChatCache.saveFriendsCache(friendsArray)
        
        // 保存群组信息到缓存
        const groupsArray = Array.from(groupMap.values())
        ChatCache.saveGroupsCache(groupsArray)

        // 加载最新消息列表
        const messagesRes = await Database.getLatestMessages()
        if (messagesRes.success) {
          // 根据用户类型决定过滤策略
          const filteredMessages = []
          const isAdmin = this.currentUser.type === 0 // 管理员类型为0
          
          for (const message of messagesRes.messages) {
            // 确保头像信息正确设置
            if (message.contact_avatar) {
              message.contact_avatar = this.getAvatarUrl(message.contact_avatar, message.chat_type)
            }
            if (message.sender_avatar) {
              message.sender_avatar = this.getAvatarUrl(message.sender_avatar, 'private')
            }
            
            if (message.chat_type === 'private') {
              // 私聊消息
              if (isAdmin) {
                // 管理员可以看到所有私聊消息
                // 尝试获取好友信息，如果没有则使用默认信息
                const friendInfo = friendMap.get(message.contact_id)
                if (friendInfo) {
                  message.friend_info = friendInfo
                  message.display_name = friendInfo.remark || friendInfo.name || message.contact_name
                  // 如果后端没有返回头像，使用好友信息中的头像
                  if (!message.contact_avatar || message.contact_avatar === '/static/avatar.png') {
                    message.contact_avatar = this.getAvatarUrl(friendInfo.avatar, 'private')
                  }
                } else {
                  // 如果不是好友，使用默认显示名称
                  message.display_name = message.contact_name || message.contact_id
                }
                filteredMessages.push(message)
              } else {
                // 普通用户只显示好友和管理员的消息
                if (message.contact_id) {
                  // 添加好友信息到消息中
                  const friendInfo = friendMap.get(message.contact_id)
                  if (friendInfo) {
                    message.friend_info = friendInfo
                    // 使用备注名称作为显示名称
                    message.display_name = friendInfo.remark || friendInfo.name || message.contact_name
                    // 如果后端没有返回头像，使用好友信息中的头像
                    if (!message.contact_avatar || message.contact_avatar === '/static/avatar.png') {
                      message.contact_avatar = this.getAvatarUrl(friendInfo.avatar, 'private')
                    }
                  }
                  filteredMessages.push(message)
                }
              }
            } else if (message.chat_type === 'group') {
              // 群聊消息
              if (isAdmin) {
                // 管理员可以看到所有群聊消息
                filteredMessages.push(message)
              } else {
                // 普通用户只显示已加入的群聊消息
                const isMember = await this.isGroupMember(message.contact_id)
                if (isMember) {
                  filteredMessages.push(message)
                }
              }
            }
          }
          
          // 确保所有好友和群组都显示在聊天列表中
          this.ensureAllContactsInList(filteredMessages, friendMap, groupMap)
          
          // 计算未读消息数量
          await this.calculateUnreadCounts(filteredMessages)
          
          this.latestMessages = filteredMessages
          
          
          // 保存消息到缓存
          ChatCache.saveLatestMessagesCache(filteredMessages)
          
        } else {
          // 消息加载失败，尝试重试
          if (retryCount < maxRetries) {
            console.log(`消息加载失败，正在重试 (${retryCount + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // 递增延迟
            return this.loadFromServer(retryCount + 1)
          } else {
            uni.showToast({
              title: messagesRes.message || '加载消息失败',
              icon: 'none'
            })
          }
        }
      } catch (error) {
        // 网络错误，尝试重试
        if (retryCount < maxRetries) {
          console.log(`网络错误，正在重试 (${retryCount + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // 递增延迟
          return this.loadFromServer(retryCount + 1)
        } else {
          throw error
        }
      }
    },

    /**
     * 后台更新数据
     */
    async updateDataInBackground() {
      if (this.backgroundUpdateInProgress) {
        return // 避免重复更新
      }
      
      this.backgroundUpdateInProgress = true
      
      try {
        
        // 检查哪些缓存需要更新
        const shouldUpdateUser = ChatCache.shouldUpdateCache('user')
        const shouldUpdateFriends = ChatCache.shouldUpdateCache('friends')
        const shouldUpdateMessages = ChatCache.shouldUpdateCache('messages')
        
        if (!shouldUpdateUser && !shouldUpdateFriends && !shouldUpdateMessages) {
          return
        }
        
        // 获取最新数据
        const userRes = await Database.verifyToken()
        if (!userRes.success) {
          return
        }

        // 更新用户信息（如果需要）
        if (shouldUpdateUser) {
          const userDetailRes = await Database.getUserById(userRes.user.uid)
          if (userDetailRes.success) {
            const updatedUserInfo = {
              uid: userRes.user.uid,
              type: userRes.user.type,
              name: userDetailRes.user.name,
              avatar: this.getAvatarUrl(userDetailRes.user.avatar, 'private')
            }
            
            // 更新本地用户信息
            this.currentUser = { ...this.currentUser, ...updatedUserInfo }
            
            // 更新缓存
            ChatCache.saveUserInfoCache(updatedUserInfo)
          }
        }

        // 更新好友信息（如果需要）
        if (shouldUpdateFriends) {
          const contactsRes = await Database.getContacts()
          const friendUids = []
          const friendMap = new Map()
          
          if (contactsRes.success) {
            contactsRes.contacts.forEach(contact => {
              friendUids.push(contact.uid)
              friendMap.set(contact.uid, contact)
            })
          }
          
          // 添加用户自己
          friendUids.push(userRes.user.uid)
          
          const selfAvatar = this.currentUser.avatar || '/static/avatar.png'
          
          friendMap.set(userRes.user.uid, { 
            uid: userRes.user.uid, 
            name: '自己', 
            remark: '', 
            avatar: selfAvatar
          })
          
          // 更新缓存
          const friendsArray = Array.from(friendMap.values())
          ChatCache.saveFriendsCache(friendsArray)
        }

        // 更新群组信息（如果需要）
        if (shouldUpdateFriends) { // 使用相同的更新条件
          const groupsRes = await Database.getUserGroups()
          const groupUids = []
          const groupMap = new Map()
          
          if (groupsRes.success) {
            groupsRes.groups.forEach(group => {
              groupUids.push(group.gid.toString())
              groupMap.set(group.gid.toString(), group)
            })
          }
          
          // 更新缓存
          const groupsArray = Array.from(groupMap.values())
          ChatCache.saveGroupsCache(groupsArray)
        }

        // 更新最新消息（如果需要）
        if (shouldUpdateMessages) {
          const messagesRes = await Database.getLatestMessages()
          if (messagesRes.success) {
            // 重新处理消息数据（与loadFromServer中的逻辑相同）
            const filteredMessages = []
            const isAdmin = this.currentUser.type === 0
            
            // 获取好友信息用于消息处理
            const cachedFriends = ChatCache.getFriendsCache() || []
            const friendMap = new Map()
            const friendUids = []
            
            cachedFriends.forEach(friend => {
              friendUids.push(friend.uid)
              friendMap.set(friend.uid, friend)
            })
            
            for (const message of messagesRes.messages) {
              // 确保头像信息正确设置
              if (message.contact_avatar) {
                message.contact_avatar = this.getAvatarUrl(message.contact_avatar, message.chat_type)
              }
              if (message.sender_avatar) {
                message.sender_avatar = this.getAvatarUrl(message.sender_avatar, 'private')
              }
              
              if (message.chat_type === 'private') {
                if (isAdmin) {
                  const friendInfo = friendMap.get(message.contact_id)
                  if (friendInfo) {
                    message.friend_info = friendInfo
                    message.display_name = friendInfo.remark || friendInfo.name || message.contact_name
                    // 如果后端没有返回头像，使用好友信息中的头像
                    if (!message.contact_avatar || message.contact_avatar === '/static/avatar.png') {
                      message.contact_avatar = this.getAvatarUrl(friendInfo.avatar, 'private')
                    }
                  } else {
                    message.display_name = message.contact_name || message.contact_id
                  }
                  filteredMessages.push(message)
                } else {
                  if (message.contact_id) {
                    const friendInfo = friendMap.get(message.contact_id)
                    if (friendInfo) {
                      message.friend_info = friendInfo
                      message.display_name = friendInfo.remark || friendInfo.name || message.contact_name
                      // 如果后端没有返回头像，使用好友信息中的头像
                      if (!message.contact_avatar || message.contact_avatar === '/static/avatar.png') {
                        message.contact_avatar = this.getAvatarUrl(friendInfo.avatar, 'private')
                      }
                    }
                    filteredMessages.push(message)
                  }
                }
              } else if (message.chat_type === 'group') {
                if (isAdmin) {
                  filteredMessages.push(message)
                } else {
                  const isMember = await this.isGroupMember(message.contact_id)
                  if (isMember) {
                    filteredMessages.push(message)
                  }
                }
              }
            }
            
            // 获取群组信息用于消息处理
            const cachedGroups = ChatCache.getGroupsCache() || []
            const groupMap = new Map()
            
            cachedGroups.forEach(group => {
              groupMap.set(group.gid.toString(), group)
            })
            
            // 使用增量更新方式合并消息
            ChatCache.mergeMessagesToCache(filteredMessages)
            
            // 获取合并后的消息列表
            const mergedMessages = ChatCache.getLatestMessagesCache() || []
            
            // 确保所有好友和群组都显示在聊天列表中
            this.ensureAllContactsInList(mergedMessages, friendMap, groupMap)
            
            // 计算未读消息数量
            await this.calculateUnreadCounts(mergedMessages)
            
            // 更新本地消息列表
            this.latestMessages = mergedMessages
            
            
          }
        }
        
        
      } catch (error) {
      } finally {
        this.backgroundUpdateInProgress = false
      }
    },
    
    async isGroupMember(gid) {
      try {
        const membersRes = await Database.getGroupMembers(gid)
        if (membersRes.success) {
          return membersRes.members.some(member => member.uid === this.currentUser.uid)
        }
        return false
      } catch (error) {
        return false
      }
    },

    /**
     * 确保所有好友和群组都显示在聊天列表中
     */
    ensureAllContactsInList(filteredMessages, friendMap, groupMap) {
      try {
        const existingContacts = new Set()
        const existingGroups = new Set()
        
        // 收集已存在的联系人和群组（包括占位消息）
        filteredMessages.forEach(msg => {
          if (msg.chat_type === 'private') {
            existingContacts.add(msg.contact_id)
          } else if (msg.chat_type === 'group') {
            existingGroups.add(msg.contact_id)
          }
        })
        
        // 为没有消息的好友添加占位消息
        friendMap.forEach((friendInfo, uid) => {
          if (!existingContacts.has(uid)) {
            // 调试信息：检查头像URL
            const processedAvatar = this.getAvatarUrl(friendInfo.avatar, 'private')
            
            const placeholder = {
              id: `friend_placeholder_${uid}`,
              chat_type: 'private',
              contact_id: uid,
              contact_name: friendInfo.name,
              contact_avatar: processedAvatar,
              contact_is_admin: Boolean(friendInfo.is_admin) || (uid === this.currentUser.uid && this.currentUser.type === 0),
              display_name: friendInfo.remark || friendInfo.name,
              sender_uid: uid,
              sender_name: friendInfo.name,
              content: friendInfo.is_admin ? '点击与管理员对话' :
                       uid === this.currentUser.uid ? '点击向自己发送信息' : 
                       '点击开始与好友的对话',
              msg_type: 0,
              sent_time: new Date().toISOString(),
              is_placeholder: true,
              unreadCount: 0
            }
            filteredMessages.push(placeholder)
          }
        })
        
        // 为没有消息的群组添加占位消息
        groupMap.forEach((groupInfo, gid) => {
          if (!existingGroups.has(gid)) {
            const placeholder = {
              id: `group_placeholder_${gid}`,
              chat_type: 'group',
              contact_id: gid,
              contact_name: groupInfo.name,
              contact_avatar: this.getAvatarUrl(groupInfo.avatar, 'group'),
              display_name: groupInfo.name,
              sender_uid: '',
              sender_name: '',
              content: '点击开始群组对话',
              msg_type: 0,
              sent_time: new Date().toISOString(),
              is_placeholder: true,
              unreadCount: 0
            }
            filteredMessages.push(placeholder)
          }
        })
        
        // 按时间排序，确保占位消息在最后
        filteredMessages.sort((a, b) => {
          // 占位消息排在最后
          if (a.is_placeholder && !b.is_placeholder) return 1
          if (!a.is_placeholder && b.is_placeholder) return -1
          // 其他消息按时间排序
          return new Date(b.sent_time) - new Date(a.sent_time)
        })
        
        // 保存更新后的消息列表到缓存
        ChatCache.saveLatestMessagesCache(filteredMessages)
        
      } catch (error) {
      }
    },

    onSearch() {
      // 搜索功能在computed中实现
    },
    
    /**
     * 手动刷新数据
     */
    async refreshData() {
      this.loading = true
      try {
        // 清除缓存
        ChatCache.clearAllCache()
        
        // 从服务器重新加载数据
        await this.loadFromServer()
        
        uni.showToast({
          title: '数据已刷新',
          icon: 'success'
        })
      } catch (error) {
        uni.showToast({
          title: '刷新失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    /**
     * 切换缓存统计显示
     */
    toggleCacheStats() {
      this.showCacheStats = !this.showCacheStats
      if (this.showCacheStats) {
        this.updateCacheStats()
      }
    },

    /**
     * 更新缓存统计信息
     */
    updateCacheStats() {
      const stats = ChatCache.getCacheStats()
      const statsArray = []
      
      Object.entries(stats).forEach(([key, value]) => {
        if (value.count > 0) {
          const status = value.isValid ? '✅' : '❌'
          statsArray.push(`${key}: ${value.count} ${status}`)
        }
      })
      
      this.cacheStatsText = statsArray.join(' | ')
    },
    showAddDialog() {
      this.showDialog = true
    },
    hideDialog() {
      this.showDialog = false
    },
    showAddFriend() {
      this.showDialog = false
      this.showAddFriendDialog = true
    },
    hideAddFriendDialog() {
      this.showAddFriendDialog = false
      this.friendSearchKeyword = ''
      this.friendSearchResults = []
    },
    showJoinGroup() {
      this.showDialog = false
      this.showJoinGroupDialog = true
    },
    hideJoinGroupDialog() {
      this.showJoinGroupDialog = false
      this.groupSearchKeyword = ''
      this.groupSearchResults = []
    },
    showCreateGroup() {
      this.showDialog = false
      this.showCreateGroupDialog = true
    },
    hideCreateGroupDialog() {
      this.showCreateGroupDialog = false
      this.newGroupName = ''
    },
    async searchFriends() {
      if (!this.friendSearchKeyword.trim()) {
        this.friendSearchResults = []
        return
      }
      try {
        const res = await Database.searchUsers(this.friendSearchKeyword)
        if (res.success) {
          this.friendSearchResults = res.users
        }
      } catch (error) {
      }
    },
    async searchGroups() {
      if (!this.groupSearchKeyword.trim()) {
        this.groupSearchResults = []
        return
      }
      try {
        const res = await Database.searchGroups(this.groupSearchKeyword)
        if (res.success) {
          this.groupSearchResults = res.groups
        }
      } catch (error) {
      }
    },
    goToPersonalSpace(uid) {
      uni.navigateTo({
        url: `/pages/personalSpace/index?uid=${uid}`
      })
    },
    async joinGroup(group) {
      try {
        const res = await Database.joinGroup(group.gid)
        if (res.success) {
          uni.showToast({
            title: '加入群组成功',
            icon: 'success'
          })
          this.hideJoinGroupDialog()
          this.loadData() // 重新加载数据
        } else {
          uni.showToast({
            title: res.message || '加入群组失败',
            icon: 'none'
          })
        }
      } catch (error) {
        uni.showToast({
          title: '加入群组失败',
          icon: 'none'
        })
      }
    },
    async createGroup() {
      if (!this.newGroupName.trim()) {
        uni.showToast({
          title: '请输入群组名称',
          icon: 'none'
        })
        return
      }
      try {
        const res = await Database.createGroup(this.newGroupName.trim())
        if (res.success) {
          uni.showToast({
            title: '创建群组成功',
            icon: 'success'
          })
          this.hideCreateGroupDialog()
          this.loadData() // 重新加载数据
        } else {
          uni.showToast({
            title: res.message || '创建群组失败',
            icon: 'none'
          })
        }
      } catch (error) {
        uni.showToast({
          title: '创建群组失败',
          icon: 'none'
        })
      }
    },
    openChat(message) {
      if (message.chat_type === 'agent') { this.openAgent(); return }
      if (message.chat_type === 'group') {
        // 使用安全的群聊导航
        ChatNavigation.navigateToGroupChat(
          message.contact_id,
          message.contact_name,
          message.contact_avatar
        )
      } else {
        // 使用安全的私聊导航
        ChatNavigation.navigateToPrivateChat(
          message.contact_id,
          message.contact_name,
          message.contact_avatar
        )
      }
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
    formatContactName(message) {
      if (message.chat_type === 'private' && message.contact_id === this.currentUser.uid && this.currentUser.type === 0) return '管理员（自己）'
      const name = message.display_name || message.contact_name || ''
      return message.contact_is_admin && name !== '管理员' ? `${name}（管理员）` : name
    },
    formatMessagePreview(message) {
      const senderName = message.is_auto_alert ? '系统自动预警' : (message.sender_uid === this.currentUser?.uid ? '我' : (message.sender_name || message.sender_uid))
      
      let content = ''
      content = message.content.length > 20 ? message.content.substring(0, 20) + '...' : message.content
      
      return `${senderName}: ${content}`
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
    getAvatarUrl(avatar, chatType) {
      if (!avatar) {
        // 根据聊天类型返回不同的默认头像
        return chatType === 'group' ? '/static/avatarg.png' : '/static/avatar.png'
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
      
      // 默认情况，根据聊天类型返回不同的默认头像
      return chatType === 'group' ? '/static/avatarg.png' : '/static/avatar.png'
    },

    /**
     * 设置后台服务监听器
     */
    setupBackgroundListeners() {
      // 监听新消息事件
      uni.$on('newMessagesReceived', this.handleNewMessages)
      
      // 监听刷新消息列表事件
      uni.$on('refreshMessageList', this.handleRefreshMessageList)
    },

    /**
     * 移除后台服务监听器
     */
    removeBackgroundListeners() {
      uni.$off('newMessagesReceived', this.handleNewMessages)
      uni.$off('refreshMessageList', this.handleRefreshMessageList)
    },

    /**
     * 处理新消息事件
     */
    handleNewMessages(data) {
      this.loadData()
    },

    /**
     * 处理刷新消息列表事件
     */
    handleRefreshMessageList() {
      // 重新加载数据
      this.loadData()
    },


    /**
     * 设置页面可见性监听器
     */
    setupVisibilityListener() {
      // 监听页面可见性变化
      // #ifdef H5
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
      // #endif
    },

    /**
     * 移除页面可见性监听器
     */
    removeVisibilityListener() {
      // #ifdef H5
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
      // #endif
    },

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
      if (!document.hidden) {
        // 页面变为可见时，立即检查新消息
        this.checkNewMessagesOnShow()
      }
    },

    /**
     * 页面显示时检查新消息
     */
    async checkNewMessagesOnShow() {
      try {
        // 立即检查新消息
        await backgroundService.manualCheck()
      } catch (error) {
        console.error('检查新消息失败:', error)
      }
    },

    /**
     * 计算所有消息的未读数量
     */
    async calculateUnreadCounts(messages) {
      try {
        
        // 并行计算所有消息的未读数量
        const promises = messages.map(async (message) => {
          const unreadCount = await this.getUnreadCount(message)
          message.unreadCount = unreadCount
          return message
        })
        
        await Promise.all(promises)
        
        // 统计有未读消息的数量
        const unreadMessages = messages.filter(msg => msg.unreadCount > 0)
      } catch (error) {
        // 如果计算失败，为所有消息设置默认值
        messages.forEach(message => {
          message.unreadCount = 0
        })
      }
    },

    /**
     * 获取未读消息数量
     */
    async getUnreadCount(message) {
      try {
        if (!this.currentUser.uid || !message) {
          return 0
        }

        // 占位消息不显示未读数量
        if (message.is_placeholder) {
          return 0
        }


        // 直接调用后端API获取真实的未读消息数量
        try {
          const contactType = message.chat_type === 'private' ? 'user' : 'group'
          // 确保群组ID是整数类型
          const contactId = contactType === 'group' ? parseInt(message.contact_id) : message.contact_id
          
          const res = await Database.getUnreadCount(contactType, contactId)
          
          if (res.success) {
            const unreadCount = res.count || 0
            return unreadCount
          } else {
            return 0
          }
        } catch (error) {
          return 0
        }
      } catch (error) {
        // 发生错误时返回0表示无未读消息
        return 0
      }
    }
  }
}
</script>

<style scoped>
.agent-entry { display:flex; align-items:center; gap:20rpx; padding:24rpx 28rpx; margin-bottom:20rpx; border-radius:20rpx; background:#e8f8f0; color:#255e48; }
.agent-title { font-weight:600; font-size:30rpx; }
.agent-subtitle { flex:1; font-size:24rpx; color:#57836e; }
.consultation-container {
  min-height: 100vh;
  background: #f8f9fa;
  background-image: url('/static/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 40rpx;
  box-sizing: border-box;
}

.header {
  margin-bottom: 60rpx;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20rpx;
}

.title-section {
  flex: 1;
  text-align: center;
  min-width: 200rpx;
}

.page-title {
  display: block;
  font-size: 48rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #7f8c8d;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 16rpx;
  background: #55B99E;
  border-radius: 40rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(85, 185, 158, 0.3);
  cursor: pointer;
}

.refresh-button:active {
  transform: scale(0.95);
  box-shadow: 0 1rpx 4rpx rgba(85, 185, 158, 0.4);
}

.refresh-button.refreshing .refresh-icon {
  animation: spin 1s linear infinite;
}

.refresh-icon {
  font-size: 24rpx;
  line-height: 1;
  color: white;
  transform: rotate(90deg);
}

.refresh-text-btn {
  font-size: 24rpx;
  color: white;
  font-weight: 500;
  line-height: 1;
}

.content {
  max-width: 800rpx;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 60rpx;
}

.cache-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding: 12rpx 20rpx;
  background: #e8f5e8;
  border-radius: 8rpx;
  border: 1rpx solid #4caf50;
}

.cache-text {
  font-size: 24rpx;
  color: #4caf50;
  font-weight: 500;
}

.refresh-text {
  font-size: 24rpx;
  color: #2196f3;
  font-weight: 500;
  padding: 8rpx 16rpx;
  background: #e3f2fd;
  border-radius: 16rpx;
  transition: background-color 0.2s ease;
}

.refresh-text:active {
  background: #bbdefb;
}

.cache-stats {
  margin-top: 8rpx;
  padding: 8rpx 16rpx;
  background: #f5f5f5;
  border-radius: 6rpx;
  border: 1rpx solid #ddd;
}

.stats-text {
  font-size: 20rpx;
  color: #666;
  line-height: 1.4;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  background: white;
  border: 1rpx solid #e0e0e0;
  border-radius: 40rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  color: #2c3e50;
  box-sizing: border-box;
}

.add-button {
  width: 80rpx;
  height: 80rpx;
  background: #55B99E;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.3);
}

.add-button:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(52, 152, 219, 0.4);
}

.add-icon {
  font-size: 35rpx;
  color: white;
  font-weight: bold;
  line-height: 1;
}

.section {
  margin-bottom: 40rpx;
}

.section-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
  padding: 0 20rpx;
}

.section-title {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
}

.section-count {
  font-size: 24rpx;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.list-container {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.list-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:active {
  background-color: #f8f9fa;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background: #ecf0f1;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item-name {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
}

.item-preview {
  font-size: 24rpx;
  color: #7f8c8d;
  margin-top: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400rpx;
}

.message-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 16rpx;
}

.time-text {
  font-size: 20rpx;
  color: #999;
}

.unread-badge {
  margin-top: 8rpx;
  background: #ff4757;
  border-radius: 50%;
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: relative;
  z-index: 1;
}

.unread-count {
  font-size: 18rpx;
  color: white;
  font-weight: bold;
  line-height: 1;
  text-align: center;
}

.red-dot {
  width: 16rpx;
  height: 16rpx;
  padding: 0;
  background: #ff4757;
  border-radius: 50%;
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
  width: 90%;
  max-width: 600rpx;
  max-height: 80vh;
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
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  transition: background-color 0.2s ease;
}

.option-item:active {
  background-color: #e9ecef;
}

.option-icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.option-text {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
}

.search-results {
  margin-top: 20rpx;
  max-height: 400rpx;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:active {
  background-color: #f8f9fa;
}

.result-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-left: 20rpx;
}

.result-name {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
}

.result-id {
  font-size: 24rpx;
  color: #7f8c8d;
}

.add-btn {
  font-size: 24rpx;
  color: #55B99E;
  padding: 12rpx 24rpx;
  background: #e3f2fd;
  border-radius: 20rpx;
  font-weight: 500;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #f8f9fa;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #2c3e50;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 20rpx;
  justify-content: flex-end;
}

.btn-cancel, .btn-confirm {
  padding: 20rpx 40rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #f8f9fa;
  color: #7f8c8d;
}

.btn-cancel:active {
  background: #e9ecef;
}

.btn-confirm {
  background: #55B99E;
  color: white;
}

.btn-confirm:active {
  background: #2980b9;
}

/* 加载提示样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
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
</style>
