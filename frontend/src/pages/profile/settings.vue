<template>
  <view class="settings-container">
    <view class="header">
      <view class="nav-bar">
        <view class="nav-back" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="page-title">设置</text>
        <view class="nav-placeholder"></view>
      </view>
    </view>
    
    <view class="content">
      <!-- 通知设置 -->
      <view class="section">
        <view class="section-title">通知设置</view>
        <view class="setting-group">
          <!-- 通知权限状态 -->
          <view class="setting-item" @click="requestNotificationPermission">
            <view class="setting-info">
              <text class="setting-name">消息通知</text>
              <text class="setting-desc">{{ getNotificationStatusText }}</text>
            </view>
            <view class="setting-action">
              <text class="action-text" v-if="!notificationPermissionGranted">设置</text>
              <text class="status-text" v-else>已开启</text>
            </view>
          </view>
          
          <!-- 通知测试 -->
          <view class="setting-item" @click="testNotification">
            <view class="setting-info">
              <text class="setting-name">测试通知</text>
              <text class="setting-desc">发送一条测试通知</text>
            </view>
            <view class="setting-action">
              <text class="action-text">测试</text>
            </view>
          </view>
          
          <!-- 手动检查消息 -->
          <view class="setting-item" @click="manualCheckMessages">
            <view class="setting-info">
              <text class="setting-name">检查新消息</text>
              <text class="setting-desc">手动检查是否有新消息</text>
            </view>
            <view class="setting-action">
              <text class="action-text">检查</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 缓存设置 -->
      <view class="section">
        <view class="section-title">缓存设置</view>
        <view class="setting-group">
          <view class="setting-item" @click="clearCache">
            <view class="setting-info">
              <text class="setting-name">清除缓存</text>
              <text class="setting-desc">清除应用缓存数据</text>
            </view>
            <view class="setting-action">
              <text class="action-text">清除</text>
            </view>
          </view>
          
          <view class="setting-item" @click="toggleCacheStats">
            <view class="setting-info">
              <text class="setting-name">缓存统计</text>
              <text class="setting-desc">查看缓存使用情况</text>
            </view>
            <view class="setting-action">
              <text class="action-text">{{ showCacheStats ? '隐藏' : '查看' }}</text>
            </view>
          </view>
          
          <!-- 缓存统计信息 -->
          <view v-if="showCacheStats" class="cache-stats">
            <text class="stats-text">{{ cacheStatsText }}</text>
          </view>
        </view>
      </view>
      
      
    </view>
  </view>
</template>

<script>
import ChatCache from '@/utils/chatCache.js'
import backgroundService from '@/utils/backgroundService.js'
import notificationManager from '@/utils/notificationManager.js'
import ChatNavigation from '@/utils/chatNavigation.js'

