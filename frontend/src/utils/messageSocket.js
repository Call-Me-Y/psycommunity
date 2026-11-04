/** Authenticated real-time chat transport with reconnect catch-up. */
import Database from './database.js'
import ChatCache from './chatCache.js'
import config from '../config/api.js'

class MessageSocket {
  constructor() {
    this.isRunning = false
    this.isAuthenticated = false
    this.socketTask = null
    this.reconnectTimer = null
    this.heartbeatTimer = null
    this.reconnectAttempts = 0
    this.lastPongAt = 0
    this.currentUser = null
    this.callbacks = new Set()
    this.seenMessageIds = new Set()
  }

  start(userInfo) {
    if (!userInfo || !userInfo.uid || !Database.getToken()) return
    if (this.isRunning && this.currentUser?.uid === userInfo.uid) {
      this.ensureConnected()
      return
    }
    if (this.isRunning) this.stop()

    this.currentUser = userInfo
    this.isRunning = true
    this.seenMessageIds = new Set(
      (ChatCache.getLatestMessagesCache() || []).map(message => String(message.id))
    )
    this.connect()
  }

  stop() {
    this.isRunning = false
    this.isAuthenticated = false
    this.currentUser = null
    this.seenMessageIds.clear()
    this.clearTimers()
    const task = this.socketTask
    this.socketTask = null
    if (task) {
      try { task.close({ code: 1000, reason: 'client stopped' }) } catch (_) {}
    }
  }

  ensureConnected() {
    if (!this.isRunning || this.reconnectTimer) return
    if (this.isAuthenticated && this.socketTask) {
      if (Date.now() - this.lastPongAt > 45000) {
        const staleTask = this.socketTask
        this.handleDisconnect(staleTask)
        try { staleTask.close({ code: 4000, reason: 'connection stale' }) } catch (_) {}
      } else {
        try { this.socketTask.send({ data: JSON.stringify({ type: 'ping' }) }) } catch (_) {}
      }
      return
    }
    if (!this.socketTask) this.connect()
  }

  connect() {
    if (!this.isRunning || this.socketTask || this.reconnectTimer) return
    if (!config.WEBSOCKET_URL) {
      console.error('WebSocket 地址不可用；App/小程序请配置 VITE_API_BASE_URL 或 VITE_WS_BASE_URL')
      return
    }

    try {
      const task = uni.connectSocket({ url: config.WEBSOCKET_URL, complete: () => {} })
      this.socketTask = task
      task.onOpen(() => {
        if (this.socketTask !== task) return
        const token = Database.getToken()
        if (!token) {
          this.stop()
          return
        }
        task.send({ data: JSON.stringify({ type: 'auth', token }) })
      })
      task.onMessage(event => {
        if (this.socketTask === task) this.handleFrame(event.data)
      })
      task.onError(error => {
        console.warn('WebSocket 连接异常', error)
        this.handleDisconnect(task)
        try { task.close({ code: 4000, reason: 'connection error' }) } catch (_) {}
      })
      task.onClose(() => this.handleDisconnect(task))
    } catch (error) {
      console.warn('创建 WebSocket 连接失败', error)
      this.scheduleReconnect()
    }
  }

  handleFrame(raw) {
    let frame
    try { frame = typeof raw === 'string' ? JSON.parse(raw) : raw } catch (_) { return }
    if (frame?.type === 'auth_error') {
      console.warn(frame.message || 'WebSocket 身份验证失败')
      this.stop()
      return
    }
    if (frame?.type === 'ready') {
      this.isAuthenticated = true
      this.reconnectAttempts = 0
      this.lastPongAt = Date.now()
      this.startHeartbeat()
      this.notifyCallbacks({ type: 'connected', timestamp: Date.now() })
      // Reconcile once after connect/reconnect so messages missed while offline are recovered.
      this.syncMissedMessages()
      return
    }
    if (frame?.type === 'pong') {
      this.lastPongAt = Date.now()
      return
    }
    if (frame?.type === 'newMessage' && frame.message) this.receiveMessage(frame.message)
  }

  receiveMessage(message) {
    if (!this.currentUser || !message?.id || message.sender_uid === this.currentUser.uid) return
    const id = String(message.id)
    if (this.seenMessageIds.has(id)) return
    this.rememberMessageId(id)

    if (message.chat_type && message.contact_id != null) {
      ChatCache.mergeMessagesToCache([message])
    }
    this.notifyCallbacks({
      type: 'newMessages',
      messages: [message],
      count: 1,
      timestamp: Date.now()
    })
  }

  async syncMissedMessages() {
    if (!this.currentUser || !this.isAuthenticated) return
    try {
      const response = await Database.getLatestMessages()
      if (!response.success) return

      const cachedByChat = new Map((ChatCache.getLatestMessagesCache() || []).map(message => [
        `${message.chat_type}_${message.contact_id}`,
        message
      ]))
      const messages = response.messages || []
      const newMessages = messages.filter(message => {
        if (message.sender_uid === this.currentUser.uid) return false
        const key = `${message.chat_type}_${message.contact_id}`
        const cached = cachedByChat.get(key)
        const isNew = !cached || String(cached.id) !== String(message.id)
        if (!isNew) return false
        if (this.seenMessageIds.has(String(message.id))) return false
        this.rememberMessageId(String(message.id))
        return true
      })

      ChatCache.mergeMessagesToCache(messages)
      if (newMessages.length) {
        this.notifyCallbacks({
          type: 'newMessages',
          messages: newMessages,
          count: newMessages.length,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('同步离线消息失败:', error)
    }
  }

  rememberMessageId(id) {
    this.seenMessageIds.add(id)
    if (this.seenMessageIds.size > 500) {
      this.seenMessageIds = new Set(Array.from(this.seenMessageIds).slice(-300))
    }
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = setInterval(() => {
      if (!this.isAuthenticated || !this.socketTask) return
      if (Date.now() - this.lastPongAt > 45000) {
        const task = this.socketTask
        this.handleDisconnect(task)
        try { task.close({ code: 4000, reason: 'heartbeat timeout' }) } catch (_) {}
        return
      }
      try { this.socketTask.send({ data: JSON.stringify({ type: 'ping' }) }) } catch (_) {}
    }, 30000)
  }

  handleDisconnect(task) {
    if (task && this.socketTask !== task) return
    this.socketTask = null
    this.isAuthenticated = false
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
    this.scheduleReconnect()
  }

  scheduleReconnect() {
    if (!this.isRunning || this.reconnectTimer) return
    const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 30000)
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  clearTimers() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.reconnectTimer = null
    this.heartbeatTimer = null
  }

  addCallback(callback) { this.callbacks.add(callback) }
  removeCallback(callback) { this.callbacks.delete(callback) }

  notifyCallbacks(data) {
    this.callbacks.forEach(callback => {
      try { callback(data) } catch (error) { console.error('执行消息监听回调失败:', error) }
    })
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isConnected: this.isAuthenticated,
      currentUser: this.currentUser ? this.currentUser.uid : null,
      callbackCount: this.callbacks.size
    }
  }

  async manualSync() { await this.syncMissedMessages() }
}

export default new MessageSocket()
