<template>
  <view class="chat-container">
    <view class="chat-header">
      <text class="back" @click="goBack">←</text>
      <image class="avatar" src="/static/avatar.png" mode="aspectFill" />
      <view class="contact"><text class="name">管理员通知</text><text class="status">系统自动生成</text></view>
      <text class="refresh" @click="load">刷新</text>
    </view>
    <view class="notice">情绪关注提醒由系统自动生成，并非管理员手动发送。本地情绪分析：{{ modelText }}</view>
    <scroll-view scroll-y class="message-list">
      <view v-if="!items.length" class="empty">暂无通知</view>
      <view v-for="item in items" :key="item.id" class="message-group" @click="markRead(item)">
        <view class="time">{{ formatTime(item.created_at) }}</view>
        <view class="message-row">
          <view class="sender"><image class="avatar" src="/static/avatar.png" mode="aspectFill" /><text>管理员通知</text></view>
          <view class="bubble">
            <text v-if="isAdmin && item.target_uid" class="target">关注账号：{{ item.target_uid }}</text>
            <text selectable>{{ item.message }}</text>
            <text class="read-state">{{ item.is_read ? '已读' : '未读 · 点击标记已读' }}</text>
            <button v-if="isAdmin && item.target_uid && item.target_uid !== currentUid" class="reply" @click.stop="contactUser(item)">给该用户发消息</button>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import config from '../../config/api.js'
import Database from '../../utils/database.js'
import ChatNavigation from '../../utils/chatNavigation.js'
export default {
  data() { return { items: [], modelText: '检查中', isAdmin: false, currentUid: '', refreshTimer: null } },
  onShow() { this.load(); if (!this.refreshTimer) this.refreshTimer = setInterval(() => this.load(), 15000) },
  onHide() { this.stopRefresh() },
  onUnload() { this.stopRefresh() },
  methods: {
    stopRefresh() { if (this.refreshTimer) clearInterval(this.refreshTimer); this.refreshTimer = null },
    request(path, method='GET') { return new Promise((resolve,reject) => uni.request({
      url: `${config.API_BASE_URL}${path}`, method, header: { Authorization: `Bearer ${Database.getToken()}` },
      success: res => resolve(res.data), fail: reject
    })) },
    async load() {
      try {
        const [notices,status,user] = await Promise.all([this.request('/notifications'),this.request('/emotion/status'),Database.verifyToken()])
        if(notices.success) { this.items=notices.notifications || []; this.isAdmin=!!notices.is_admin }
        if(status.success) this.modelText=status.model.available ? '可用' : (status.model.enabled ? '不可用' : '未启用')
        if(user.success) this.currentUid=user.user.uid
      } catch (_) { this.modelText='无法连接'; uni.showToast({title:'加载失败',icon:'none'}) }
    },
    async markRead(item) { if(item.is_read) return; try { const result=await this.request(`/notifications/${item.id}/read`,'POST'); if(result.success) item.is_read=true } catch (_) { uni.showToast({title:'操作失败',icon:'none'}) } },
    contactUser(item) { ChatNavigation.navigateToPrivateChat(item.target_uid, item.target_uid) },
    formatTime(value) { const time=new Date(value); return isNaN(time.getTime()) ? value : time.toLocaleString() },
    goBack() { uni.navigateBack() }
  }
}
</script>

<style scoped>
.chat-container { height:100vh; display:flex; flex-direction:column; background:#f5f5f5 url('/static/bgc.jpg') center/cover no-repeat; }
.chat-header { display:flex; align-items:center; height:88rpx; padding:0 20rpx; box-sizing:border-box; background:white; border-bottom:1rpx solid #e0e0e0; }
.back { width:80rpx; text-align:center; font-size:36rpx; font-weight:bold; }
.avatar { width:60rpx; height:60rpx; border-radius:50%; }
.chat-header .avatar { margin-right:20rpx; }
.contact { flex:1; display:flex; flex-direction:column; }
.name { color:#333; font-size:28rpx; font-weight:500; }
.status { color:#999; font-size:24rpx; margin-top:4rpx; }
.refresh { font-size:26rpx; }
.notice { padding:16rpx 28rpx; color:#567165; background:#edf7f0; font-size:24rpx; }
.message-list { flex:1; min-height:0; padding:20rpx; box-sizing:border-box; }
.empty { text-align:center; padding:60rpx; color:#789286; }
.message-group { margin-bottom:28rpx; }
.time { text-align:center; color:#999; font-size:22rpx; margin:20rpx 0; }
.message-row { display:flex; align-items:flex-start; }
.sender { display:flex; flex-direction:column; align-items:center; min-width:80rpx; margin-right:16rpx; color:#999; font-size:20rpx; }
.sender .avatar { margin-bottom:8rpx; }
.bubble { max-width:70%; padding:16rpx 20rpx; border:1rpx solid #e0e0e0; border-radius:16rpx; background:white; color:#333; font-size:28rpx; line-height:1.5; word-break:break-word; }
.target { display:block; font-weight:600; }
.read-state { display:block; color:#789286; font-size:22rpx; margin-top:12rpx; }
.reply { margin:16rpx 0 0; color:white; background:#55B99E; font-size:24rpx; }
</style>
