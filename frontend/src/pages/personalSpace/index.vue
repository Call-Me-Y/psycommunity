<template>
  <view class="personal-space">
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="back-icon">←</text>
    </view>
    
    <!-- 用户信息头部 -->
    <view class="user-header">
      <image class="user-avatar" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill"></image>
      <view class="user-info">
        <text class="user-name">{{ userInfo.name || userInfo.username }}</text>
        <text class="user-uid">UID: {{ userInfo.uid }}</text>
      </view>
    </view>

    <!-- 动态列表 -->
    <view class="posts-section">
      <view class="section-title">发布的动态</view>
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="posts.length === 0" class="empty">
        <text>暂无动态</text>
      </view>
      <view v-else class="posts-list">
        <view v-for="post in posts" :key="post.pid" class="post-item" @click="goToPostDetail(post.pid)">
          <view class="post-content">
            <text class="post-text">{{ post.text_content }}</text>
            <view v-if="post.image_urls && post.image_urls.length" class="post-images">
              <image v-for="(img, idx) in post.image_urls.slice(0, 3)" :key="idx" 
                     class="post-image" :src="getImageUrl(img)" mode="aspectFill"></image>
              <view v-if="post.image_urls.length > 3" class="more-images">
                <text>+{{ post.image_urls.length - 3 }}</text>
              </view>
            </view>
            <view v-if="post.file_urls && post.file_urls.length" class="post-files">
              <view v-for="(file, idx) in post.file_urls.slice(0, 2)" :key="idx" class="post-file">
                <text class="file-icon">📁</text>
                <text class="file-name">{{ getFileName(file) }}</text>
              </view>
              <view v-if="post.file_urls.length > 2" class="more-files">
                <text>+{{ post.file_urls.length - 2 }}个文件</text>
              </view>
            </view>
          </view>
          <view class="post-meta">
            <text class="post-time">{{ formatTime(post.created_time) }}</text>
            <view class="post-stats">
              <text class="likes">👍 {{ post.likes }}</text>
              <text class="comments">💬 {{ post.comments }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="bottom-actions">
      
      <button v-if="shouldShowChatButton" class="action-btn start-chat" @click="startChat">
        进入私聊
      </button>
      <button v-else-if="!isOwnSpace && !isFriend" class="action-btn add-friend" @click="showAddFriendDialog">
        添加好友
      </button>
    </view>

    <!-- 添加好友弹窗 -->
    <view v-if="showAddFriendModal" class="modal-overlay" @click="hideAddFriendDialog">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加好友</text>
          <text class="modal-close" @click="hideAddFriendDialog">×</text>
        </view>
        <view class="modal-body">
          <text class="input-label">验证信息</text>
          <textarea 
            class="verification-input" 
            v-model="verificationMessage" 
            placeholder="请输入验证信息..."
            maxlength="100"
          ></textarea>
          <text class="char-count">{{ verificationMessage.length }}/100</text>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @click="hideAddFriendDialog">取消</button>
          <button class="modal-btn confirm-btn" @click="sendFriendRequest" :disabled="!verificationMessage.trim()">
            发送申请
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js';
import ChatNavigation from '@/utils/chatNavigation.js';

export default {
  data() {
    return {
      targetUid: null,
      userInfo: {},
      posts: [],
      loading: true,
      isOwnSpace: false,
      isFriend: false,
      currentUser: null,
      currentUserType: null,
      showAddFriendModal: false,
      verificationMessage: ''
    };
  },
  computed: {
    shouldShowChatButton() {
      // 管理员（type为0）、是自己的空间、或者已经是好友关系时显示"进入私聊"按钮
      return this.currentUserType === 0 || this.isOwnSpace || this.isFriend;
    }
  },
  onLoad(options) {
    this.targetUid = options.uid;
    this.currentUser = uni.getStorageSync('currentUser');
    this.isOwnSpace = this.currentUser && this.currentUser.uid === this.targetUid;
    this.loadCurrentUserType();
    this.loadUserInfo();
    this.loadUserPosts();
    this.checkFriendStatus();
  },
  methods: {
    async loadCurrentUserType() {
      try {
        const userRes = await Database.verifyToken();
        if (userRes.success) {
          this.currentUserType = userRes.user.type;
        }
      } catch (error) {
        console.error('获取当前用户类型失败:', error);
      }
    },
    async loadUserInfo() {
      try {
        const res = await Database.getUserInfo(this.targetUid);
        if (res.success) {
          this.userInfo = res.user;
        } else {
          uni.showToast({ title: '获取用户信息失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        uni.showToast({ title: '获取用户信息失败', icon: 'none' });
      }
    },
    async loadUserPosts() {
      try {
        const res = await Database.getUserPosts(this.targetUid);
        if (res.success) {
          this.posts = res.posts;
        } else {
          uni.showToast({ title: '获取动态失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取动态失败:', error);
        uni.showToast({ title: '获取动态失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    async checkFriendStatus() {
      if (this.isOwnSpace) return;
      
      try {
        const res = await Database.getContacts();
        if (res.success) {
          this.isFriend = res.contacts.some(contact => contact.uid === this.targetUid);
        }
      } catch (error) {
        console.error('检查好友状态失败:', error);
      }
    },
    getAvatarUrl(avatar) {
      if (!avatar) return '/static/avatar.png';
      if (avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${avatar}`;
      }
      return avatar;
    },
    getImageUrl(imagePath) {
      if (imagePath.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${imagePath}`;
      }
      return imagePath;
    },
    getFileName(filePath) {
      if (!filePath) return '';
      const parts = filePath.split('/');
      return parts[parts.length - 1];
    },
    formatTime(timeStr) {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
      
      return date.toLocaleDateString();
    },
    goToPostDetail(pid) {
      uni.navigateTo({
        url: `/pages/community/postDetail?pid=${pid}`
      });
    },
    showAddFriendDialog() {
      this.showAddFriendModal = true;
      this.verificationMessage = '';
    },
    
    hideAddFriendDialog() {
      this.showAddFriendModal = false;
      this.verificationMessage = '';
    },
    
    async sendFriendRequest() {
      if (!this.verificationMessage.trim()) {
        uni.showToast({ title: '请输入验证信息', icon: 'none' });
        return;
      }
      
      try {
        const currentUser = uni.getStorageSync('currentUser');
        const content = `[验证信息]${currentUser.name || currentUser.uid} 请求添加您为好友：${this.verificationMessage}`;
        
        // 将申请者UID记录到link字段中
        const res = await Database.sendPrivateMessage(this.targetUid, content, 3, currentUser.uid);
        if (res.success) {
          uni.showToast({ title: '好友申请已发送', icon: 'success' });
          this.hideAddFriendDialog();
        } else {
          uni.showToast({ title: res.message || '发送申请失败', icon: 'none' });
        }
      } catch (error) {
        console.error('发送好友申请失败:', error);
        uni.showToast({ title: '发送申请失败', icon: 'none' });
      }
    },
    startChat() {
      // 使用安全的私聊导航
      ChatNavigation.navigateToPrivateChat(
        this.targetUid,
        this.userInfo.name || this.userInfo.username,
        this.userInfo.avatar
      );
    },
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.personal-space {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 120rpx;
  position: relative;
}

.back-button {
  position: fixed;
  top: 20rpx;
  left: 20rpx;
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.2s ease;
}

.back-button:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 1);
}

.back-icon {
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
}

.user-header {
  background: white;
  padding: 40rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 32rpx;
  background: #ecf0f1;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8rpx;
}

.user-uid {
  display: block;
  font-size: 28rpx;
  color: #7f8c8d;
}

.posts-section {
  margin-top: 20rpx;
  background: white;
  border-radius: 16rpx;
  margin: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  padding: 32rpx;
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
  border-bottom: 1rpx solid #f0f0f0;
}

.loading, .empty {
  text-align: center;
  padding: 60rpx;
  color: #7f8c8d;
  font-size: 28rpx;
}

.posts-list {
  padding: 0;
}

.post-item {
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.post-item:last-child {
  border-bottom: none;
}

.post-item:active {
  background-color: #f8f9fa;
}

.post-content {
  margin-bottom: 16rpx;
}

.post-text {
  font-size: 28rpx;
  color: #2c3e50;
  line-height: 1.6;
  display: block;
  margin-bottom: 16rpx;
}

.post-images {
  display: flex;
  gap: 8rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;
}

.post-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  background: #ecf0f1;
}

.more-images {
  width: 120rpx;
  height: 120rpx;
  background: #bdc3c7;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24rpx;
}

.post-files {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;
}

.post-file {
  display: flex;
  align-items: center;
  background: #e3f2fd;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #1976d2;
}

.file-icon {
  margin-right: 8rpx;
}

.more-files {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #7f8c8d;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-time {
  font-size: 24rpx;
  color: #95a5a6;
}

.post-stats {
  display: flex;
  gap: 24rpx;
}

.likes, .comments {
  font-size: 24rpx;
  color: #7f8c8d;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx 32rpx;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.action-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  color: white;
}

.add-friend {
  background: linear-gradient(135deg, #55B99E, #2980b9);
}

.start-chat {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.action-btn:active {
  opacity: 0.8;
}

/* 弹窗样式 */
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 16rpx;
  width: 80%;
  max-width: 600rpx;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
}

.modal-close {
  font-size: 40rpx;
  color: #bdc3c7;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 32rpx;
}

.input-label {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  margin-bottom: 16rpx;
}

.verification-input {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #2c3e50;
  background: #f8f9fa;
  box-sizing: border-box;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #7f8c8d;
  margin-top: 8rpx;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.cancel-btn {
  background: #ecf0f1;
  color: #7f8c8d;
}

.confirm-btn {
  background: linear-gradient(135deg, #55B99E, #2980b9);
  color: white;
}

.confirm-btn:disabled {
  background: #bdc3c7;
  color: #7f8c8d;
}

.modal-btn:active {
  opacity: 0.8;
}
</style>
