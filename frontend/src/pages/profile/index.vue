<template>
  <view class="profile-container">
    <view class="header">
      <text class="page-title">个人</text>
      <text class="subtitle">个人中心</text>
    </view>
    
    <view class="content">
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="user-header">
          <image class="user-avatar" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill"></image>
          <view class="user-info">
            <text class="user-name">{{ userInfo.name }}</text>
            <text class="user-role">{{ userInfo.role }}</text>
          </view>
          <view class="edit-btn" @click="editProfile">
            <text class="edit-icon">✏️</text>
          </view>
        </view>
        <view class="user-space" @click="goToPersonalSpace">
          <text class="space-icon">🏠</text>
          <text class="space-text">个人空间</text>
          <text class="space-arrow">></text>
        </view>
      </view>
      
      <!-- 功能菜单 -->
      <view class="menu-section">
        <view class="menu-group">
          <view class="menu-item" @click="goToChangePassword">
            <text class="menu-icon">🔒</text>
            <text class="menu-title">账号安全</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @click="navigateTo('/pages/profile/settings')">
            <text class="menu-icon">⚙️</text>
            <text class="menu-title">设置</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @click="navigateTo('/pages/profile/about')">
            <text class="menu-icon">ℹ️</text>
            <text class="menu-title">关于我们</text>
            <text class="menu-arrow">></text>
          </view>
        </view>
        
      </view>
      

      
      <!-- 退出登录 -->
      <view class="logout-section">
        <button class="logout-btn" @click="logout">退出登录</button>
      </view>
    </view>
  </view>
  <view v-if="showEditDialog" class="edit-dialog">
    <view class="edit-dialog-content">
      <view class="edit-title">编辑资料</view>
      <view class="edit-row">
        <text class="edit-label">头像</text>
  <image :src="getAvatarUrl(editAvatar)" class="edit-avatar-preview" v-if="editAvatar"></image>
  <button @click="chooseAvatar">选择图片</button>
      </view>
      <view class="edit-row">
        <text class="edit-label">昵称</text>
        <input v-model="editName" class="edit-input" placeholder="请输入昵称（最多20字）" maxlength="20" />
      </view>
      <view class="edit-actions">
        <button @click="showEditDialog = false">取消</button>
        <button @click="saveProfile">保存</button>
      </view>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js'
import ChatCache from '@/utils/chatCache.js'

