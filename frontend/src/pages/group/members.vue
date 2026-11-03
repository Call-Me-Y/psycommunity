<template>
  <view class="members-container">
    <view class="header">
      <text class="back-btn" @click="goBack">← 返回</text>
      <text class="title">群成员 ({{ members.length }})</text>
    </view>
    
    <view class="members-list">
      <view 
        v-for="member in members" 
        :key="member.uid" 
        class="member-item"
      >
        <image 
          class="member-avatar" 
          :src="getAvatarUrl(member.avatar)" 
          mode="aspectFill"
        />
        <view class="member-info">
          <text class="member-name">{{ member.name }}</text>
          <text class="member-uid">ID: {{ member.uid }}</text>
        </view>
        <view class="member-actions">
          <text class="action-btn" @click="goToPersonalSpace(member.uid)">个人空间</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js'

export default {
  data() {
    return {
      gid: null,
      members: []
    }
  },
  onLoad(options) {
    this.gid = parseInt(options.gid)
    if (this.gid) {
      this.loadMembers()
    }
  },
  methods: {
    async loadMembers() {
      try {
        const res = await Database.getGroupMembers(this.gid)
        if (res.success) {
          this.members = res.members
        } else {
          uni.showToast({
            title: res.message || '获取群成员失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取群成员失败:', error)
        uni.showToast({
          title: '获取群成员失败',
          icon: 'none'
        })
      }
    },
    
    goBack() {
      uni.navigateBack()
    },
    
    getAvatarUrl(avatar) {
      if (!avatar) return '/static/avatar.png'
      if (avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${avatar}`
      }
      return avatar
    },
    
    goToPersonalSpace(uid) {
      uni.navigateTo({
        url: `/pages/personalSpace/index?uid=${uid}`
      })
    }
  }
}
</script>

<style scoped>
.members-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  background: white;
  border-bottom: 1rpx solid #e0e0e0;
}

.back-btn {
  font-size: 32rpx;
  color: #55B99E;
  margin-right: 20rpx;
}

.title {
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
}

.members-list {
  padding: 20rpx;
}

.member-item {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #e0e0e0;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.member-name {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
}

.member-uid {
  font-size: 24rpx;
  color: #7f8c8d;
}

.member-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  font-size: 24rpx;
  color: #55B99E;
  padding: 12rpx 24rpx;
  background: #e3f2fd;
  border-radius: 20rpx;
}
</style>
