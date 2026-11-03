<template>
  <view class="search-container">
    <view class="header-bar">
      <text class="back-btn" @click="goBack">< &emsp;</text>
      <view class="section-title">搜索动态</view>
    </view>
    
    <!-- 搜索框 -->
    <view class="search-box">
      <input 
        v-model="searchKeyword" 
        class="search-input" 
        placeholder="输入关键词搜索动态..."
        @confirm="performSearch"
        @input="onSearchInput"
        maxlength="20"
      />
      <button class="search-btn" @click="performSearch">搜索</button>
    </view>
    
    <!-- 搜索历史 -->
    <view v-if="searchHistory.length > 0 && !hasSearched" class="search-history">
      <view class="history-title">搜索历史</view>
      <view class="history-tags">
        <text 
          v-for="(keyword, index) in searchHistory" 
          :key="index" 
          class="history-tag"
          @click="searchFromHistory(keyword)"
        >
          {{ keyword }}
        </text>
      </view>
    </view>
    
    <!-- 搜索结果 -->
    <view v-if="hasSearched" class="search-results">
      <view class="results-header">
        <text class="results-count">找到 {{ totalResults }} 条相关动态</text>
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
      </view>
      
      <view v-if="loading" class="loading">搜索中...</view>
      
      <view v-else-if="searchResults.length === 0" class="no-results">
        <text class="no-results-text">没有找到相关动态</text>
        <text class="no-results-tip">试试其他关键词吧</text>
      </view>
      
      <view v-else class="post-list">
        <view 
          v-for="post in searchResults" 
          :key="post.pid" 
          class="post-item" 
          @click="goToPost(post.pid)"
        >
          <view class="post-header">
            <image class="avatar" :src="getAvatarUrl(post.avatar)" mode="aspectFill"></image>
            <view class="user-info">
              <text class="username">{{ post.username || '未命名' }}</text>
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
            />
          </view>
          <view class="post-actions">
            <view class="action-btn" @click.stop="likePost(post.pid)">
              <text class="action-icon">👍</text>
              <text class="action-count">{{ post.likes || 0 }}</text>
            </view>
            <view class="action-btn">
              <text class="action-icon">💬</text>
              <text class="action-count">{{ post.comments || 0 }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore && searchResults.length > 0" class="load-more">
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
      searchKeyword: '',
      searchResults: [],
      searchHistory: [],
      hasSearched: false,
      loading: false,
      sortBy: 'time',
      totalResults: 0,
      hasMore: true,
      offset: 0,
      limit: 20
    }
  },
  onLoad() {
    this.loadSearchHistory();
  },
  methods: {
    goBack() {
      uni.switchTab({ url: '/pages/community/index' });
    },
    
    onSearchInput(e) {
      this.searchKeyword = e.detail.value;
    },
    
    async performSearch() {
      if (!this.searchKeyword.trim()) {
        uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
        return;
      }
      
      this.hasSearched = true;
      this.loading = true;
      this.offset = 0;
      this.searchResults = [];
      
      try {
        const res = await Database.searchPosts(
          this.searchKeyword.trim(), 
          this.sortBy, 
          this.limit, 
          this.offset
        );
        
        if (res.success) {
          this.searchResults = res.posts || [];
          this.totalResults = res.total || 0;
          this.hasMore = res.has_more || false;
          this.offset = this.searchResults.length;
          
          // 保存搜索历史
          this.saveSearchHistory(this.searchKeyword.trim());
        } else {
          uni.showToast({ title: res.message || '搜索失败', icon: 'none' });
        }
      } catch (error) {
        console.error('搜索失败:', error);
        uni.showToast({ title: '搜索失败，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    async loadMore() {
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      
      try {
        const res = await Database.searchPosts(
          this.searchKeyword.trim(), 
          this.sortBy, 
          this.limit, 
          this.offset
        );
        
        if (res.success) {
          this.searchResults = [...this.searchResults, ...(res.posts || [])];
          this.hasMore = res.has_more || false;
          this.offset = this.searchResults.length;
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
      this.offset = 0;
      this.searchResults = [];
      
      await this.performSearch();
    },
    
    searchFromHistory(keyword) {
      this.searchKeyword = keyword;
      this.performSearch();
    },
    
    loadSearchHistory() {
      const history = uni.getStorageSync('search_history') || [];
      this.searchHistory = history.slice(0, 10); // 最多显示10条历史
    },
    
    saveSearchHistory(keyword) {
      let history = uni.getStorageSync('search_history') || [];
      
      // 移除重复项
      history = history.filter(item => item !== keyword);
      
      // 添加到开头
      history.unshift(keyword);
      
      // 限制历史记录数量
      history = history.slice(0, 20);
      
      uni.setStorageSync('search_history', history);
      this.searchHistory = history.slice(0, 10);
    },
    
    goToPost(pid) {
      uni.navigateTo({ url: `/pages/community/postDetail?pid=${pid}` });
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
    
    async likePost(pid) {
      try {
        const res = await Database.likePost(pid);
        if (res.success) {
          const post = this.searchResults.find(p => p.pid === pid);
          if (post) {
            post.likes = (post.likes || 0) + 1;
          }
          uni.showToast({ title: '点赞成功', icon: 'success' });
        } else {
          uni.showToast({ title: res.message || '点赞失败', icon: 'none' });
        }
      } catch (error) {
        console.error('点赞失败:', error);
        uni.showToast({ title: '点赞失败', icon: 'none' });
      }
    }
  }
}
</script>
  
<style scoped>
.search-container {
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

.search-box {
  display: flex;
  gap: 16rpx;
  margin-bottom: 32rpx;
}

.search-input {
  flex: 1;
  height: 80rpx;
  padding: 0 24rpx;
  border: 2rpx solid #e9ecef;
  border-radius: 40rpx;
  background: white;
  font-size: 28rpx;
  box-sizing: border-box;
}

.search-btn {
  width: 120rpx;
  height: 80rpx;
  background: #2ca163;
  color: white;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-history {
  margin-bottom: 32rpx;
}

.history-title {
  font-size: 28rpx;
  color: #7f8c8d;
  margin-bottom: 16rpx;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.history-tag {
  padding: 12rpx 24rpx;
  background: white;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: #2ca163;
  border: 2rpx solid #e9ecef;
}

.search-results {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.results-count {
  font-size: 28rpx;
  color: #7f8c8d;
}

.sort-options {
  display: flex;
  gap: 24rpx;
}

.sort-options text {
  font-size: 24rpx;
  color: #888;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  background: #f8f9fa;
}

.sort-options .active {
  color: #2ca163;
  background: #e8f0fe;
}

.loading, .no-results {
  text-align: center;
  padding: 60rpx 0;
}

.loading {
  font-size: 28rpx;
  color: #2ca163;
}

.no-results-text {
  display: block;
  font-size: 32rpx;
  color: #7f8c8d;
  margin-bottom: 16rpx;
}

.no-results-tip {
  display: block;
  font-size: 24rpx;
  color: #bdc3c7;
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
  align-items: center;
  margin-bottom: 16rpx;
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  background: #e0e0e0;
}

.user-info {
  flex: 1;
}

.username {
  display: block;
  font-size: 24rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 4rpx;
}

.post-time {
  display: block;
  font-size: 20rpx;
  color: #7f8c8d;
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

.post-actions {
  display: flex;
  gap: 32rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.action-icon {
  font-size: 20rpx;
}

.action-count {
  font-size: 20rpx;
  color: #7f8c8d;
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