export default {
  data() {
    return {
      notificationPermissionGranted: false,
      showCacheStats: false,
      cacheStatsText: ''
    }
  },
  onLoad() {
    // 检查通知权限状态
    try {
      const status = notificationManager.getPermissionStatus()
      this.notificationPermissionGranted = status.permissionStatus === 'granted'
    } catch (error) {
      this.notificationPermissionGranted = false
    }
  },
  onShow() {
    // 检查通知权限状态
    try {
      const status = notificationManager.getPermissionStatus()
      this.notificationPermissionGranted = status.permissionStatus === 'granted'
    } catch (error) {
      this.notificationPermissionGranted = false
    }
  },
  computed: {
    /**
     * 获取通知状态文本
     */
    getNotificationStatusText() {
      return notificationManager.getPermissionStatusText()
    }
  },
  methods: {
    goBack() {
      uni.switchTab({
        url: '/pages/profile/index'
      })
    },
    
    /**
     * 检查通知权限状态
     */
    async checkNotificationPermission() {
      try {
        const status = notificationManager.getPermissionStatus()
        this.notificationPermissionGranted = status.permissionStatus === 'granted'
      } catch (error) {
        this.notificationPermissionGranted = false
      }
    },

    /**
     * 请求通知权限
     */
    async requestNotificationPermission() {
      if (this.notificationPermissionGranted) {
        uni.showToast({
          title: '通知权限已开启',
          icon: 'success'
        })
        return
      }
      
      try {
        const granted = await notificationManager.requestPermission()
        if (granted) {
          this.notificationPermissionGranted = true
          uni.showToast({
            title: '通知权限已授予',
            icon: 'success'
          })
        } else {
          // 显示权限说明弹窗
          const confirmed = await notificationManager.showPermissionDialog()
          if (confirmed) {
            uni.showToast({
              title: '请前往系统设置开启通知权限',
              icon: 'none',
              duration: 3000
            })
          }
        }
      } catch (error) {
        uni.showToast({
          title: '请求通知权限失败',
          icon: 'none'
        })
      }
    },

    /**
     * 测试通知功能
     */
    async testNotification() {
      try {
        await notificationManager.sendTestNotification()
        uni.showToast({
          title: '测试通知已发送',
          icon: 'success'
        })
      } catch (error) {
        uni.showToast({
          title: '发送测试通知失败',
          icon: 'none'
        })
      }
    },

    /**
     * 手动检查新消息
     */
    async manualCheckMessages() {
      try {
        uni.showLoading({
          title: '检查新消息...'
        })
        
        await backgroundService.manualCheck()
        
        uni.hideLoading()
        uni.showToast({
          title: '检查完成',
          icon: 'success'
        })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({
          title: '检查消息失败',
          icon: 'none'
        })
      }
    },

    /**
     * 清除缓存
     */
    clearCache() {
      uni.showModal({
        title: '确认清除',
        content: '确定要清除所有缓存数据吗？这将重新加载所有数据。',
        success: (res) => {
          if (res.confirm) {
            try {
              // 1. 清除 ChatCache 管理的缓存
              ChatCache.clearAllCache()
              
              // 2. 获取所有存储键并清除缓存
              try {
                const storageInfo = uni.getStorageInfoSync()
                if (storageInfo && storageInfo.keys) {
                  // 需要保留的键（登录信息等，可根据需求调整）
                  const preserveKeys = ['jwt_token', 'currentUser', 'savedLogin']
                  
                  storageInfo.keys.forEach(key => {
                    // 保留登录信息，清除其他所有缓存
                    if (!preserveKeys.includes(key)) {
                      try {
                        uni.removeStorageSync(key)
                      } catch (e) {
                        console.warn(`清除缓存键失败: ${key}`, e)
                      }
                    }
                  })
                }
              } catch (error) {
                console.warn('获取存储信息失败:', error)
              }
              
              // 3. 清除 sessionStorage（浏览器环境）
              try {
                // #ifdef H5
                if (typeof window !== 'undefined' && window.sessionStorage) {
                  window.sessionStorage.clear()
                }
                // #endif
              } catch (error) {
                console.warn('清除 sessionStorage 失败:', error)
              }
              
              uni.showToast({
                title: '缓存已清除',
                icon: 'success'
              })
              
              // 触发消息列表刷新
              uni.$emit('refreshMessageList')
            } catch (error) {
              console.error('清除缓存失败:', error)
              uni.showToast({
                title: '清除缓存失败',
                icon: 'none'
              })
            }
          }
        }
      })
    },

    /**
     * 切换缓存统计显示
     */
    toggleCacheStats() {
      this.showCacheStats = !this.showCacheStats
      if (this.showCacheStats) {
        this.updateCacheStats()
      }
    },

    /**
     * 更新缓存统计信息
     */
    updateCacheStats() {
      const stats = ChatCache.getCacheStats()
      const statsArray = []
      
      Object.entries(stats).forEach(([key, value]) => {
        if (value.count > 0) {
          const status = value.isValid ? '✅' : '❌'
          statsArray.push(`${key}: ${value.count} ${status}`)
        }
      })
      
      this.cacheStatsText = statsArray.length > 0 ? statsArray.join(' | ') : '暂无缓存数据'
    }
  }
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  background: white;
  border-bottom: 1rpx solid #e0e0e0;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.nav-back:active {
  background-color: #f0f0f0;
}

.back-icon {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
}

.page-title {
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
}

.nav-placeholder {
  width: 60rpx;
}

.content {
  padding: 40rpx;
}

.section {
  margin-bottom: 60rpx;
}

.section-title {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 32rpx;
  padding-left: 8rpx;
}

.setting-group {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:active {
  background-color: #f8f9fa;
}

.setting-info {
  flex: 1;
}

.setting-name {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.setting-desc {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
  line-height: 1.4;
}

.setting-action {
  margin-left: 32rpx;
}

.action-text {
  font-size: 24rpx;
  color: #55B99E;
  padding: 8rpx 16rpx;
  background: #e3f2fd;
  border-radius: 16rpx;
  font-weight: 500;
}

.status-text {
  font-size: 24rpx;
  color: #27ae60;
  padding: 8rpx 16rpx;
  background: #e8f5e8;
  border-radius: 16rpx;
  font-weight: 500;
}

.cache-stats {
  padding: 24rpx 32rpx;
  background: #f5f5f5;
  border-top: 1rpx solid #e0e0e0;
}

.stats-text {
  font-size: 22rpx;
  color: #666;
  line-height: 1.5;
}
</style>
