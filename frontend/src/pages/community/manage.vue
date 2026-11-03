<template>
  <view class="manage-container">
    <view class="header-bar">
      <text class="back-btn" @click="goBack">< &emsp;</text>
      <view class="section-title">发布管理</view>
    </view>
    
    <!-- 统计信息 -->
    <view class="stats-section">
      <view class="stat-item">
        <text class="stat-number">{{ totalPosts }}</text>
        <text class="stat-label">总动态</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ totalLikes }}</text>
        <text class="stat-label">总点赞</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ totalComments }}</text>
        <text class="stat-label">总评论</text>
      </view>
    </view>
    
    <!-- 筛选和排序 -->
    <view class="filter-section">
      <view class="sort-options">
        <text 
          :class="{active: sortBy === 'time'}" 
          @click="changeSort('time')"
        >
          按时间
        </text>
        <text 
          :class="{active: sortBy === 'likes'}" 
          @click="changeSort('likes')"
        >
          按热度
        </text>
      </view>
      <view class="privacy-filter">
        <text 
          :class="{active: privacyFilter === 'all'}" 
          @click="changePrivacyFilter('all')"
        >
          全部
        </text>
        <text 
          :class="{active: privacyFilter === 'public'}" 
          @click="changePrivacyFilter('public')"
        >
          公开
        </text>
        <text 
          :class="{active: privacyFilter === 'private'}" 
          @click="changePrivacyFilter('private')"
        >
          私密
        </text>
      </view>
    </view>
    
    <!-- 动态列表 -->
    <view class="posts-section">
      <view v-if="loading" class="loading">加载中...</view>
      
      <view v-else-if="myPosts.length === 0" class="no-posts">
        <text class="no-posts-text">还没有发布任何动态</text>
        <text class="no-posts-tip">去发布第一条动态吧</text>
        <button class="create-btn" @click="goToCreate">发布动态</button>
      </view>
      
      <view v-else class="post-list">
        <view 
          v-for="post in myPosts" 
          :key="post.pid" 
          class="post-item"
        >
          <view class="post-header">
            <view class="post-info">
              <text class="post-time">{{ formatTime(post.created_time) }}</text>
              <view class="post-stats">
                <text class="stat">👍 {{ post.likes || 0 }}</text>
                <text class="stat">💬 {{ post.comments || 0 }}</text>
                <text class="privacy-tag" :class="post.is_public ? 'public' : 'private'">
                  {{ post.is_public ? '公开' : '私密' }}
                </text>
              </view>
            </view>
            <view class="post-actions">
              <button class="action-btn toggle" @click="togglePrivacy(post)">
  {{ post.is_public ? '设私密' : '设公开' }}
</button>
              <button class="action-btn delete" @click="deletePost(post.pid)">删除</button>
            </view>
          </view>
          
          <text class="post-content">{{ post.text_content }}</text>
          
          <view v-if="post.image_urls && post.image_urls.length" class="post-images">
            <image 
              v-for="(img, idx) in post.image_urls" 
              :key="idx" 
              :src="getImageUrl(img)" 
              class="post-img-preview"
            />
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore && myPosts.length > 0" class="load-more">
        <button 
          class="load-more-btn" 
          @click="loadMore"
          :disabled="loading"
        >
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </view>
    </view>
  </view>
</template>
  
<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js';

