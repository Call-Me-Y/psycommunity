<template>
  <view class="create-post-container">
    <view class="header-bar">
      <text style="font-size: 28rpx;margin-left: 24rpx;" @click="goBack">< &emsp;</text>
      <view class="section-title">发布动态</view>
    </view>
    <view class="input-container">
      <view class="input-box">
        <view class="add-button" @click="showUploadDialog">
          <text class="add-icon">+</text>
        </view>
        <textarea
          v-model="content"
          class="content-input"
          placeholder="请输入内容..."
          :auto-height="true"
          maxlength="250"
          show-confirm-bar="false"
          :adjust-position="true"
        />
        <view class="send-button" @click="submitPost">
          <text class="send-icon">发布</text>
        </view>
      </view>
    </view>
    <view class="file-upload">
      <!-- 文件数量提示 -->
      <view class="file-count-tip">
        <text class="tip-text">图片：{{ imageList.length }}/3，文件：{{ fileList.length }}/3</text>
      </view>
      
      <view v-if="imageList.length || fileList.length" class="preview-list">
        <!-- 图片预览 -->
        <view v-for="(img, idx) in imageList" :key="`img_${idx}`" class="preview-item">
          <image :src="getImageUrl(img)" class="preview-img"/>
          <text class="delete-btn" @click="removeImage(idx)">✖</text>
        </view>
        <!-- 文件预览 -->
        <view v-for="(file, idx) in fileList" :key="`file_${idx}`" class="preview-item file-item" @click="downloadFile(file)">
          <text class="file-icon">📂</text>
          <text class="file-name">{{ getFileName(file) }}</text>
          <text class="delete-btn" @click.stop="removeFile(idx)">✖</text>
        </view>
      </view>
    </view>

    <!-- 文件上传选择弹窗 -->
    <view class="dialog-overlay" v-if="showUploadDialogFlag" @click="hideUploadDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">选择文件类型</text>
          <text class="dialog-close" @click="hideUploadDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="upload-options">
            <view class="upload-option" @click="selectImage">
              <text class="upload-icon">📷</text>
              <text class="upload-text">选择图片</text>
            </view>
            <view class="upload-option" @click="selectFile">
              <text class="upload-icon">📁</text>
              <text class="upload-text">选择文件</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="privacy-setting">
      <view class="privacy-option" @click="togglePrivacy">
        <text class="privacy-icon">{{ isPublic ? '🌐' : '🔒' }}</text>
        <text class="privacy-text">{{ isPublic ? '公开' : '私密' }}</text>
        <text class="privacy-desc">{{ isPublic ? '所有人可见' : '仅自己可见' }}</text>
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
      content: '',
      imageList: [],
      fileList: [],
      isPublic: true,  // 默认公开
      showUploadDialogFlag: false
    }
  },
  methods: {
    goBack() {
      uni.switchTab({ url: '/pages/community/index' });
    },
    showUploadDialog() {
      this.showUploadDialogFlag = true;
    },
    hideUploadDialog() {
      this.showUploadDialogFlag = false;
    },
    selectImage() {
      this.hideUploadDialog();
      this.chooseImage();
    },
    selectFile() {
      this.hideUploadDialog();
      this.chooseFile();
    },
    chooseImage() {
      // 检查图片数量限制
      if (this.imageList.length >= 3) {
        uni.showToast({
          title: '最多只能上传3张图片',
          icon: 'none'
        });
        return;
      }
      
      uni.chooseImage({
        count: 1,
        success: (res) => {
          const filePath = res.tempFilePaths[0];
          this.uploadFile(filePath, 'image');
        }
      });
    },
    chooseFile() {
      // 检查文件数量限制
      if (this.fileList.length >= 3) {
        uni.showToast({
          title: '最多只能上传3个文件',
          icon: 'none'
        });
        return;
      }
      
      uni.chooseFile({
        count: 1,
        type: 'all',
        success: (res) => {
          const filePath = res.tempFilePaths[0];
          this.uploadFile(filePath, 'file');
        }
      });
    },
    uploadFile(filePath, type) {
      // 再次检查数量限制（防止并发上传）
      if (type === 'image' && this.imageList.length >= 3) {
        uni.showToast({
          title: '最多只能上传3张图片',
          icon: 'none'
        });
        return;
      }
      if (type === 'file' && this.fileList.length >= 3) {
        uni.showToast({
          title: '最多只能上传3个文件',
          icon: 'none'
        });
        return;
      }
      
      // 检查文件大小（15MB限制）
      uni.getFileInfo({
        filePath,
        success: (fileInfo) => {
          const maxSize = 15 * 1024 * 1024; // 15MB
          if (fileInfo.size > maxSize) {
            uni.showToast({
              title: '文件大小不能超过15MB',
              icon: 'none'
            });
            return;
          }
          
          uni.showLoading({ title: '上传中...' });
          const uploadUrl = type === 'image' ? '/upload/postimage' : '/upload/post-file';
          
          uni.uploadFile({
            url: `${config.API_BASE_URL}${uploadUrl}`,
            filePath,
            name: 'file',
            header: {
              'Authorization': `Bearer ${Database.getToken()}`
            },
            success: (uploadRes) => {
              uni.hideLoading();
              const data = JSON.parse(uploadRes.data);
              if (data.success && data.url) {
                if (type === 'image') {
                  this.imageList.push(data.url);
                } else {
                  this.fileList.push(data.url);
                }
                uni.showToast({ title: '上传成功', icon: 'success' });
              } else {
                uni.showToast({ title: data.message || '上传失败', icon: 'none' });
              }
            },
            fail: () => {
              uni.hideLoading();
              uni.showToast({ title: '上传失败', icon: 'none' });
            }
          });
        },
        fail: () => {
          uni.showToast({ title: '获取文件信息失败', icon: 'none' });
        }
      });
    },
    removeImage(idx) {
      this.imageList.splice(idx, 1);
    },
    removeFile(idx) {
      this.fileList.splice(idx, 1);
    },
    getFileName(filePath) {
      if (!filePath) return '';
      const parts = filePath.split('/');
      return parts[parts.length - 1];
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
    togglePrivacy() {
      this.isPublic = !this.isPublic;
    },
    getImageUrl(imageUrl) {
      if (!imageUrl) return '';
      // 如果是服务器路径，添加完整URL
      if (imageUrl.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${imageUrl}`;
      }
      return imageUrl;
    },
    async submitPost() {
      if (!this.content.trim() && this.imageList.length === 0 && this.fileList.length === 0) {
        uni.showToast({ title: '内容不能为空', icon: 'none' });
        return;
      }
      
      const currentUser = uni.getStorageSync('currentUser');
      if (!currentUser || !currentUser.uid) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      // 显示发布进度
      uni.showLoading({
        title: '发布中...'
      });
      
      try {
        const postData = {
          text_content: this.content,
          image_urls: this.imageList,
          file_urls: this.fileList,
          is_public: this.isPublic
        };
        
        const res = await Database.createPost(postData);
        uni.hideLoading();
        
        if (res.success) {
          uni.showToast({ title: '发布成功', icon: 'success' });
          setTimeout(() => {
            uni.switchTab({ url: '/pages/community/index' });
          }, 800);
        } else {
          uni.showToast({ title: res.message || '发布失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('发布动态错误:', error);
        uni.showToast({ title: '发布失败，请重试', icon: 'none' });
      }
    }
  }
}
</script>

<style scoped>
.create-post-container { padding: 40rpx; }
.header-bar {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}
.section-title { font-size: 36rpx; font-weight: bold; }
/* 输入框容器 */
.input-container {
  margin-bottom: 24rpx;
}

.input-box {
  display: flex;
  align-items: flex-start;
  background: #f8f8f8;
  border-radius: 24rpx;
  padding: 16rpx 20rpx;
  gap: 16rpx;
  min-height: 80rpx;
}

.content-input {
  flex: 1;
  min-height: 60rpx;
  max-height: 200rpx;
  font-size: 28rpx;
  line-height: 1.5;
  background: transparent;
  border: none;
  padding: 0;
  box-sizing: border-box;
}

/* 圆形加号按钮 */
.add-button {
  width: 60rpx;
  height: 60rpx;
  background: #55B99E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.add-button:active {
  transform: scale(0.95);
  background: #0056CC;
}

.add-icon {
  font-size: 28rpx;
  color: white;
  font-weight: bold;
}

/* 发送按钮 */
.send-button {
  background: #55B99E;
  color: white;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button:active {
  background: #0056CC;
  transform: scale(0.95);
}

.send-icon {
  font-size: 24rpx;
  color: white;
}

/* 文件上传区域 */
.file-upload { 
  margin-bottom: 24rpx; 
}

/* 文件数量提示 */
.file-count-tip {
  margin-bottom: 16rpx;
  padding: 12rpx 16rpx;
  background: #f0f8ff;
  border-radius: 8rpx;
  border-left: 4rpx solid #55B99E;
}

.tip-text {
  font-size: 24rpx;
  color: #666;
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.preview-item {
  position: relative;
  display: inline-block;
}

.preview-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  background: #eee;
}

.file-item {
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  min-width: 200rpx;
  cursor: pointer;
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

.delete-btn {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  background: #e74c3c;
  color: #fff;
  border-radius: 50%;
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  cursor: pointer;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15);
}

/* 文件上传选择弹窗 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 16rpx;
  width: 80%;
  max-width: 500rpx;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.dialog-close {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}

.dialog-content {
  padding: 32rpx;
}

.upload-options {
  display: flex;
  gap: 32rpx;
  justify-content: center;
}

.upload-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;
  border-radius: 16rpx;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120rpx;
}

.upload-option:active {
  background: #e9ecef;
  transform: scale(0.95);
}

.upload-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #333;
}
.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}
.preview-item {
  position: relative;
  display: inline-block;
}
.preview-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  background: #eee;
}
.delete-btn {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  background: #e74c3c;
  color: #fff;
  border-radius: 50%;
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  cursor: pointer;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15);
}
.privacy-setting {
  margin-bottom: 24rpx;
}
.privacy-option {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid #e9ecef;
}
.privacy-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}
.privacy-text {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
  margin-right: 16rpx;
}
.privacy-desc {
  font-size: 24rpx;
  color: #7f8c8d;
  flex: 1;
}
.submit-btn { width: 100%; height: 88rpx; background: #2ca163; color: #fff; font-size: 32rpx; border-radius: 8rpx; }
</style>
