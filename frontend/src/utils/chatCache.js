// 聊天缓存工具类 - 管理群组和好友信息的本地持久化缓存
class ChatCache {
  constructor() {
    this.CACHE_KEYS = {
      FRIENDS: 'chat_friends_cache',
      GROUPS: 'chat_groups_cache', 
      LATEST_MESSAGES: 'chat_latest_messages_cache',
      CACHE_TIMESTAMP: 'chat_cache_timestamp',
      USER_INFO: 'chat_user_info_cache',
      // 新增聊天消息缓存键
      PRIVATE_MESSAGES: 'chat_private_messages_cache',
      GROUP_MESSAGES: 'chat_group_messages_cache',
      // 已读消息缓存键
      PRIVATE_READ_STATUS: 'chat_private_read_status_cache',
      GROUP_READ_STATUS: 'chat_group_read_status_cache'
    }
    
    // 缓存有效期（毫秒）- 5分钟
    this.CACHE_EXPIRE_TIME = 5 * 60 * 1000
    // 聊天消息缓存有效期 - 30分钟
    this.MESSAGE_CACHE_EXPIRE_TIME = 30 * 60 * 1000
  }

  // ========== 好友缓存管理 ==========
  
  /**
   * 保存好友信息到缓存
   * @param {Array} friends - 好友列表
   */
  saveFriendsCache(friends) {
    try {
      const cacheData = {
        data: friends,
        timestamp: Date.now()
      }
      uni.setStorageSync(this.CACHE_KEYS.FRIENDS, cacheData)
    } catch (error) {
      console.error('保存好友缓存失败:', error)
    }
  }

  /**
   * 从缓存获取好友信息
   * @returns {Array|null} 好友列表或null
   */
  getFriendsCache() {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.FRIENDS)
      if (!cacheData || !cacheData.data) {
        return null
      }
      
      // 检查缓存是否过期
      if (Date.now() - cacheData.timestamp > this.CACHE_EXPIRE_TIME) {
        return null
      }
      
