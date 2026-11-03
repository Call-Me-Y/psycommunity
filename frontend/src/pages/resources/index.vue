<template>
  <view class="resources-container">
    <view class="header">
      <text class="page-title">测评</text>
      <text class="subtitle">问卷和量表</text>
    </view>
    
    <!-- 分享弹窗 -->
    <ShareDialog 
      :visible="showShareDialog"
      share-type="survey"
      :share-id="selectedResourceId"
      :share-title="selectedResourceTitle"
      @close="showShareDialog = false"
    />
    
    <view class="content">
      <!-- 搜索栏 -->
      <view class="search-section">
        <view class="search-container">
          <input 
            class="search-input" 
            placeholder="搜索资源..." 
            v-model="searchKeyword"
            @input="onSearch"
          />
          <view v-if="isAdmin" class="add-button" @click="addResource">
            <text class="add-icon">+</text>
          </view>
        </view>
      </view>
      

      
      <!-- 推荐资源 -->
      <view class="section">
        <text class="section-title">搜索/推荐</text>
        
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <text class="loading-text">正在加载测评...</text>
        </view>
        
        <!-- 资源列表 -->
        <view v-else class="resource-list">
          <view class="resource-card" v-for="resource in filteredResources" :key="resource.id">
            <image class="resource-image" :src="resource.image" mode="aspectFill" @error="resource.image = '/static/cover.jpg'" @click="viewResource(resource)"></image>
            <view class="resource-info" @click="viewResource(resource)">
              <text class="resource-title">{{ resource.title }}</text>
              <text class="resource-desc">{{ resource.description }}</text>
              <view class="resource-meta">
                <text class="resource-duration" v-if="resource.duration">{{ resource.duration }}</text>
              </view>
            </view>
            <!-- 管理员删除按钮 -->
            <view v-if="isAdmin" class="delete-button" @click.stop="confirmDelete(resource)">
              <text class="delete-icon">×</text>
            </view>
            <!-- 分享按钮 - 固定在右下角 -->
            <view class="share-button-fixed" @click.stop="shareResource(resource)">
              <text class="share-icon">📤</text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="!loading && filteredResources.length === 0" class="empty-container">
          <text class="empty-text">暂无测评数据</text>
        </view>
      </view>
      

    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js'
import ShareDialog from '@/components/ShareDialog.vue'
import { installMousePullRefresh, removeMousePullRefresh } from '@/utils/mousePullRefresh.js'

