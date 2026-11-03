<template>
  <view class="login-container">
    <!-- 背景圆形SVG -->
    <view class="background">
      <image 
        src="/static/bg.jpg" 
        mode="aspectFill" 
        class="bg-image"
      ></image>
    </view>
    
    <!-- 标题 -->
    <view class="title-section">
      <image 
        src="/static/title.png" 
        mode="widthFix" 
        class="title-image"
      ></image>
    </view>
    
    <!-- 登录表单 -->
    <view class="login-form">
      
      
      <!-- 输入框 -->
      <view class="input-group">
        <input 
          class="input-field" 
          placeholder="学号/工号/手机号" 
          placeholder-class="placeholder"
          v-model="uid"
          maxlength="50"
        />
        <input 
          class="input-field" 
          placeholder="密码" 
          placeholder-class="placeholder"
          password="true"
          v-model="password"
          maxlength="72"
        />
      </view>
      
      <!-- 选项行 -->
      <view class="options-row">
        <view class="remember-login">
          <view class="checkbox" :class="{ 'checked': rememberLogin }" @click="toggleRememberLogin"></view>
          <text class="option-text">记住账号</text>
        </view>
        <text class="register-link" @click="handleRegister">注册账号</text>
        <text class="register-link" @click="showPasswordHelp">忘记密码</text>
      </view>
      
      <!-- 登录按钮 -->
      <button class="login-btn" @click="handleLogin" :disabled="!canLogin">登录</button>
    </view>
    
    <!-- 底部文本 -->
    <view class="footer">
      <text class="footer-text">放青松——青少年心理健康互助平台</text>
    </view>
    
    
    
    <RegisterDialog :visible="showRegister" @close="showRegister=false" />
  </view>
</template>

<script>
import Database from '@/utils/database.js'
import RegisterDialog from '@/components/RegisterDialog.vue'

