// 认证相关API模块
class AuthModule {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // 获取存储的token
  getToken() {
    return uni.getStorageSync('jwt_token');
  }

  // 设置token
  setToken(token) {
    uni.setStorageSync('jwt_token', token);
  }

  // 清除token
  clearToken() {
    uni.removeStorageSync('jwt_token');
  }

  // 清除所有用户相关缓存
  clearAllUserCache() {
    try {
      // 清除认证相关缓存
      this.clearToken();
      uni.removeStorageSync('currentUser');
      uni.removeStorageSync('savedLogin');
      
      // 清除用户信息缓存
      uni.removeStorageSync('userInfoCache');
      
      // 清除聊天相关缓存
      const chatCacheKeys = [
        'chat_friends_cache',
        'chat_groups_cache', 
        'chat_latest_messages_cache',
        'chat_cache_timestamp',
        'chat_user_info_cache',
        'chat_private_messages_cache',
        'chat_group_messages_cache',
        'chat_private_read_status_cache',
        'chat_group_read_status_cache'
      ];
      
      // 清除所有聊天缓存键
      chatCacheKeys.forEach(key => {
        uni.removeStorageSync(key);
      });
      
      // 清除所有私聊消息缓存（动态键名）
      const storageInfo = uni.getStorageInfoSync();
      if (storageInfo && storageInfo.keys) {
        storageInfo.keys.forEach(key => {
          if (key.startsWith('chat_private_messages_cache_') || 
              key.startsWith('chat_group_messages_cache_') ||
              key.startsWith('chat_private_read_status_cache_') ||
              key.startsWith('chat_group_read_status_cache_')) {
            uni.removeStorageSync(key);
          }
        });
      }
      
      // 清除安全参数会话存储
      uni.removeStorageSync('secure_params_sessions');
      
      // 清除其他可能的用户相关缓存
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
      
      console.log('所有用户相关缓存已清除');
      return true;
    } catch (error) {
      console.error('清除用户缓存失败:', error);
      return false;
    }
  }

  

  // 验证用户登录
  validateLogin(uid, password) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/login`,
        method: 'POST',
        data: {
          uid,
          password
        },
        success: (res) => {
          if (res.data.success && res.data.token) {
            // 保存token
            this.setToken(res.data.token);
          }
          resolve(res.data);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }

  // 验证token
  verifyToken() {
    const token = this.getToken();
    if (!token) {
      return Promise.resolve({ success: false, message: '未找到token' });
    }

    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/verify-token`,
        method: 'POST',
        data: { token },
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }

  // 修改密码
  changePassword(oldPassword, newPassword) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/user/change-password`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { 
          old_password: oldPassword, 
          new_password: newPassword 
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 注册新用户
  registerUser(userData) {
    // userData: {username, password, accountType, verifyType, verifyValue, ... }
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/register`,
        method: 'POST',
        data: userData,
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
}

export default AuthModule;
