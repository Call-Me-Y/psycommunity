<template>
  <view class="agent-page">
    <view class="header">
      <text class="back" @click="goBack">←</text>
      <view class="contact"><image class="avatar" src="/static/avatar.png" mode="aspectFill" /><view><text class="title">AI 助手</text><text class="status">AI 对话</text></view></view>
      <text class="clear" @click="clearHistory">清空</text>
    </view>
    <view class="notice">对话内容会发送给部署者配置的外部服务。助手不能替代专业帮助。</view>
    <view v-if="configured === false" class="notice warning">对话服务尚未配置，请联系管理员。</view>
    <scroll-view class="messages message-list" scroll-y :scroll-top="scrollTop" @scroll="onChatScroll">
      <view v-if="!messages.length" class="empty">你好，想聊聊什么？</view>
      <view v-for="(message, index) in messages" :id="'msg-' + index" :key="message.id || index"
            class="message-row" :class="message.role === 'user' ? 'mine' : 'assistant'">
        <view v-if="message.role !== 'user'" class="sender"><image class="avatar" src="/static/avatar.png" mode="aspectFill" /><text>AI 助手</text></view>
        <view class="bubble"><text selectable>{{ message.content }}</text></view>
      </view>
      <view v-if="sending" class="message-row assistant"><view class="bubble">正在回复…</view></view>
      <view id="message-bottom"></view>
    </scroll-view>
    <view class="composer">
      <textarea v-model="draft" class="input" maxlength="4000" :auto-height="true" placeholder="输入想说的话" />
      <button class="send" :disabled="sending || !draft.trim() || configured === false" @click="send">发送</button>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js'
import Database from '../../utils/database.js'
import * as ChatScroll from '../../utils/chatScroll.js'

export default {
  data() { return { messages: [], draft: '', sending: false, configured: null, currentUser: { uid: '' }, scrollTop: 999999, chatLastTop: 0, chatViewportHeight: 0, chatNearBottom: true, chatScrollReady: false } },
  async onShow() { try { const result = await Database.verifyToken(); if (result.success) this.currentUser.uid = result.user.uid } catch (_) {} await this.load(true) },
  onHide() { ChatScroll.remember(this, 'agent', 'agent') },
  onUnload() { ChatScroll.remember(this, 'agent', 'agent') },
  methods: {
    request(path, method = 'GET', data = undefined) {
      return new Promise((resolve, reject) => uni.request({
        url: `${config.API_BASE_URL}/agent${path}`, method, data, timeout: 70000,
        header: { Authorization: `Bearer ${Database.getToken()}`, 'Content-Type': 'application/json' },
        success: res => resolve(res.data), fail: reject
      }))
    },
    async load(restorePosition = false) {
      try {
        const [status, history] = await Promise.all([this.request('/status'), this.request('/messages')])
        if (status.success) this.configured = status.configured
        if (history.success) this.messages = history.messages || []
        if (restorePosition) ChatScroll.restore(this, 'agent', 'agent')
        else this.scrollDown()
        return !!history.success
      } catch (_) { uni.showToast({ title: '无法连接服务', icon: 'none' }); return false }
    },
    async send() {
      const content = this.draft.trim()
      if (!content || this.sending) return
      const existingIds = new Set(this.messages.map(message => message.id))
      this.sending = true
      this.draft = ''
      const pending = { id: `pending-${Date.now()}`, role: 'user', content }
      this.messages.push(pending)
      this.scrollDown()
      try {
        const result = await this.request('/messages', 'POST', { content })
        if (result.success) {
          this.messages.push({ id: `reply-${Date.now()}`, role: 'assistant', content: result.reply })
          await this.load()
        } else {
          uni.showToast({ title: result.message || '发送失败', icon: 'none' })
          const loaded = await this.load()
          if (loaded && !this.messages.some(message => !existingIds.has(message.id) && message.role === 'user' && message.content === content)) this.draft = content
        }
      } catch (_) { uni.showToast({ title: '发送结果未确认，请稍后查看记录', icon: 'none' }) }
      finally { this.sending = false; this.scrollDown() }
    },
    clearHistory() {
      if (this.sending) { uni.showToast({ title: '请等待回复完成', icon: 'none' }); return }
      uni.showModal({ title: '清空对话', content: '确定删除你的 AI 对话记录吗？', success: async res => {
        if (!res.confirm) return
        try { const result = await this.request('/messages', 'DELETE'); if (result.success) this.messages = [] }
        catch (_) { uni.showToast({ title: '清空失败', icon: 'none' }) }
      } })
    },
    onChatScroll(event) { ChatScroll.capture(this, event) },
    scrollDown() { this.$nextTick(() => ChatScroll.bottom(this)) },
    goBack() { uni.navigateBack() }
  }
}
</script>

<style scoped>
.agent-page { height:100vh; display:flex; flex-direction:column; background:#f5f5f5 url('/static/bgc.jpg') center/cover no-repeat; }
.header { display:flex; align-items:center; height:88rpx; padding:0 20rpx; box-sizing:border-box; background:white; border-bottom:1rpx solid #e0e0e0; }
.back { width:80rpx; text-align:center; font-size:36rpx; font-weight:bold; }
.contact { flex:1; display:flex; align-items:center; padding:0 20rpx; }
.avatar { width:60rpx; height:60rpx; border-radius:50%; margin-right:20rpx; }
.title,.status { display:block; }
.title { font-size:28rpx; color:#333; font-weight:500; }
.status { margin-top:4rpx; color:#999; font-size:24rpx; }
.clear { width:80rpx; text-align:center; font-size:26rpx; }
.notice { padding:16rpx 28rpx; font-size:24rpx; color:#567165; background:#edf7f0; }
.warning { color:#875e21; background:#fff7e5; }
.messages { flex:1; min-height:0; padding:20rpx; box-sizing:border-box; }
.empty { text-align:center; color:#789286; padding:60rpx; }
.message-row { display:flex; align-items:flex-start; margin:20rpx 0; }
.message-row.mine { justify-content:flex-end; }
.sender { display:flex; flex-direction:column; align-items:center; min-width:80rpx; margin-right:16rpx; color:#999; font-size:20rpx; }
.sender .avatar { margin:0 0 8rpx; }
.bubble { max-width:70%; padding:16rpx 20rpx; border-radius:16rpx; background:white; border:1rpx solid #e0e0e0; color:#333; font-size:28rpx; word-break:break-word; white-space:pre-wrap; }
.mine .bubble { background:rgb(80,192,121); border-color:rgb(80,192,121); color:white; }
.composer { display:flex; align-items:flex-end; gap:16rpx; padding:20rpx; background:white; border-top:1rpx solid #e0e0e0; }
.input { flex:1; min-height:72rpx; max-height:220rpx; padding:14rpx 20rpx; box-sizing:border-box; background:#f8f8f8; border-radius:24rpx; }
.send { margin:0; color:white; background:#55B99E; border-radius:20rpx; font-size:24rpx; }
</style>
