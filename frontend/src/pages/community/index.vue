<template>
  <view class="community-container">
    <view class="header">
      <text class="page-title">社区</text>
      <text class="subtitle">青少年心理健康互助社区</text>
    </view>
    
    <view class="content">
      <!-- 快速操作 -->
      <view class="quick-actions">
  <view class="action-row">
    <view class="action-card" @click="goTo('searchPost')">
      <text class="action-icon">🔍</text>
      <text class="action-text">搜索动态</text>
    </view>
    <view class="action-card" @click="goTo('createPost')">
      <text class="action-icon">✏️</text>
      <text class="action-text">发布动态</text>
    </view>

    <view class="action-card" @click="goTo('manage')">
      <text class="action-icon">📋️</text>
      <text class="action-text">发布管理</text>
    </view>
  </view>

</view>
      

      
      <!-- 推荐动态 -->
      <view class="section">
  <view class="tab-bar">
    <text :class="{active: tab==='latest'}" @click="changeTab('latest')">最新</text>
    <text :class="{active: tab==='hot'}" @click="changeTab('hot')">最热</text>
  </view>
      
      <!-- 加载中提示 -->
      <view v-if="loading && posts.length === 0" class="loading-container">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 动态列表 -->
      <view class="post-list" v-else>
        <view class="post-item" v-for="post in posts" :key="post.pid" @click="goToPost(post.pid)">
          <view class="post-header">
            <image class="avatar" :src="getAvatarUrl(post.avatar)" mode="aspectFill" @click.stop="goToPersonalSpace(post.uid)"></image>
            <view class="user-info">
              <text class="username" @click.stop="goToPersonalSpace(post.uid)">{{ post.username || '未命名' }}</text>
              <text class="post-time">{{ formatTime(post.created_time) }}</text>
            </view>
          </view>
          <text class="post-content">{{ post.text_content }}</text>
          <view v-if="post.image_urls && post.image_urls.length" class="post-images">
            <image 
              v-for="(img, idx) in post.image_urls" 
              :key="idx" 
              :src="getImageUrl(img)" 
              class="post-img-preview"
              mode="aspectFill"
            />
          </view>
          <view v-if="post.file_urls && post.file_urls.length" class="post-files">
            <view v-for="(file, idx) in post.file_urls" :key="idx" class="post-file-item" @click="downloadFile(file)">
              <text class="file-icon">📁</text>
              <text class="file-name">{{ getFileName(file) }}</text>
            </view>
          </view>
          <view class="post-actions">
            <view class="action-btn" :class="{liked: post.is_liked}" @click.stop="likePost(post)">
              <text class="action-icon">{{ post.is_liked ? '❤️' : '🩶' }}</text>
              <text class="action-count">{{ post.likes || 0 }}</text>
            </view>
            <view class="action-btn">
              <text class="action-icon">💬</text>
              <text class="action-count">{{ post.comments || 0 }}</text>
            </view>
          </view>
        </view>
        
        <!-- 底部加载更多提示 -->
        <view v-if="loading && posts.length > 0" class="load-more-container">
          <view class="loading-spinner small"></view>
          <text class="loading-text">加载更多...</text>
        </view>
        
        <!-- 没有更多数据提示 -->
        <view v-if="!hasMore && posts.length > 0" class="no-more-container">
          <text class="no-more-text">没有更多动态了</text>
        </view>
      </view>
</view>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';

  import Database from '@/utils/database.js';
import { installMousePullRefresh, removeMousePullRefresh } from '@/utils/mousePullRefresh.js'