export default {
  data() {
    return {
      myPosts: [],
      loading: false,
      sortBy: 'time',
      privacyFilter: 'all',
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      hasMore: true,
      offset: 0,
      limit: 20
    }
  },
  onLoad() {
    this.fetchMyPosts();
  },
  onShow() {
    // 每次显示页面时刷新数据
    this.fetchMyPosts();
  },
  methods: {
    goBack() {
      uni.switchTab({ url: '/pages/community/index' });
    },
    
    async fetchMyPosts() {
      this.loading = true;
      this.offset = 0;
      
      try {
        const currentUser = uni.getStorageSync('currentUser');
        if (!currentUser || !currentUser.uid) {
          uni.showToast({ title: '请先登录', icon: 'none' });
          return;
        }
        
        const res = await Database.getUserPosts(
          currentUser.uid, 
          this.sortBy, 
          this.limit, 
          this.offset
        );
        
        if (res.success) {
          let posts = res.posts || [];
          
          // 根据隐私设置筛选
          if (this.privacyFilter !== 'all') {
            const isPublic = this.privacyFilter === 'public';
            posts = posts.filter(post => post.is_public === isPublic);
          }
          
          this.myPosts = posts;
          this.hasMore = res.has_more || false;
          this.offset = this.myPosts.length;
          
          // 计算统计数据
          this.calculateStats();
        } else {
          uni.showToast({ title: res.message || '获取动态失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取我的动态失败:', error);
        uni.showToast({ title: '获取动态失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    async loadMore() {
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      
      try {
        const currentUser = uni.getStorageSync('currentUser');
        const res = await Database.getUserPosts(
          currentUser.uid, 
          this.sortBy, 
          this.limit, 
          this.offset
        );
        
        if (res.success) {
          let newPosts = res.posts || [];
          
          // 根据隐私设置筛选
          if (this.privacyFilter !== 'all') {
            const isPublic = this.privacyFilter === 'public';
            newPosts = newPosts.filter(post => post.is_public === isPublic);
          }
          
          this.myPosts = [...this.myPosts, ...newPosts];
          this.hasMore = res.has_more || false;
          this.offset = this.myPosts.length;
        }
      } catch (error) {
        console.error('加载更多失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async changeSort(sortBy) {
      if (this.sortBy === sortBy) return;
      
      this.sortBy = sortBy;
      await this.fetchMyPosts();
    },
    
    async changePrivacyFilter(filter) {
      if (this.privacyFilter === filter) return;
      
      this.privacyFilter = filter;
      await this.fetchMyPosts();
    },
    
    calculateStats() {
      this.totalPosts = this.myPosts.length;
      this.totalLikes = this.myPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
      this.totalComments = this.myPosts.reduce((sum, post) => sum + (post.comments || 0), 0);
    },
    
    async togglePrivacy(post) {
      try {
        const newPrivacy = !post.is_public;
        const result = await Database.updatePostPrivacy(post.pid, newPrivacy);
        
        if (result.success) {
          // 更新本地数据
          post.is_public = newPrivacy;
          uni.showToast({ 
            title: newPrivacy ? '已设为公开' : '已设为私密', 
            icon: 'success' 
          });
        } else {
          uni.showToast({ 
            title: result.message || '更新失败', 
            icon: 'none' 
          });
        }
      } catch (error) {
        console.error('切换隐私设置失败:', error);
        uni.showToast({ title: '更新失败', icon: 'none' });
      }
    },
    
    async deletePost(pid) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条动态吗？删除后无法恢复。',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await Database.deletePost(pid);
              if (result.success) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                // 从列表中移除
                this.myPosts = this.myPosts.filter(post => post.pid !== pid);
                this.calculateStats();
              } else {
                uni.showToast({ title: result.message || '删除失败', icon: 'none' });
              }
            } catch (error) {
              console.error('删除动态失败:', error);
              uni.showToast({ title: '删除失败', icon: 'none' });
            }
          }
        }
      });
    },
    
    goToCreate() {
      uni.navigateTo({ url: '/pages/community/createPost' });
    },
    
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) {
        return '刚刚';
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
      } else {
        return time.split('T')[0];
      }
    },
    
    getImageUrl(imageUrl) {
      if (!imageUrl) return '';
      if (imageUrl.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${imageUrl}`;
      }
      return imageUrl;
    }
  }
}
</script>
  
<style scoped>
.manage-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 40rpx;
  box-sizing: border-box;
}

.header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.back-btn {
  font-size: 28rpx;
  margin-right: 24rpx;
  color: #2ca163;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #2c3e50;
}

.stats-section {
  display: flex;
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #2ca163;
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
}

.filter-section {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.sort-options, .privacy-filter {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.privacy-filter {
  margin-bottom: 0;
}

.sort-options text, .privacy-filter text {
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #888;
  background: #f8f9fa;
  border: 2rpx solid transparent;
}

.sort-options .active, .privacy-filter .active {
  color: #2ca163;
  background: #e8f0fe;
  border-color: #2ca163;
}

.posts-section {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.loading, .no-posts {
  text-align: center;
  padding: 60rpx 0;
}

.loading {
  font-size: 28rpx;
  color: #2ca163;
}

.no-posts-text {
  display: block;
  font-size: 32rpx;
  color: #7f8c8d;
  margin-bottom: 16rpx;
}

.no-posts-tip {
  display: block;
  font-size: 24rpx;
  color: #bdc3c7;
  margin-bottom: 32rpx;
}

.create-btn {
  width: 200rpx;
  height: 60rpx;
  background: #2ca163;
  color: white;
  border: none;
  border-radius: 30rpx;
  font-size: 24rpx;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.post-item {
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 2rpx solid #e9ecef;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.post-info {
  flex: 1;
}

.post-time {
  display: block;
  font-size: 20rpx;
  color: #7f8c8d;
  margin-bottom: 8rpx;
}

.post-stats {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.stat {
  font-size: 20rpx;
  color: #7f8c8d;
}

.privacy-tag {
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-size: 18rpx;
  font-weight: bold;
}

.privacy-tag.public {
  background: #d4edda;
  color: #155724;
}

.privacy-tag.private {
  background: #f8d7da;
  color: #721c24;
}

.post-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  font-size: 20rpx;
  border: none;
}

.action-btn.toggle {
  background: #e8f0fe;
  color: #2ca163;
  border: 2rpx solid #2ca163;
}

.action-btn.toggle:hover {
  background: #d1e7ff;
}

.action-btn.delete {
  background: #f8d7da;
  color: #721c24;
}

.post-content {
  display: block;
  font-size: 26rpx;
  color: #2c3e50;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.post-images {
  display: flex;
  gap: 8rpx;
  margin: 12rpx 0;
}

.post-img-preview {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  background: #eee;
}

.load-more {
  text-align: center;
  margin-top: 32rpx;
}

.load-more-btn {
  width: 200rpx;
  height: 60rpx;
  background: #2ca163;
  color: white;
  border: none;
  border-radius: 30rpx;
  font-size: 24rpx;
}

.load-more-btn:disabled {
  background: #bdc3c7;
}
</style>