export default {
  components: {
    ShareDialog
  },
  data() {
    return {
      searchKeyword: '',
      isAdmin: false,
      surveys: [],
      loading: false,
      showShareDialog: false,
      selectedResourceId: null,
      selectedResourceTitle: '',
      
      // 保留原有的示例数据作为备用
      resources: [
        {
          id: 1,
          title: '暂时还没有测评呢',
          description: '可能是网络原因，也有可能是管理员没添加，或者删了',
          image: '/static/resource1.png',
        },
        {
          id: 2,
          title: '联网之后才可以获取测评列表哦',
          description: '这些都是示例测评，没有什么用',
          image: '/static/resource2.png',
        },
        {
          id: 3,
          title: '总之请多支持我们的项目',
          description: '积极参与和认真填写就可以啦',
          image: '/static/resource3.png',
        },
        {
          id: 4,
          title: '本系统很脆，请不要随便攻击',
          description: '不过程序员还是废了很大力气去保证安全性的',
          image: '/static/resource4.png',
        },
        {
          id: 5,
          title: '既然看到这里了告诉你个秘密',
          description: '其实文字输入类题目也可能影响评分哦',
          image: '/static/resource5.png',
        }
      ]
    }
  },
  computed: {
    filteredResources() {
      // 优先显示真实的测评数据
      const dataToFilter = this.surveys.length > 0 ? this.surveys : this.resources;
      
      if (!this.searchKeyword) {
        return dataToFilter;
      }
      return dataToFilter.filter(resource => 
        resource.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        resource.description.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );
    }
  },
  onLoad() {
    this.checkAdminStatus()
    this.loadSurveys()
  },
  onShow() { this.$nextTick(() => installMousePullRefresh(this)) },
  onHide() { removeMousePullRefresh(this) },
  onUnload() { removeMousePullRefresh(this) },
  async onPullDownRefresh() {
    try { await Promise.all([this.checkAdminStatus(), this.loadSurveys()]) }
    finally { uni.stopPullDownRefresh() }
  },
  methods: {
    async checkAdminStatus() {
      try {
        const userRes = await Database.verifyToken()
        if (userRes.success) {
          this.isAdmin = userRes.user.type === 0 // 管理员类型为0
        }
      } catch (error) {
        console.error('检查管理员状态失败:', error)
      }
    },

    async loadSurveys() {
      try {
        this.loading = true
        const result = await Database.getSurveys()
        if (result.success) {
          // 转换数据格式以匹配现有的UI结构
          this.surveys = result.surveys.map(survey => ({
            id: survey.sid,
            title: survey.name,
            description: survey.intro || '暂无简介',
            image: this.getImageUrl(survey.cover),
            info: survey.info,
            created_time: survey.created_time
          }))
        } else {
          console.error('获取测评列表失败:', result.message)
        }
      } catch (error) {
        console.error('加载测评失败:', error)
      } finally {
        this.loading = false
      }
    },

    getImageUrl(imagePath) {
      if (!imagePath) return '/static/cover.jpg'
      if (imagePath.startsWith('http')) return imagePath
      if (imagePath.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${imagePath}`
      }
      return '/static/cover.jpg'
    },
    onSearch() {
      // 搜索功能已通过计算属性实现
    },
    selectCategory(category) {
      uni.showToast({
        title: `${category.name}分类功能开发中`,
        icon: 'none'
      });
    },
    viewResource(resource) {uni.navigateTo({
          url: `/pages/survey/detail?id=${resource.id}`
        });
    },
    addResource() {
      if (!this.isAdmin) {
        uni.showToast({
          title: '权限不足',
          icon: 'none'
        });
        return;
      }
      
      uni.navigateTo({
        url: '/pages/survey/create'
      });
    },

    shareResource(resource) {
      this.selectedResourceId = resource.id;
      this.selectedResourceTitle = resource.title;
      this.showShareDialog = true;
    },

    confirmDelete(resource) {
      if (!this.isAdmin) {
        uni.showToast({
          title: '权限不足',
          icon: 'none'
        });
        return;
      }

      uni.showModal({
        title: '确认删除',
        content: `确定要删除测评"${resource.title}"吗？此操作不可撤销。`,
        confirmText: '删除',
        confirmColor: '#e74c3c',
        success: (res) => {
          if (res.confirm) {
            this.deleteResource(resource);
          }
        }
      });
    },

    async deleteResource(resource) {
      try {
        uni.showLoading({
          title: '删除中...'
        });

        const result = await Database.deleteSurvey(resource.id);
        
        uni.hideLoading();

        if (result.success) {
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 重新加载测评列表
          this.loadSurveys();
        } else {
          uni.showToast({
            title: result.message || '删除失败',
            icon: 'none'
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('删除测评失败:', error);
        uni.showToast({
          title: '删除失败，请重试',
          icon: 'none'
        });
      }
    }
  }
}
</script>

<style scoped>
.resources-container {
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

.search-section {
  margin-bottom: 60rpx;
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
  margin-bottom: 60rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 32rpx;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
}

.category-card {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.category-icon {
  display: block;
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.category-name {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.category-count {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.resource-card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  gap: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  position: relative;
}

.resource-image {
  width: 280rpx;
  height: 210rpx;
  border-radius: 12rpx;
  background: #e0e0e0;
}

.resource-info {
  flex: 1;
}

.resource-title {
  display: block;
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.resource-desc {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
  line-height: 1.4;
  margin-bottom: 16rpx;
}

.resource-meta {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.resource-duration {
  font-size: 20rpx;
  color: #7f8c8d;
}

.resource-stats {
  display: flex;
  gap: 24rpx;
}

.stat-item {
  font-size: 20rpx;
  color: #7f8c8d;
}

.progress-card {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.progress-title {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
}

.progress-percentage {
  font-size: 32rpx;
  color: #27ae60;
  font-weight: bold;
}

.progress-bar {
  width: 100%;
  height: 12rpx;
  background: #e0e0e0;
  border-radius: 6rpx;
  margin-bottom: 32rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60 0%, #2ecc71 100%);
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #7f8c8d;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #7f8c8d;
}

.delete-button {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 60rpx;
  height: 60rpx;
  background: #e74c3c;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(231, 76, 60, 0.3);
  z-index: 10;
}

.delete-button:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(231, 76, 60, 0.4);
}

.delete-icon {
  font-size: 32rpx;
  color: white;
  font-weight: bold;
  line-height: 1;
}

.share-button-fixed {
  position: absolute;
  bottom: 16rpx;
  right: 16rpx;
  width: 60rpx;
  height: 60rpx;
  background: #55B99E;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(52, 152, 219, 0.3);
  z-index: 10;
}

.share-button-fixed:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(52, 152, 219, 0.4);
}

.share-icon {
  font-size: 28rpx;
  color: white;
  font-weight: bold;
  line-height: 1;
}
</style>
