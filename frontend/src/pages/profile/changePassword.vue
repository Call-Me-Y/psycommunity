<template>
  <view class="change-password-container">
    <view class="header">
      <view class="nav-bar">
        <view class="nav-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <text class="nav-title">修改密码</text>
        <view class="nav-right"></view>
      </view>
    </view>
    
    <view class="content">
      <view class="form-card">
        <view class="form-title">修改密码</view>
        <view class="form-subtitle">为了您的账号安全，请定期修改密码</view>
        
        <view class="form-content">
          <!-- 原密码 -->
          <view class="form-item">
            <text class="form-label">原密码</text>
            <view class="input-wrapper">
              <input 
                v-model="oldPassword" 
                class="form-input" 
                type="password" 
                placeholder="请输入原密码"
                :disabled="loading"
                maxlength="72"
              />
            </view>
          </view>
          
          <!-- 新密码 -->
          <view class="form-item">
            <text class="form-label">新密码</text>
            <view class="input-wrapper">
              <input 
                v-model="newPassword" 
                class="form-input" 
                type="password" 
                placeholder="请输入新密码（至少8位）"
                :disabled="loading"
                maxlength="72"
              />
            </view>
          </view>
          
          <!-- 确认新密码 -->
          <view class="form-item">
            <text class="form-label">确认新密码</text>
            <view class="input-wrapper">
              <input 
                v-model="confirmPassword" 
                class="form-input" 
                type="password" 
                placeholder="请再次输入新密码"
                :disabled="loading"
                maxlength="72"
              />
            </view>
          </view>
          
          <!-- 密码强度提示 -->
          <view class="password-tips" v-if="newPassword">
            <view class="tip-item" :class="{ 'valid': passwordLength }">
              <text class="tip-icon">{{ passwordLength ? '✓' : '○' }}</text>
              <text class="tip-text">至少8位字符</text>
            </view>
            <view class="tip-item" :class="{ 'valid': passwordMatch }">
              <text class="tip-icon">{{ passwordMatch ? '✓' : '○' }}</text>
              <text class="tip-text">两次密码输入一致</text>
            </view>
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="form-actions">
          <button 
            class="submit-btn" 
            @click="handleChangePassword" 
            :disabled="!canSubmit || loading"
            :class="{ 'loading': loading }"
          >
            {{ loading ? '修改中...' : '确认修改' }}
          </button>
        </view>
      </view>
      
      <!-- 安全提示 -->
      <view class="security-tips">
        <view class="tips-title">安全提示</view>
        <view class="tips-content">
          <text class="tip-text">• 密码长度至少8位</text>
          <text class="tip-text">• 建议使用字母、数字和特殊字符的组合</text>
          <text class="tip-text">• 不要使用过于简单的密码</text>
          <text class="tip-text">• 定期修改密码以保护账号安全</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Database from '@/utils/database.js'

export default {
  data() {
    return {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      loading: false
    }
  },
  computed: {
    passwordLength() {
      return this.newPassword.length >= 8
    },
    passwordMatch() {
      return this.newPassword && this.newPassword === this.confirmPassword
    },
    canSubmit() {
      return this.oldPassword && 
             this.newPassword && 
             this.confirmPassword && 
             this.passwordLength && 
             this.passwordMatch
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    // 验证原密码输入（只允许数字和英文字母）
    validateOldPassword(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.oldPassword = filteredValue;
        uni.showToast({
          title: '密码只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 验证新密码输入（只允许数字和英文字母）
    validateNewPassword(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.newPassword = filteredValue;
        uni.showToast({
          title: '密码只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 验证确认密码输入（只允许数字和英文字母）
    validateConfirmPassword(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.confirmPassword = filteredValue;
        uni.showToast({
          title: '密码只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    async handleChangePassword() {
      if (!this.canSubmit) {
        uni.showToast({
          title: '请完善所有信息',
          icon: 'none'
        })
        return
      }
      
      this.loading = true
      
      try {
        const res = await Database.changePassword(this.oldPassword, this.newPassword)
        
        if (res.success) {
          uni.showToast({
            title: '密码修改成功',
            icon: 'success'
          })
          
          // 延迟返回上一页
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({
            title: res.message || '修改失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('修改密码失败:', error)
        uni.showToast({
          title: '修改失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.change-password-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  background: #fff;
  border-bottom: 1rpx solid #e9ecef;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
}

.nav-left {
  width: 80rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.back-icon {
  font-size: 36rpx;
  color: #2ca163;
  font-weight: bold;
}

.nav-title {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
}

.nav-right {
  width: 80rpx;
}

.content {
  padding: 40rpx 32rpx;
}

.form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 16rpx;
  text-align: center;
}

.form-subtitle {
  font-size: 24rpx;
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 40rpx;
}

.form-content {
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e9ecef;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #2c3e50;
  background: #fff;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #2ca163;
}

.form-input:disabled {
  background: #f8f9fa;
  color: #adb5bd;
}

.password-tips {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  font-size: 24rpx;
  margin-right: 16rpx;
  color: #adb5bd;
}

.tip-item.valid .tip-icon {
  color: #28a745;
}

.tip-text {
  font-size: 24rpx;
  color: #6c757d;
}

.tip-item.valid .tip-text {
  color: #28a745;
}

.form-actions {
  margin-top: 40rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #2ca163;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:disabled {
  background: #adb5bd;
  color: #6c757d;
}

.submit-btn.loading {
  background: #adb5bd;
}

.security-tips {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.tips-title {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 24rpx;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #6c757d;
  line-height: 1.5;
}
</style>