export default {
  data() {
    return {
      userInfo: {
        uid: '',
        name: '未命名',
        role: '未知',
        avatar: '/static/avatar.png',
      },
      showEditDialog: false, // 控制编辑弹窗显示
      editName: '',         // 编辑中的名称
      editAvatar: ''        // 编辑中的头像
    }
  },
  onLoad() {
    // 首先验证当前登录用户uid是否与缓存中的uid一致
    this.validateUserUid();
    this.loadUserInfo();
  },
  methods: {
    // 缓存用户信息
    cacheUserInfo(userInfo) {
      const cacheData = {
        uid: userInfo.uid,
        name: userInfo.name,
        avatar: userInfo.avatar,
        role: userInfo.role,
        timestamp: Date.now()
      };
      uni.setStorageSync('userInfoCache', cacheData);
    },
    
    // 从缓存读取用户信息
    loadUserInfoFromCache() {
      try {
        const cacheData = uni.getStorageSync('userInfoCache');
        if (cacheData && cacheData.uid) {
          // 检查缓存是否过期（24小时）
          const now = Date.now();
          const cacheAge = now - (cacheData.timestamp || 0);
          const maxAge = 24 * 60 * 60 * 1000; // 24小时
          
          if (cacheAge < maxAge) {
            return {
              uid: cacheData.uid,
              name: cacheData.name || '未命名',
              avatar: cacheData.avatar || '/static/avatar.png',
              role: cacheData.role || '未知'
            };
          }
        }
      } catch (error) {
        console.error('读取用户信息缓存失败:', error);
      }
      return null;
    },
    
    // 清除用户信息缓存
    clearUserInfoCache() {
      uni.removeStorageSync('userInfoCache');
    },
    
    // 清除所有相关缓存（个人信息页和通讯页）
    clearAllRelatedCaches() {
      try {
        // 使用统一的缓存清理方法，确保清理所有相关缓存
        const success = Database.auth.clearAllUserCache();
        if (success) {
          console.log('已清除所有相关缓存（个人信息页和通讯页）');
        } else {
          console.error('清除缓存失败');
        }
        return success;
      } catch (error) {
        console.error('清除缓存失败:', error);
        return false;
      }
    },
    
    // 验证当前登录用户uid是否与缓存中的uid一致
    validateUserUid() {
      const currentUser = uni.getStorageSync('currentUser');
      if (!currentUser || !currentUser.uid) {
        return false;
      }
      
      const cachedUserInfo = this.loadUserInfoFromCache();
      if (!cachedUserInfo || !cachedUserInfo.uid) {
        return true; // 没有缓存，认为验证通过
      }
      
      // 检查uid是否一致
      const isUidMatch = cachedUserInfo.uid === currentUser.uid;
      if (!isUidMatch) {
        console.log('用户不匹配，清除相关缓存');
        
        // 只清理聊天相关缓存，保留currentUser和token
        this.clearChatRelatedCaches();
        
        uni.showToast({
          title: '检测到用户切换，已清除缓存',
          icon: 'none',
          duration: 2000
        });
      } else {
        console.log('用户匹配，缓存有效');
      }
      
      return isUidMatch;
    },
    
    // 清除聊天相关缓存（保留用户登录信息）
    clearChatRelatedCaches() {
      try {
        // 清除用户信息缓存
        this.clearUserInfoCache();
        
        // 清除聊天相关缓存
        const chatCache = new ChatCache();
        chatCache.clearAllCache();
        
        // 清除其他可能的用户相关缓存（但不包括currentUser和token）
        const otherCacheKeys = [
          'user_profile_cache',
          'user_settings_cache',
          'app_settings_cache',
          'last_login_time',
          'user_preferences'
        ];
        
        otherCacheKeys.forEach(key => {
          uni.removeStorageSync(key);
        });
        
        console.log('聊天相关缓存已清除');
        return true;
      } catch (error) {
        console.error('清除聊天相关缓存失败:', error);
        return false;
      }
    },

  async loadUserInfo() {
    const currentUser = uni.getStorageSync('currentUser');
    if (currentUser && currentUser.uid) {
      // 先从缓存读取
      const cachedUserInfo = this.loadUserInfoFromCache();
      if (cachedUserInfo && cachedUserInfo.uid === currentUser.uid) {
        // 使用缓存数据
        this.userInfo = cachedUserInfo;
        this.userInfo.role = this.getAccountTypeName(currentUser.type);
      } else {
        // 缓存不存在或过期，从服务器获取
        this.userInfo.uid = currentUser.uid;
        this.userInfo.role = this.getAccountTypeName(currentUser.type);
        await this.fetchUserInfoById(currentUser.uid);
      }
    }
  },
  async fetchUserInfoById(userId) {
    try {
      // 获取用户详细信息
      const userRes = await Database.getUserById(userId);
      if (userRes.success && userRes.user) {
        // 用户信息存在，更新显示
        this.userInfo.name = userRes.user.name || this.userInfo.name;
        this.userInfo.avatar = userRes.user.avatar || this.userInfo.avatar;
        // 更新缓存
        this.cacheUserInfo(this.userInfo);
      } else if (userRes.success === false && userRes.message === '用户信息不存在') {
        // 用户信息不存在，创建新用户并弹出编辑弹窗
        await this.createNewUserInfo(userId);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      uni.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },
  async createNewUserInfo(userId) {
    try {
      // 创建新用户信息，使用默认值
      const createRes = await Database.createUserInfo(userId, userId, '/static/avatar.png');
      if (createRes.success) {
        // 创建成功，更新显示并弹出编辑弹窗
        this.userInfo.name = createRes.user.name;
        this.userInfo.avatar = createRes.user.avatar;
        // 更新缓存
        this.cacheUserInfo(this.userInfo);
        // 弹出编辑弹窗
        this.editProfile();
      } else {
        uni.showToast({
          title: createRes.message || '创建用户信息失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('创建用户信息失败:', error);
      uni.showToast({
        title: '创建用户信息失败',
        icon: 'none'
      });
    }
  },
    
    getAccountTypeName(accountType) {
      const typeNames = {
        0: '管理员',
        1: '教师',
        2: '学生',
      };
      return typeNames[accountType] || '未知';
    },
    
    getAvatarUrl(avatar) {
      if (!avatar) {
        return '/static/avatar.png';
      }
      // 如果是服务器路径，添加完整URL
      if (avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${avatar}`;
      }
      // 如果是默认头像或本地路径
      return avatar;
    },
    
    editProfile() {
      // 打开编辑弹窗，并初始化编辑数据
      this.editName = this.userInfo.name;
      this.editAvatar = this.userInfo.avatar;
      this.showEditDialog = true;
    },
    chooseAvatar() {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (chooseImageRes) => {
        const tempFilePath = chooseImageRes.tempFilePaths[0];
        
        // 显示加载提示
        uni.showLoading({
          title: '上传中...'
        });
        
        // 上传头像到服务器
        uni.uploadFile({
          url: `${config.API_BASE_URL}/upload/avatar`,
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${Database.getToken()}`
          },
          success: (uploadFileRes) => {
            uni.hideLoading();
            const data = JSON.parse(uploadFileRes.data);
            if (data.success && data.url) {
              this.editAvatar = data.url;
              uni.showToast({ title: '头像上传成功', icon: 'success' });
            } else {
              uni.showToast({ title: data.message || '上传失败', icon: 'none' });
            }
          },
          fail: () => {
            uni.hideLoading();
            uni.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      }
    });
  },
    async saveProfile() {
      if (!this.editName.trim()) {
        uni.showToast({ title: '名称不能为空', icon: 'none' });
        return;
      }
      const currentUser = uni.getStorageSync('currentUser');
      if (!currentUser || !currentUser.uid) {
        uni.showToast({ title: '未登录', icon: 'none' });
        return;
      }
      // 调用后端接口更新用户信息
      const res = await Database.updateUserProfile(currentUser.uid, this.editName, this.editAvatar);
      if (res.success) {
        this.userInfo.name = this.editName;
        this.userInfo.avatar = this.editAvatar;
        // 更新缓存
        this.cacheUserInfo(this.userInfo);
        this.showEditDialog = false;
        uni.showToast({ title: '保存成功', icon: 'success' });
      } else {
        uni.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    },
    
    navigateTo(url) {
      if (url === '/pages/profile/settings') {
        uni.navigateTo({
          url: url
        });
      } else {
        uni.showToast({
          title: '放青松 青少年互助的心理健康交流平台\n\n© 2025 放青松团队',
          icon: 'none'
        });
      }
    },
    
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 使用统一的缓存清理方法
            const success = Database.auth.clearAllUserCache();
            
            if (success) {
              uni.showToast({
                title: '已退出登录',
                icon: 'success',
                duration: 1500
              });
              
              // 延迟跳转，让用户看到成功提示
              setTimeout(() => {
                uni.reLaunch({
                  url: '/pages/index/index'
                });
              }, 1500);
            } else {
              uni.showToast({
                title: '退出登录时出现错误',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    goToPersonalSpace() {
      const currentUser = uni.getStorageSync('currentUser');
      if (currentUser && currentUser.uid) {
        uni.navigateTo({
          url: `/pages/personalSpace/index?uid=${currentUser.uid}`
        });
      }
    },
    
    goToChangePassword() {
      const currentUser = uni.getStorageSync('currentUser');
      if (currentUser && currentUser.type === 0) {
        // 管理员跳转到账号管理页面
        uni.navigateTo({
          url: '/pages/profile/accounts'
        });
      } else {
        // 其他用户跳转到修改密码页面
        uni.navigateTo({
          url: '/pages/profile/changePassword'
        });
      }
    },
    
    // 测试uid验证和缓存清理功能（仅用于调试）
    testUidValidation() {
      
      // 保存当前状态
      const originalCurrentUser = uni.getStorageSync('currentUser');
      const originalUserInfoCache = uni.getStorageSync('userInfoCache');
      
      try {
        // 测试场景1：正常情况，uid匹配
        const testUser1 = { uid: 'test001', name: '测试用户1', type: 2 };
        const testCache1 = { uid: 'test001', name: '测试用户1', avatar: '/static/avatar.png', role: '学生', timestamp: Date.now() };
        
        uni.setStorageSync('currentUser', testUser1);
        uni.setStorageSync('userInfoCache', testCache1);
        
        const result1 = this.validateUserUid();
        
        // 测试场景2：uid不匹配
        const testUser2 = { uid: 'test002', name: '测试用户2', type: 2 };
        const testCache2 = { uid: 'test001', name: '测试用户1', avatar: '/static/avatar.png', role: '学生', timestamp: Date.now() };
        
        uni.setStorageSync('currentUser', testUser2);
        uni.setStorageSync('userInfoCache', testCache2);
        
        const result2 = this.validateUserUid();
        
        // 测试场景3：没有缓存
        const testUser3 = { uid: 'test003', name: '测试用户3', type: 2 };
        
        uni.setStorageSync('currentUser', testUser3);
        uni.removeStorageSync('userInfoCache');
        
        const result3 = this.validateUserUid();
        
        // 恢复原始状态
        if (originalCurrentUser) {
          uni.setStorageSync('currentUser', originalCurrentUser);
        } else {
          uni.removeStorageSync('currentUser');
        }
        
        if (originalUserInfoCache) {
          uni.setStorageSync('userInfoCache', originalUserInfoCache);
        } else {
          uni.removeStorageSync('userInfoCache');
        }
        
        
      } catch (error) {
        console.error('测试过程中出现错误:', error);
        
        // 恢复原始状态
        if (originalCurrentUser) {
          uni.setStorageSync('currentUser', originalCurrentUser);
        } else {
          uni.removeStorageSync('currentUser');
        }
        
        if (originalUserInfoCache) {
          uni.setStorageSync('userInfoCache', originalUserInfoCache);
        } else {
          uni.removeStorageSync('userInfoCache');
        }
      }
    }
  }
}
</script>

<style scoped>
.profile-container {
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

.user-card {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #e0e0e0;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.user-role {
  display: block;
  font-size: 24rpx;
  color: #9b59b6;
  margin-bottom: 8rpx;
}


.edit-btn {
  width: 60rpx;
  height: 60rpx;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-icon {
  font-size: 24rpx;
}

.user-space {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  margin-top: 16rpx;
  transition: background-color 0.2s ease;
}

.user-space:active {
  background: #e9ecef;
}

.space-icon {
  font-size: 28rpx;
  margin-right: 16rpx;
}

.space-text {
  flex: 1;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
}

.space-arrow {
  font-size: 24rpx;
  color: #bdc3c7;
}

.menu-section {
  margin-bottom: 40rpx;
}

.menu-group {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 32rpx;
  margin-right: 24rpx;
}

.menu-title {
  flex: 1;
  font-size: 28rpx;
  color: #2c3e50;
}

.menu-arrow {
  font-size: 24rpx;
  color: #bdc3c7;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  display: block;
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 32rpx;
}


.activity-list {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 32rpx;
  margin-right: 24rpx;
}

.activity-content {
  flex: 1;
}

.activity-title {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  margin-bottom: 8rpx;
}

.activity-time {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
}

.logout-section {
  margin-top: 60rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  background: #e74c3c;
  border: none;
  border-radius: 8rpx;
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-dialog {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.edit-dialog-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  width: 80vw;
  max-width: 500rpx;
  box-sizing: border-box;
}
.edit-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 32rpx;
  text-align: center;
}
.edit-row {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.edit-label {
  width: 120rpx;
  font-size: 28rpx;
  color: #2c3e50;
}
.edit-input {
  flex: 1;
  height: 60rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 28rpx;
  color: #2c3e50;
  background: #f8f9fa;
}
.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
  margin-top: 32rpx;
}

.edit-avatar-preview {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  background: #eee;
  display: inline-block;
  vertical-align: middle;
}
</style> 