export default {
  data() {
    return {
      tab: 'latest',
      posts: [],
      loading: false,
      hasMore: true,
      offset: 0,
      limit: 20,
      postRequestVersion: 0
    }
  },
  onShow() {
    // 每次显示页面时自动刷新数据
    this.fetchPosts();
    this.$nextTick(() => installMousePullRefresh(this))
  },
  onHide() { removeMousePullRefresh(this) },
  onUnload() { removeMousePullRefresh(this) },
  async onPullDownRefresh() {
    try { await this.fetchPosts() }
    finally { uni.stopPullDownRefresh() }
  },
  onReachBottom() {
    // 触底加载更多
    if (this.hasMore && !this.loading) {
      this.loadMore();
    }
  },
  methods: {
    async fetchPosts() {
      const requestVersion = ++this.postRequestVersion;
      this.loading = true;
      
      try {
        const orderBy = this.tab === 'hot' ? 'likes' : 'time';
        const res = await Database.getPosts(orderBy, this.limit, 0);
        if (requestVersion !== this.postRequestVersion) return;
        
        if (res.success) {
          this.posts = res.posts;
          this.hasMore = res.has_more;
          this.offset = this.posts.length;
        } else {
          uni.showToast({ title: res.message || '获取动态失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取动态列表失败:', error);
        uni.showToast({ title: '获取动态失败', icon: 'none' });
      } finally {
        if (requestVersion === this.postRequestVersion) this.loading = false;
      }
    },
    
    async loadMore() {
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      const requestVersion = this.postRequestVersion;
      
      try {
        const orderBy = this.tab === 'hot' ? 'likes' : 'time';
        const res = await Database.getPosts(orderBy, this.limit, this.offset);
        if (requestVersion !== this.postRequestVersion) return;
        
        if (res.success) {
          this.posts = [...this.posts, ...res.posts];
          this.hasMore = res.has_more;
          this.offset = this.posts.length;
        }
      } catch (error) {
        console.error('加载更多动态失败:', error);
      } finally {
        if (requestVersion === this.postRequestVersion) this.loading = false;
      }
    },
    
    changeTab(tab) {
      this.tab = tab;
      this.fetchPosts();
    },
    
    goToPost(pid) {
      uni.navigateTo({ url: `/pages/community/postDetail?pid=${pid}` });
    },
    
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        return Math.floor(diff / 60000) + '分钟前';
      } else if (diff < 86400000) { // 1天内
        return Math.floor(diff / 3600000) + '小时前';
      } else {
        return time.split('T')[0];
      }
    },
    
    getAvatarUrl(avatar) {
      if (!avatar) return '/static/avatar.png';
      if (avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${avatar}`;
      }
      return avatar;
    },
    
    getImageUrl(imageUrl) {
      if (!imageUrl) return '';
      if (imageUrl.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${imageUrl}`;
      }
      return imageUrl;
    },
    
    getFileName(filePath) {
      if (!filePath) return '未知文件';
      const fileName = filePath.split('/').pop();
      return fileName || '未知文件';
    },
    
    downloadFile(filePath) {
      const fileName = this.getFileName(filePath);
      const fileUrl = this.getImageUrl(filePath);
      
      // 在H5环境下，使用window.open下载
      // #ifdef H5
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      uni.showToast({
        title: '开始下载',
        icon: 'success'
      });
      // #endif
      
      // 在APP环境下，使用uni.downloadFile
      // #ifndef H5
      uni.downloadFile({
        url: fileUrl,
        success: (downloadRes) => {
          if (downloadRes.statusCode === 200) {
            uni.saveFile({
              tempFilePath: downloadRes.tempFilePath,
              success: () => {
                uni.showToast({
                  title: '下载成功',
                  icon: 'success'
                });
              },
              fail: () => {
                uni.showToast({
                  title: '保存失败',
                  icon: 'none'
                });
              }
            });
          } else {
            uni.showToast({
              title: '下载失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          uni.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      });
      // #endif
    },
    
    async likePost(post) {
      try {
        const res = await Database.likePost(post.pid);
        if (res.success) {
          // 更新本地点赞状态和数量
          post.is_liked = res.is_liked;
          post.likes = res.likes_count;
          uni.showToast({ 
            title: res.is_liked ? '点赞成功' : '取消点赞', 
            icon: 'success' 
          });
        } else {
          uni.showToast({ title: res.message || '操作失败', icon: 'none' });
        }
      } catch (error) {
        console.error('点赞操作失败:', error);
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },
    
    goTo(action) {
      const map = {
        searchPost: '/pages/community/searchPost',
        manage: '/pages/community/manage',
        createPost: '/pages/community/createPost'
      };
      if (map[action]) {
        uni.navigateTo({ url: map[action] });
      }
    },
    
    goToPersonalSpace(uid) {
      uni.navigateTo({
        url: `/pages/personalSpace/index?uid=${uid}`
      });
    }
  }
}
</script>

<style scoped>
.community-container {
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
  text-align: center;
  margin-bottom: 60rpx;
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

.content {
  max-width: 800rpx;
  margin: 0 auto;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 60rpx;
}
.action-row {
  display: flex;
  gap: 24rpx;
}
.action-card {
  flex: 1;
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.action-icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.action-text {
  font-size: 28rpx;
  color: #2c3e50;
}

.section {
  margin-bottom: 60rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 32rpx;
}

.topic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.topic-item {
  background: white;
  border-radius: 24rpx;
  padding: 16rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.topic-tag {
  display: block;
  font-size: 24rpx;
  color: #9b59b6;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.topic-count {
  display: block;
  font-size: 20rpx;
  color: #7f8c8d;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.post-item {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #e0e0e0;
}

.user-info {
  flex: 1;
}

.username {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.post-time {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
}

.post-content {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.post-actions {
  display: flex;
  gap: 48rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-icon {
  font-size: 24rpx;
}

.action-count {
  font-size: 24rpx;
  color: #7f8c8d;
}

.tab-bar {
  display: flex;
  gap: 40rpx;
  margin-bottom: 24rpx;
}
.tab-bar text {
  font-size: 32rpx;
  color: #888;
  padding-bottom: 8rpx;
  border-bottom: 4rpx solid transparent;
}
.tab-bar .active {
  color:#2ca163;
  border-bottom: 4rpx solid #2ca163;
}
.post-images {
  display: flex;
  gap: 12rpx;
  margin: 12rpx 0;
}
.post-img-preview {
  height: 120rpx;     
  width: 120rpx;   
  border-radius: 8rpx;
  background: #eee;
}

.post-files {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin: 12rpx 0;
}

.post-file-item {
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-file-item:active {
  background: #e0e0e0;
}

.file-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
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

.loading-spinner.small {
  width: 40rpx;
  height: 40rpx;
  border-width: 3rpx;
  margin-bottom: 12rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

.load-more-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
  gap: 16rpx;
}

.no-more-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
}

.no-more-text {
  font-size: 24rpx;
  color: #999;
}
</style>