export default {
  components: {
    RegisterDialog
  },
  data() {
    return {
      uid: '',
      password: '',
      rememberLogin: false,
      showSelector: false,
      showRegister: false
    }
  },
  computed: {
    canLogin() {
      return  this.uid.trim() && this.password.trim();
    }
  },
  onLoad() {
    // 检查是否有记住的登录信息
    const savedLogin = uni.getStorageSync('savedLogin');
    if (savedLogin) {
      this.uid = savedLogin.uid;
      this.password = '';
      if (savedLogin.password) uni.setStorageSync('savedLogin', { uid: savedLogin.uid });
      this.rememberLogin = true;
    }
  },
  methods: {
    async handleRegister() {
      if (!this.uid.trim() || this.password.length < 8) {
        uni.showToast({ title: '请填写账号和至少8位密码', icon: 'none' });
        return;
      }
      try {
        const result = await Database.registerUser({ uid: this.uid.trim(), password: this.password });
        if (!result.success) {
          uni.showToast({ title: result.message || '注册失败', icon: 'none' });
          return;
        }
        Database.setToken(result.token);
        uni.setStorageSync('currentUser', result.user);
        if (this.rememberLogin) uni.setStorageSync('savedLogin', { uid: this.uid.trim() });
        uni.showToast({ title: '注册成功', icon: 'success' });
        this.navigateByAccountType(result.user.type);
      } catch (error) {
        uni.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    },
    showPasswordHelp() {
      uni.showModal({ title: '忘记密码', content: '请联系本社区管理员重置密码。', showCancel: false });
    },
    
    // 验证账号输入（只允许数字和英文字母）
    validateUid(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.uid = filteredValue;
        uni.showToast({
          title: '账号只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 验证密码输入（只允许数字和英文字母）
    validatePassword(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.password = filteredValue;
        uni.showToast({
          title: '密码只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 切换记住登录
    toggleRememberLogin() {
      this.rememberLogin = !this.rememberLogin;
    },
    
    // 处理登录
    async handleLogin() {
      if (!this.uid.trim() || !this.password.trim()) {
        uni.showToast({ title: '请输入账号和密码', icon: 'none' });
        return;
      }
      
      try {
        const result = await Database.validateLogin(
          this.uid,
          this.password
        );
        
        if (result.success) {
          // 保存登录信息
          if (this.rememberLogin) {
            uni.setStorageSync('savedLogin', {
              uid: this.uid
            });
          } else {
            uni.removeStorageSync('savedLogin');
          }
          
          // 保存用户信息
          uni.setStorageSync('currentUser', result.user);
          
          // 显示成功提示
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 根据账号类型跳转
          this.navigateByAccountType(result.user.type);
        } else {
          // 显示错误提示
          uni.showToast({
            title: result.message,
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('登录错误:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    },
    
    // 根据账号类型跳转
    navigateByAccountType(accountType) {
      // 在跳转前验证uid并清理缓存
      this.validateAndClearCache();
      
      setTimeout(() => {uni.switchTab({
            url: '/pages/profile/index'
          });
      }, 1000);
    },
    
    // 验证当前登录用户uid是否与缓存中的uid一致，如果不一致则清理相关缓存
    validateAndClearCache() {
      const currentUser = uni.getStorageSync('currentUser');
      if (!currentUser || !currentUser.uid) {
        return;
      }
      
      // 检查是否有缓存的用户信息
      const cachedUserInfo = uni.getStorageSync('userInfoCache');
      if (!cachedUserInfo || !cachedUserInfo.uid) {
        return;
      }
      
      // 检查uid是否一致
      const isUidMatch = cachedUserInfo.uid === currentUser.uid;
      if (!isUidMatch) {
        
        // 只清理聊天相关缓存，保留currentUser和token
        this.clearChatRelatedCaches();
        
        uni.showToast({
          title: '检测到用户切换，已清除缓存',
          icon: 'none',
          duration: 2000
        });
      } else {
      }
    },
    
    // 清除聊天相关缓存（保留用户登录信息）
    clearChatRelatedCaches() {
      try {
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
    

  }
}
</script>

<style>
.login-container {
  min-height: 100vh;
  background: white;
  background-image: url('/static/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

.bg-image {
  width: 100%;
  height: 100%;
  opacity: 0.6;
}

.svg {
  width: 100%;
  height: 100%;
}

.title-section {
  margin-bottom: 80rpx;
  text-align: center;
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100rpx;
  padding: 0 40rpx;
  box-sizing: border-box;
}

.title-image {
  max-width: 100%;
  width: 100%;
  height: auto;
  display: block;
}

.main-title {
  font-size: 50rpx;
  color: black;
  font-weight: bold;
  text-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.5);
}

.login-form {
  width: 100%;
  max-width: 600rpx;
  position: relative;
  z-index: 10;
}



.selector-text {
  color: black;
  font-size: 28rpx;
  font-weight: 500;
}



.input-group {
  margin-bottom: 20rpx;
}

.input-field {
  width: 100%;
  height: 88rpx;
  background: none;
  border: 4rpx solid rgba(0, 0, 0, 0.8);
  border-radius: 8rpx;
  padding: 0 24rpx;
  margin-bottom: 24rpx;
  font-size: 28rpx;
  color: #2d2347;
  box-sizing: border-box;
  backdrop-filter: blur(10rpx);
}

.placeholder {
  color: #000000;
  opacity: 0.7;
}

.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60rpx;
}

.remember-login {
  display: flex;
  align-items: center;
}

.checkbox {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #2d2347;
  border-radius: 4rpx;
  margin-right: 16rpx;
  position: relative;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.8);
}

.checkbox.checked {
  background: #6BBB65;
  border-color: black;
}

.checkbox.checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: black;
  font-size: 20rpx;
  font-weight: bold;
}

.option-text {
  color: #2d2347;
  font-size: 26rpx;
  font-weight: 500;
}

.register-link {
  color: #2d2347;
  font-size: 26rpx;
  font-weight: 500;
  cursor: pointer;
}

.login-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(90deg, #6BBB65 0%, #55B99E 100%);
  border: 1rpx solid rgba(0, 0, 0, 0.5);
  border-radius: 8rpx;
  color: black;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10rpx);
}

.login-btn:disabled {
  background: rgba(255, 255, 255, 0.3);
  color: rgba(0, 0, 0, 0.5);
  cursor: not-allowed;
}

.footer {
  position: absolute;
  bottom: 60rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.footer-text {
  color: rgba(0, 0, 0, 0.9);
  font-size: 24rpx;
  text-align: center;
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.3);
}
</style>