      return cacheData.data
    } catch (error) {
      console.error('获取好友缓存失败:', error)
      return null
    }
  }

  /**
   * 更新单个好友信息
   * @param {Object} friendInfo - 好友信息
   */
  updateFriendCache(friendInfo) {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.FRIENDS)
      if (cacheData && cacheData.data) {
        const friends = cacheData.data
        const index = friends.findIndex(f => f.uid === friendInfo.uid)
        
        if (index >= 0) {
          // 更新现有好友
          friends[index] = { ...friends[index], ...friendInfo }
        } else {
          // 添加新好友
          friends.push(friendInfo)
        }
        
        this.saveFriendsCache(friends)
      }
    } catch (error) {
      console.error('更新好友缓存失败:', error)
    }
  }

  // ========== 群组缓存管理 ==========
  
  /**
   * 保存群组信息到缓存
   * @param {Array} groups - 群组列表
   */
  saveGroupsCache(groups) {
    try {
      const cacheData = {
        data: groups,
        timestamp: Date.now()
      }
      uni.setStorageSync(this.CACHE_KEYS.GROUPS, cacheData)
    } catch (error) {
      console.error('保存群组缓存失败:', error)
    }
  }

  /**
   * 从缓存获取群组信息
   * @returns {Array|null} 群组列表或null
   */
  getGroupsCache() {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.GROUPS)
      if (!cacheData || !cacheData.data) {
        return null
      }
      
      // 检查缓存是否过期
      if (Date.now() - cacheData.timestamp > this.CACHE_EXPIRE_TIME) {
        return null
      }
      
      return cacheData.data
    } catch (error) {
      console.error('获取群组缓存失败:', error)
      return null
    }
  }

  /**
   * 更新单个群组信息
   * @param {Object} groupInfo - 群组信息
   */
  updateGroupCache(groupInfo) {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.GROUPS)
      if (cacheData && cacheData.data) {
        const groups = cacheData.data
        const index = groups.findIndex(g => g.gid === groupInfo.gid)
        
        if (index >= 0) {
          // 更新现有群组
          groups[index] = { ...groups[index], ...groupInfo }
        } else {
          // 添加新群组
          groups.push(groupInfo)
        }
        
        this.saveGroupsCache(groups)
      }
    } catch (error) {
      console.error('更新群组缓存失败:', error)
    }
  }

  // ========== 最新消息缓存管理 ==========
  
  /**
   * 保存最新消息到缓存
   * @param {Array} messages - 最新消息列表
   */
  saveLatestMessagesCache(messages) {
    try {
      const cacheData = {
        data: messages,
        timestamp: Date.now()
      }
      uni.setStorageSync(this.CACHE_KEYS.LATEST_MESSAGES, cacheData)
    } catch (error) {
      console.error('保存最新消息缓存失败:', error)
    }
  }

  /**
   * 从缓存获取最新消息
   * @returns {Array|null} 最新消息列表或null
   */
  getLatestMessagesCache() {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.LATEST_MESSAGES)
      if (!cacheData || !cacheData.data) {
        return null
      }
      
      // 检查缓存是否过期
      if (Date.now() - cacheData.timestamp > this.CACHE_EXPIRE_TIME) {
        return null
      }
      
      return cacheData.data
    } catch (error) {
      console.error('获取最新消息缓存失败:', error)
      return null
    }
  }

  /**
   * 更新单条消息缓存
   * @param {Object} message - 消息信息
   */
  updateMessageCache(message) {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.LATEST_MESSAGES)
      if (cacheData && cacheData.data) {
        const messages = cacheData.data
        const messageKey = `${message.chat_type}_${message.contact_id}`
        const index = messages.findIndex(m => 
          `${m.chat_type}_${m.contact_id}` === messageKey
        )
        
        if (index >= 0) {
          // 更新现有消息
          messages[index] = { ...messages[index], ...message }
        } else {
          // 添加新消息
          messages.push(message)
        }
        
        // 按时间排序
        messages.sort((a, b) => new Date(b.sent_time) - new Date(a.sent_time))
        
        this.saveLatestMessagesCache(messages)
      }
    } catch (error) {
      console.error('更新消息缓存失败:', error)
    }
  }

  // ========== 用户信息缓存管理 ==========
  
  /**
   * 保存用户信息到缓存
   * @param {Object} userInfo - 用户信息
   */
  saveUserInfoCache(userInfo) {
    try {
      const cacheData = {
        data: userInfo,
        timestamp: Date.now()
      }
      uni.setStorageSync(this.CACHE_KEYS.USER_INFO, cacheData)
    } catch (error) {
      console.error('保存用户信息缓存失败:', error)
    }
  }

  /**
   * 从缓存获取用户信息
   * @returns {Object|null} 用户信息或null
   */
  getUserInfoCache() {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.USER_INFO)
      if (!cacheData || !cacheData.data) {
        return null
      }
      
      // 检查缓存是否过期
      if (Date.now() - cacheData.timestamp > this.CACHE_EXPIRE_TIME) {
        console.log('用户信息缓存已过期')
        return null
      }
      
      return cacheData.data
    } catch (error) {
      console.error('获取用户信息缓存失败:', error)
      return null
    }
  }

  // ========== 缓存管理工具方法 ==========
  
  /**
   * 清除所有聊天缓存
   */
  clearAllCache() {
    try {
      Object.values(this.CACHE_KEYS).forEach(key => {
        uni.removeStorageSync(key)
      })
      console.log('所有聊天缓存已清除')
    } catch (error) {
      console.error('清除缓存失败:', error)
    }
  }

  /**
   * 清除过期缓存
   */
  clearExpiredCache() {
    try {
      const now = Date.now()
      Object.values(this.CACHE_KEYS).forEach(key => {
        const cacheData = uni.getStorageSync(key)
        if (cacheData && cacheData.timestamp) {
          if (now - cacheData.timestamp > this.CACHE_EXPIRE_TIME) {
            uni.removeStorageSync(key)
            console.log(`已清除过期缓存: ${key}`)
          }
        }
      })
    } catch (error) {
      console.error('清除过期缓存失败:', error)
    }
  }

  /**
   * 检查缓存是否存在且有效
   * @param {string} cacheType - 缓存类型 ('friends', 'groups', 'messages', 'user')
   * @returns {boolean} 缓存是否有效
   */
  isCacheValid(cacheType) {
    try {
      const key = this.CACHE_KEYS[cacheType.toUpperCase()]
      if (!key) return false
      
      const cacheData = uni.getStorageSync(key)
      if (!cacheData || !cacheData.timestamp) return false
      
      return Date.now() - cacheData.timestamp <= this.CACHE_EXPIRE_TIME
    } catch (error) {
      console.error('检查缓存有效性失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  getCacheStats() {
    const stats = {}
    
    try {
      Object.entries(this.CACHE_KEYS).forEach(([key, storageKey]) => {
        if (key === 'CACHE_TIMESTAMP') return
        
        const cacheData = uni.getStorageSync(storageKey)
        if (cacheData && cacheData.data) {
          stats[key.toLowerCase()] = {
            count: Array.isArray(cacheData.data) ? cacheData.data.length : 1,
            timestamp: cacheData.timestamp,
            isValid: this.isCacheValid(key.toLowerCase())
          }
        } else {
          stats[key.toLowerCase()] = {
            count: 0,
            timestamp: null,
            isValid: false
          }
        }
      })
    } catch (error) {
      console.error('获取缓存统计失败:', error)
    }
    
    return stats
  }

  /**
   * 合并消息到缓存（用于增量更新）
   * @param {Array} newMessages - 新消息列表
   */
  mergeMessagesToCache(newMessages) {
    try {
      const existingCache = uni.getStorageSync(this.CACHE_KEYS.LATEST_MESSAGES)
      let existingMessages = []
      
      if (existingCache && existingCache.data) {
        existingMessages = existingCache.data
      }
      
      // 创建消息映射，以 chat_type + contact_id 为键
      const messageMap = new Map()
      
      // 先添加现有消息
      existingMessages.forEach(msg => {
        const key = `${msg.chat_type}_${msg.contact_id}`
        messageMap.set(key, msg)
      })
      
      // 再添加新消息（会覆盖同类型的消息）
      newMessages.forEach(msg => {
        const key = `${msg.chat_type}_${msg.contact_id}`
        messageMap.set(key, msg)
      })
      
      // 转换为数组并按时间排序
      const mergedMessages = Array.from(messageMap.values())
        .sort((a, b) => new Date(b.sent_time) - new Date(a.sent_time))
      
      // 保存合并后的消息
      this.saveLatestMessagesCache(mergedMessages)
      
    } catch (error) {
      console.error('合并消息缓存失败:', error)
    }
  }

  /**
   * 更新单个好友的缓存信息
   * @param {string} uid - 好友ID
   * @param {Object} updates - 要更新的字段
   */
  updateFriendInCache(uid, updates) {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.FRIENDS)
      if (cacheData && cacheData.data) {
        const friends = cacheData.data
        const index = friends.findIndex(f => f.uid === uid)
        
        if (index >= 0) {
          friends[index] = { ...friends[index], ...updates }
          this.saveFriendsCache(friends)
          console.log('好友缓存已更新:', uid)
        }
      }
    } catch (error) {
      console.error('更新好友缓存失败:', error)
    }
  }

  /**
   * 更新单个群组的缓存信息
   * @param {string} gid - 群组ID
   * @param {Object} updates - 要更新的字段
   */
  updateGroupInCache(gid, updates) {
    try {
      const cacheData = uni.getStorageSync(this.CACHE_KEYS.GROUPS)
      if (cacheData && cacheData.data) {
        const groups = cacheData.data
        const index = groups.findIndex(g => g.gid === gid)
        
        if (index >= 0) {
          groups[index] = { ...groups[index], ...updates }
          this.saveGroupsCache(groups)
          console.log('群组缓存已更新:', gid)
        }
      }
    } catch (error) {
      console.error('更新群组缓存失败:', error)
    }
  }

  /**
   * 检查缓存是否需要更新
   * @param {string} cacheType - 缓存类型
   * @param {number} maxAge - 最大缓存时间（毫秒）
   * @returns {boolean} 是否需要更新
   */
  shouldUpdateCache(cacheType, maxAge = null) {
    try {
      const key = this.CACHE_KEYS[cacheType.toUpperCase()]
      if (!key) return true
      
      const cacheData = uni.getStorageSync(key)
      if (!cacheData || !cacheData.timestamp) return true
      
      const age = Date.now() - cacheData.timestamp
      const maxAgeToUse = maxAge || this.CACHE_EXPIRE_TIME
      
      return age > maxAgeToUse
    } catch (error) {
      console.error('检查缓存更新需求失败:', error)
      return true
    }
  }

  // ========== 聊天消息缓存管理 ==========
  
  /**
   * 保存私聊消息到缓存
   * @param {string} contactId - 联系人ID
   * @param {Array} messages - 消息列表
   */
  savePrivateMessagesCache(contactId, messages) {
    try {
      const cacheData = {
        data: messages,
        timestamp: Date.now(),
        contactId: contactId
      }
      uni.setStorageSync(`${this.CACHE_KEYS.PRIVATE_MESSAGES}_${contactId}`, cacheData)
    } catch (error) {
      console.error('保存私聊消息缓存失败:', error)
    }
  }

  /**
   * 从缓存获取私聊消息
   * @param {string} contactId - 联系人ID
   * @returns {Array|null} 消息列表或null
   */
  getPrivateMessagesCache(contactId) {
    try {
      const cacheData = uni.getStorageSync(`${this.CACHE_KEYS.PRIVATE_MESSAGES}_${contactId}`)
      if (!cacheData || !cacheData.data) {
        return null
      }
      
      // 检查缓存是否过期
      if (Date.now() - cacheData.timestamp > this.MESSAGE_CACHE_EXPIRE_TIME) {
        return null
      }
      
      console.log(`从缓存加载私聊消息: ${cacheData.data.length}条消息`)
      return cacheData.data
    } catch (error) {
      console.error('获取私聊消息缓存失败:', error)
      return null
    }
  }

  /**
   * 保存群聊消息到缓存
   * @param {string} groupId - 群组ID
   * @param {Array} messages - 消息列表
   */
  saveGroupMessagesCache(groupId, messages) {
    try {
      const cacheData = {
        data: messages,
        timestamp: Date.now(),
        groupId: groupId
      }
      uni.setStorageSync(`${this.CACHE_KEYS.GROUP_MESSAGES}_${groupId}`, cacheData)
      console.log(`群聊消息缓存已保存: ${groupId}, ${messages.length}条消息`)
    } catch (error) {
      console.error('保存群聊消息缓存失败:', error)
    }
  }

  /**
   * 从缓存获取群聊消息
   * @param {string} groupId - 群组ID
   * @returns {Array|null} 消息列表或null
   */
  getGroupMessagesCache(groupId) {
    try {
      const cacheData = uni.getStorageSync(`${this.CACHE_KEYS.GROUP_MESSAGES}_${groupId}`)
      if (!cacheData || !cacheData.data) {
        return null
      }
      
      // 检查缓存是否过期
      if (Date.now() - cacheData.timestamp > this.MESSAGE_CACHE_EXPIRE_TIME) {
        console.log(`群聊消息缓存已过期: ${groupId}`)
        return null
      }
      
      console.log(`从缓存加载群聊消息: ${groupId}, ${cacheData.data.length}条消息`)
      return cacheData.data
    } catch (error) {
      console.error('获取群聊消息缓存失败:', error)
      return null
    }
  }

  /**
   * 添加新消息到私聊缓存
   * @param {string} contactId - 联系人ID
   * @param {Object} message - 新消息
   */
  addPrivateMessageToCache(contactId, message) {
    try {
      const existingMessages = this.getPrivateMessagesCache(contactId) || []
      
      // 检查消息是否已存在（避免重复）
      const exists = existingMessages.some(msg => msg.id === message.id)
      if (!exists) {
        existingMessages.push(message)
        // 按时间排序
        existingMessages.sort((a, b) => new Date(a.sent_time) - new Date(b.sent_time))
        this.savePrivateMessagesCache(contactId, existingMessages)
        console.log(`新私聊消息已添加到缓存: ${contactId}`)
      }
    } catch (error) {
      console.error('添加私聊消息到缓存失败:', error)
    }
  }

  /**
   * 添加新消息到群聊缓存
   * @param {string} groupId - 群组ID
   * @param {Object} message - 新消息
   */
  addGroupMessageToCache(groupId, message) {
    try {
      const existingMessages = this.getGroupMessagesCache(groupId) || []
      
      // 检查消息是否已存在（避免重复）
      const exists = existingMessages.some(msg => msg.id === message.id)
      if (!exists) {
        existingMessages.push(message)
        // 按时间排序
        existingMessages.sort((a, b) => new Date(a.sent_time) - new Date(b.sent_time))
        this.saveGroupMessagesCache(groupId, existingMessages)
        console.log(`新群聊消息已添加到缓存: ${groupId}`)
      }
    } catch (error) {
      console.error('添加群聊消息到缓存失败:', error)
    }
  }

  /**
   * 合并服务器消息到私聊缓存
   * @param {string} contactId - 联系人ID
   * @param {Array} serverMessages - 服务器消息列表
   * @returns {Array} 合并后的消息列表
   */
  mergePrivateMessagesToCache(contactId, serverMessages) {
    try {
      const cachedMessages = this.getPrivateMessagesCache(contactId) || []
      
      // 创建消息映射，以消息ID为键
      const messageMap = new Map()
      
      // 先添加缓存中的消息
      cachedMessages.forEach(msg => {
        messageMap.set(msg.id, msg)
      })
      
      // 再添加服务器消息（会覆盖同ID的消息）
      serverMessages.forEach(msg => {
        messageMap.set(msg.id, msg)
      })
      
      // 转换为数组并按时间排序
      const mergedMessages = Array.from(messageMap.values())
        .sort((a, b) => new Date(a.sent_time) - new Date(b.sent_time))
      
      // 保存合并后的消息
      this.savePrivateMessagesCache(contactId, mergedMessages)
      
      return mergedMessages
    } catch (error) {
      console.error('合并私聊消息缓存失败:', error)
      return serverMessages
    }
  }

  /**
   * 合并服务器消息到群聊缓存
   * @param {string} groupId - 群组ID
   * @param {Array} serverMessages - 服务器消息列表
   * @returns {Array} 合并后的消息列表
   */
  mergeGroupMessagesToCache(groupId, serverMessages) {
    try {
      const cachedMessages = this.getGroupMessagesCache(groupId) || []
      
      // 创建消息映射，以消息ID为键
      const messageMap = new Map()
      
      // 先添加缓存中的消息
      cachedMessages.forEach(msg => {
        messageMap.set(msg.id, msg)
      })
      
      // 再添加服务器消息（会覆盖同ID的消息）
      serverMessages.forEach(msg => {
        messageMap.set(msg.id, msg)
      })
      
      // 转换为数组并按时间排序
      const mergedMessages = Array.from(messageMap.values())
        .sort((a, b) => new Date(a.sent_time) - new Date(b.sent_time))
      
      // 保存合并后的消息
      this.saveGroupMessagesCache(groupId, mergedMessages)
      
      console.log(`群聊消息缓存合并完成: ${groupId}, 共${mergedMessages.length}条消息`)
      return mergedMessages
    } catch (error) {
      console.error('合并群聊消息缓存失败:', error)
      return serverMessages
    }
  }

  /**
   * 清除指定私聊的缓存
   * @param {string} contactId - 联系人ID
   */
  clearPrivateMessagesCache(contactId) {
    try {
      uni.removeStorageSync(`${this.CACHE_KEYS.PRIVATE_MESSAGES}_${contactId}`)
    } catch (error) {
      console.error('清除私聊消息缓存失败:', error)
    }
  }

  /**
   * 清除指定群聊的缓存
   * @param {string} groupId - 群组ID
   */
  clearGroupMessagesCache(groupId) {
    try {
      uni.removeStorageSync(`${this.CACHE_KEYS.GROUP_MESSAGES}_${groupId}`)
      console.log(`群聊消息缓存已清除: ${groupId}`)
    } catch (error) {
      console.error('清除群聊消息缓存失败:', error)
    }
  }

  /**
   * 清除所有聊天消息缓存
   */
  clearAllMessagesCache() {
    try {
      // 清除所有私聊消息缓存
      const privateKeys = Object.keys(uni.getStorageInfoSync().keys).filter(key => 
        key.startsWith(this.CACHE_KEYS.PRIVATE_MESSAGES)
      )
      privateKeys.forEach(key => uni.removeStorageSync(key))
      
      // 清除所有群聊消息缓存
      const groupKeys = Object.keys(uni.getStorageInfoSync().keys).filter(key => 
        key.startsWith(this.CACHE_KEYS.GROUP_MESSAGES)
      )
      groupKeys.forEach(key => uni.removeStorageSync(key))
      
      console.log('所有聊天消息缓存已清除')
    } catch (error) {
      console.error('清除所有聊天消息缓存失败:', error)
    }
  }

  /**
   * 检查聊天消息缓存是否需要更新
   * @param {string} chatType - 聊天类型 ('private' 或 'group')
   * @param {string} chatId - 聊天ID
   * @returns {boolean} 是否需要更新
   */
  shouldUpdateMessagesCache(chatType, chatId) {
    try {
      const key = chatType === 'private' 
        ? `${this.CACHE_KEYS.PRIVATE_MESSAGES}_${chatId}`
        : `${this.CACHE_KEYS.GROUP_MESSAGES}_${chatId}`
      
      const cacheData = uni.getStorageSync(key)
      if (!cacheData || !cacheData.timestamp) return true
      
      const age = Date.now() - cacheData.timestamp
      return age > this.MESSAGE_CACHE_EXPIRE_TIME
    } catch (error) {
      console.error('检查聊天消息缓存更新需求失败:', error)
      return true
    }
  }

  // ========== 已读消息状态管理 ==========
  
  /**
   * 保存私聊已读状态到本地存储
   * @param {string} uid - 当前用户ID
   * @param {string} contactUid - 联系人ID
   * @param {number} lastReadMsgId - 最后已读消息ID
   * @param {string} readTime - 已读时间
   */
  savePrivateReadStatus(uid, contactUid, lastReadMsgId, readTime) {
    try {
      const key = `${this.CACHE_KEYS.PRIVATE_READ_STATUS}_${uid}`
      const cacheData = uni.getStorageSync(key) || { data: {}, timestamp: Date.now() }
      
      // 更新已读状态
      cacheData.data[contactUid] = {
        last_read_msg_id: lastReadMsgId,
        read_time: readTime,
        update_time: new Date().toISOString()
      }
      cacheData.timestamp = Date.now()
      
      uni.setStorageSync(key, cacheData)
      console.log(`私聊已读状态已保存`)
    } catch (error) {
      console.error('保存私聊已读状态失败:', error)
    }
  }

  /**
   * 保存群聊已读状态到本地存储
   * @param {string} uid - 当前用户ID
   * @param {string} gid - 群组ID
   * @param {number} lastReadMsgId - 最后已读消息ID
   * @param {string} readTime - 已读时间
   */
  saveGroupReadStatus(uid, gid, lastReadMsgId, readTime) {
    try {
      const key = `${this.CACHE_KEYS.GROUP_READ_STATUS}_${uid}`
      const cacheData = uni.getStorageSync(key) || { data: {}, timestamp: Date.now() }
      
      // 更新已读状态
      cacheData.data[gid] = {
        last_read_msg_id: lastReadMsgId,
        read_time: readTime,
        update_time: new Date().toISOString()
      }
      cacheData.timestamp = Date.now()
      
      uni.setStorageSync(key, cacheData)
      console.log(`群聊已读状态已保存: ${uid} -> ${gid}, 消息ID: ${lastReadMsgId}`)
    } catch (error) {
      console.error('保存群聊已读状态失败:', error)
    }
  }

  /**
   * 获取私聊已读状态
   * @param {string} uid - 当前用户ID
   * @param {string} contactUid - 联系人ID
   * @returns {Object|null} 已读状态信息
   */
  getPrivateReadStatus(uid, contactUid) {
    try {
      const key = `${this.CACHE_KEYS.PRIVATE_READ_STATUS}_${uid}`
      const cacheData = uni.getStorageSync(key)
      
      if (!cacheData || !cacheData.data || !cacheData.data[contactUid]) {
        return null
      }
      
      return cacheData.data[contactUid]
    } catch (error) {
      console.error('获取私聊已读状态失败:', error)
      return null
    }
  }

  /**
   * 获取群聊已读状态
   * @param {string} uid - 当前用户ID
   * @param {string} gid - 群组ID
   * @returns {Object|null} 已读状态信息
   */
  getGroupReadStatus(uid, gid) {
    try {
      const key = `${this.CACHE_KEYS.GROUP_READ_STATUS}_${uid}`
      const cacheData = uni.getStorageSync(key)
      
      if (!cacheData || !cacheData.data || !cacheData.data[gid]) {
        return null
      }
      
      return cacheData.data[gid]
    } catch (error) {
      console.error('获取群聊已读状态失败:', error)
      return null
    }
  }

  /**
   * 获取所有私聊已读状态
   * @param {string} uid - 当前用户ID
   * @returns {Object} 所有私聊已读状态
   */
  getAllPrivateReadStatus(uid) {
    try {
      const key = `${this.CACHE_KEYS.PRIVATE_READ_STATUS}_${uid}`
      const cacheData = uni.getStorageSync(key)
      
      return cacheData?.data || {}
    } catch (error) {
      console.error('获取所有私聊已读状态失败:', error)
      return {}
    }
  }

  /**
   * 获取所有群聊已读状态
   * @param {string} uid - 当前用户ID
   * @returns {Object} 所有群聊已读状态
   */
  getAllGroupReadStatus(uid) {
    try {
      const key = `${this.CACHE_KEYS.GROUP_READ_STATUS}_${uid}`
      const cacheData = uni.getStorageSync(key)
      
      return cacheData?.data || {}
    } catch (error) {
      console.error('获取所有群聊已读状态失败:', error)
      return {}
    }
  }

  /**
   * 清除指定私聊的已读状态
   * @param {string} uid - 当前用户ID
   * @param {string} contactUid - 联系人ID
   */
  clearPrivateReadStatus(uid, contactUid) {
    try {
      const key = `${this.CACHE_KEYS.PRIVATE_READ_STATUS}_${uid}`
      const cacheData = uni.getStorageSync(key)
      
      if (cacheData && cacheData.data) {
        delete cacheData.data[contactUid]
        uni.setStorageSync(key, cacheData)
        console.log(`私聊已读状态已清除: ${uid} -> ${contactUid}`)
      }
    } catch (error) {
      console.error('清除私聊已读状态失败:', error)
    }
  }

  /**
   * 清除指定群聊的已读状态
   * @param {string} uid - 当前用户ID
   * @param {string} gid - 群组ID
   */
  clearGroupReadStatus(uid, gid) {
    try {
      const key = `${this.CACHE_KEYS.GROUP_READ_STATUS}_${uid}`
      const cacheData = uni.getStorageSync(key)
      
      if (cacheData && cacheData.data) {
        delete cacheData.data[gid]
        uni.setStorageSync(key, cacheData)
        console.log(`群聊已读状态已清除: ${uid} -> ${gid}`)
      }
    } catch (error) {
      console.error('清除群聊已读状态失败:', error)
    }
  }

  /**
   * 清除所有已读状态
   * @param {string} uid - 当前用户ID
   */
  clearAllReadStatus(uid) {
    try {
      uni.removeStorageSync(`${this.CACHE_KEYS.PRIVATE_READ_STATUS}_${uid}`)
      uni.removeStorageSync(`${this.CACHE_KEYS.GROUP_READ_STATUS}_${uid}`)
      console.log(`所有已读状态已清除: ${uid}`)
    } catch (error) {
      console.error('清除所有已读状态失败:', error)
    }
  }

  /**
   * 批量更新已读状态（从服务器同步）
   * @param {string} uid - 当前用户ID
   * @param {Array} privateReadStatus - 私聊已读状态列表
   * @param {Array} groupReadStatus - 群聊已读状态列表
   */
  batchUpdateReadStatus(uid, privateReadStatus = [], groupReadStatus = []) {
    try {
      // 更新私聊已读状态
      if (privateReadStatus.length > 0) {
        const privateKey = `${this.CACHE_KEYS.PRIVATE_READ_STATUS}_${uid}`
        const privateCacheData = uni.getStorageSync(privateKey) || { data: {}, timestamp: Date.now() }
        
        privateReadStatus.forEach(status => {
          privateCacheData.data[status.contact_uid] = {
            last_read_msg_id: status.last_read_msg_id,
            read_time: status.read_time,
            update_time: status.update_time || new Date().toISOString()
          }
        })
        
        privateCacheData.timestamp = Date.now()
        uni.setStorageSync(privateKey, privateCacheData)
        console.log(`批量更新私聊已读状态: ${privateReadStatus.length}条`)
      }

      // 更新群聊已读状态
      if (groupReadStatus.length > 0) {
        const groupKey = `${this.CACHE_KEYS.GROUP_READ_STATUS}_${uid}`
        const groupCacheData = uni.getStorageSync(groupKey) || { data: {}, timestamp: Date.now() }
        
        groupReadStatus.forEach(status => {
          groupCacheData.data[status.gid] = {
            last_read_msg_id: status.last_read_msg_id,
            read_time: status.read_time,
            update_time: status.update_time || new Date().toISOString()
          }
        })
        
        groupCacheData.timestamp = Date.now()
        uni.setStorageSync(groupKey, groupCacheData)
        console.log(`批量更新群聊已读状态: ${groupReadStatus.length}条`)
      }
    } catch (error) {
      console.error('批量更新已读状态失败:', error)
    }
  }
}

export default new ChatCache()
