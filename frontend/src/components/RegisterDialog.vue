<template>
  <view class="message-dialog" v-if="visible">
    <view class="dialog-mask" @click="onClose"></view>
    <view class="dialog-content">
      <view class="dialog-title">联系管理员</view>
      
      <!-- 问题类型选择 -->
      <view class="form-row">
        <text class="label">问题类型</text>
        <picker :range="problemTypes" range-key="label" @change="onProblemTypeChange">
          <view class="picker-value">{{ problemTypeName }}</view>
        </picker>
      </view>
      
      <!-- 紧急程度选择 -->
      <view class="form-row">
        <text class="label">紧急程度</text>
        <picker :range="urgencyLevels" range-key="label" @change="onUrgencyChange">
          <view class="picker-value">{{ urgencyName }}</view>
        </picker>
      </view>
      
      <!-- 联系方式 -->
      <view class="form-row">
        <text class="label">联系方式</text>
        <input v-model="contactInfo" class="input" placeholder="请输入您的联系方式（手机号或邮箱）" maxlength="50" />
      </view>
      
      <!-- 问题描述 -->
      <view class="form-row">
        <text class="label">问题描述</text>
        <textarea v-model="problemDescription" class="textarea" placeholder="请详细描述您遇到的问题..." maxlength="200" />
        <text class="char-count">{{ problemDescription.length }}/200</text>
      </view>
      
      <!-- 附件上传 -->
      <view class="form-row" v-if="showAttachment">
        <text class="label">相关附件</text>
        <button @click="chooseFile" class="upload-btn">选择文件</button>
        <text v-if="attachmentName" class="attachment-name">{{ attachmentName }}</text>
      </view>
      
      <view class="form-actions">
        <button class="send-btn" @click="handleSendMessage" :disabled="sending">
          {{ sending ? '发送中...' : '发送消息' }}
        </button>
        <button class="cancel-btn" @click="onClose">取消</button>
      </view>
    </view>
  </view>
</template>

<script>
import Database from '@/utils/database.js'

export default {
  props: {
    visible: Boolean
  },
  data() {
    return {
      problemTypes: [
        { label: '账号问题', value: 'account' },
        { label: '功能问题', value: 'function' },
        { label: '技术问题', value: 'technical' },
        { label: '建议反馈', value: 'suggestion' },
        { label: '其他问题', value: 'other' }
      ],
      problemType: 'account',
      urgencyLevels: [
        { label: '低', value: 'low' },
        { label: '中', value: 'medium' },
        { label: '高', value: 'high' },
        { label: '紧急', value: 'urgent' }
      ],
      urgency: 'medium',
      contactInfo: '',
      problemDescription: '',
      attachmentName: '',
      attachmentPath: '',
      showAttachment: false,
      sending: false
    }
  },
  computed: {
    problemTypeName() {
      const t = this.problemTypes.find(i => i.value === this.problemType)
      return t ? t.label : ''
    },
    urgencyName() {
      const t = this.urgencyLevels.find(i => i.value === this.urgency)
      return t ? t.label : ''
    }
  },
  methods: {
    onClose() {
      this.$emit('close')
      this.resetForm()
    },
    
    onProblemTypeChange(e) {
      this.problemType = this.problemTypes[e.detail.value].value
    },
    
    onUrgencyChange(e) {
      this.urgency = this.urgencyLevels[e.detail.value].value
    },
    
    chooseFile() {
      uni.chooseFile({
        count: 1,
        type: 'all',
        success: (res) => {
          this.attachmentPath = res.tempFilePaths[0]
          this.attachmentName = res.tempFiles[0].name
        },
        fail: (err) => {
          console.error('选择文件失败:', err)
          uni.showToast({ title: '选择文件失败', icon: 'none' })
        }
      })
    },
    
    resetForm() {
      this.problemType = 'account'
      this.urgency = 'medium'
      this.contactInfo = ''
      this.problemDescription = ''
      this.attachmentName = ''
      this.attachmentPath = ''
      this.sending = false
    },
    
    async handleSendMessage() {
      // 验证必填字段
      if (!this.contactInfo.trim()) {
        uni.showToast({ title: '请输入联系方式', icon: 'none' })
        return
      }
      
      if (!this.problemDescription.trim()) {
        uni.showToast({ title: '请输入问题描述', icon: 'none' })
        return
      }
      
      this.sending = true
      
      try {
        // 构建消息内容
        const messageContent = `问题类型：${this.problemTypeName}
紧急程度：${this.urgencyName}
联系方式：${this.contactInfo}
问题描述：${this.problemDescription}
${this.attachmentName ? `附件：${this.attachmentName}` : ''}

发送时间：${new Date().toLocaleString()}`

        // 发送消息给管理员
        const res = await Database.sendAdminMessage('fortest', messageContent, 0)
        
        if (res.success) {
          uni.showToast({ title: '消息发送成功', icon: 'success' })
          this.$emit('success')
          this.onClose()
        } else {
          uni.showToast({ title: res.message || '发送失败', icon: 'none' })
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        uni.showToast({ title: '发送失败，请重试', icon: 'none' })
      } finally {
        this.sending = false
      }
    }
  }
}
</script>

<style scoped>
.message-dialog {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  z-index: 9999;
}
.dialog-mask {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
}
.dialog-content {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%,-50%);
  background: #fff;
  border-radius: 16rpx;
  width: 650rpx;
  max-height: 80vh;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  overflow-y: auto;
}
.dialog-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  text-align: center;
  color: #333;
}
.form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
  flex-wrap: wrap;
}
.label {
  width: 140rpx;
  color: #333;
  font-size: 28rpx;
  line-height: 40rpx;
  margin-top: 10rpx;
}
.picker-value {
  flex: 1;
  color: #2ca163;
  font-size: 28rpx;
  padding: 10rpx;
  border: 1rpx solid #ccc;
  border-radius: 8rpx;
  background: #fff;
}
.input {
  flex: 1;
  border: 1rpx solid #ccc;
  border-radius: 8rpx;
  padding: 10rpx;
  font-size: 28rpx;
  min-height: 40rpx;
}
.textarea-container {
  flex: 1;
  position: relative;
}
.textarea {
  width: 100%;
  border: 1rpx solid #ccc;
  border-radius: 8rpx;
  padding: 10rpx;
  font-size: 28rpx;
  min-height: 120rpx;
  resize: none;
  box-sizing: border-box;
}
.upload-btn {
  background: #f0f0f0;
  color: #333;
  border: 1rpx solid #ccc;
  border-radius: 8rpx;
  padding: 10rpx 20rpx;
  font-size: 26rpx;
  margin-right: 10rpx;
}
.attachment-name {
  color: #666;
  font-size: 24rpx;
  margin-top: 5rpx;
  word-break: break-all;
}
.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
  gap: 20rpx;
}
.send-btn {
  flex: 1;
  background: #2ca163;
  color: #fff;
  border-radius: 8rpx;
  padding: 16rpx 40rpx;
  font-size: 28rpx;
  border: none;
}
.send-btn:disabled {
  background: #ccc;
  color: #999;
}
.cancel-btn {
  flex: 1;
  background: #eee;
  color: #333;
  border-radius: 8rpx;
  padding: 16rpx 40rpx;
  font-size: 28rpx;
  border: none;
}
.char-count {
  position: absolute;
  right: 10rpx;
  bottom: 10rpx;
  color: #999;
  font-size: 24rpx;
}
</style> 