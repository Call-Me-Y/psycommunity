<template>
  <view class="post-detail-container">
    <view class="header-bar">
      <text class="back-btn" @click="goBack">← 返回</text>
      <view class="header-title">动态详情</view>
    </view>
    
    <!-- 分享弹窗 -->
    <ShareDialog 
      :visible="showShareDialog"
      share-type="post"
      :share-id="pid"
      :share-title="'动态分享'"
      @close="showShareDialog = false"
    />
    
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    
    <view v-else-if="post" class="post-detail">
      <!-- 用户信息 -->
      <view class="post-header">
        <image class="avatar" :src="getAvatarUrl(post.avatar)" mode="aspectFill" @click="goToPersonalSpace(post.uid)"></image>
        <view class="user-info">
          <text class="username" @click="goToPersonalSpace(post.uid)">{{ post.username || '未命名' }}</text>
          <text class="post-time">{{ formatTime(post.created_time) }}</text>
        </view>
        <view v-if="isMyPost" class="delete-btn" @click="deletePost">
          <text>删除</text>
        </view>
      </view>
      
      <!-- 动态内容 -->
      <view class="post-content">
        <text class="content-text">{{ post.text_content }}</text>
      </view>
      
      <!-- 图片展示 -->
      <view v-if="post.image_urls && post.image_urls.length" class="post-images">
        <image 
          v-for="(img, idx) in post.image_urls" 
          :key="idx" 
          :src="getImageUrl(img)" 
          class="post-image"
          mode="aspectFill"
          @click="previewImage(img, idx)"
        />
      </view>
      
      <!-- 文件展示 -->
      <view v-if="post.file_urls && post.file_urls.length" class="post-files">
        <view v-for="(file, idx) in post.file_urls" :key="idx" class="post-file-item" @click="downloadFile(file)">
          <text class="file-icon">📁</text>
          <text class="file-name">{{ getFileName(file) }}</text>
        </view>
      </view>
      
      <!-- 互动区域 -->
      <view class="post-actions">
        <view class="action-btn" :class="{liked: post && post.is_liked}" @click.stop="likePost(post)">
              <text class="action-icon">{{ (post && post.is_liked) ? '❤️' : '🩶' }}</text>
              <text class="action-count">{{ post ? (post.likes || 0) : 0 }}</text>
            </view>
        <view class="action-btn" @click="showCommentInput = !showCommentInput">
          <text class="action-icon">💬</text>
          <text class="action-count">{{ post.comments || 0 }}</text>
        </view>
        <view class="action-btn" @click="showShareDialog = true">
          <text class="action-icon">📤</text>
          <text class="action-text">分享</text>
        </view>
      </view>
      
      <!-- 评论输入区域 -->
      <view v-if="showCommentInput" class="comment-input-section">
        <view class="comment-input-box">
          <view class="add-button" :class="{disabled: commentImages.length >= 3}" @click="chooseCommentImage">
            <text class="add-icon">+</text>
          </view>
          <textarea
            v-model="commentText"
            class="comment-input"
            placeholder="输入评论（最多50字）"
            maxlength="50"
            :auto-height="true"
          />
          <view class="send-button" @click="submitComment">
            <text class="send-icon">发送</text>
          </view>
        </view>
        <view class="image-limit-tip">
          <text class="tip-text">图片：{{ commentImages.length }}/3</text>
        </view>
        <view v-if="commentImages.length" class="comment-images">
          <view v-for="(img, idx) in commentImages" :key="idx" class="comment-image-item">
            <image :src="getImageUrl(img)" class="comment-image"/>
            <text class="remove-image" @click="removeCommentImage(idx)">✖</text>
          </view>
        </view>
      </view>
      
      <!-- 评论列表 -->
      <view class="comments-section">
        <view class="comments-title">评论 ({{ comments.length }})</view>
        <view v-if="comments.length === 0" class="no-comments">暂无评论</view>
        <view v-else class="comment-list">
          <view v-for="comment in comments" :key="comment.uid + comment.created_time" class="comment-item">
            <image class="comment-avatar" :src="getAvatarUrl(comment.avatar)" mode="aspectFill" @click="goToPersonalSpace(comment.uid)"/>
            <view class="comment-content">
              <view class="comment-header">
                <text class="comment-username" @click="goToPersonalSpace(comment.uid)">{{ comment.username }}</text>
                <text class="comment-time">{{ formatTime(comment.created_time) }}</text>
                <view v-if="canDeleteComment(comment)" class="comment-delete" @click="deleteComment(comment)">删除</view>
              </view>
              <text class="comment-text">{{ comment.text_content }}</text>
              <view v-if="comment.image_urls && comment.image_urls.length" class="comment-images">
                <image 
                  v-for="(img, idx) in comment.image_urls" 
                  :key="idx" 
                  :src="getImageUrl(img)" 
                  class="comment-image"
                  @click="previewImage(img, comment.image_urls)"
                />
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <view v-else class="error">
      <text>动态不存在或已被删除</text>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js';
import ShareDialog from '@/components/ShareDialog.vue';

export default {
  components: {
    ShareDialog
  },
  data() {
    return {
      post: null,
      loading: true,
      pid: null,
      comments: [],
      showCommentInput: false,
      commentText: '',
      commentImages: [],
      showShareDialog: false
    }
  },
  computed: {
    isMyPost() {
      const currentUser = uni.getStorageSync('currentUser');
      // 管理员(type=0)可以删除任何动态，或者动态作者可以删除自己的动态
      return currentUser && (currentUser.type === 0 || currentUser.uid === this.post?.uid);
    }
  },
  onLoad(options) {
    this.pid = parseInt(options.pid);
    if (this.pid) {
      this.fetchPostDetail();
      this.fetchComments();
    } else {
      this.loading = false;
    }
  },
  methods: {
    async fetchPostDetail() {
      try {
        const res = await Database.getPostById(this.pid);
        if (res.success) {
          this.post = res.post;
        } else {
          uni.showToast({ title: res.message || '获取动态失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取动态详情失败:', error);
        uni.showToast({ title: '获取动态失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    goBack() {
      uni.switchTab({
        url: '/pages/community/index'
      })
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
    
    previewImage(current, imageUrls) {
      // 如果传入的是数组，说明是评论图片
      if (Array.isArray(imageUrls)) {
        const urls = imageUrls.map(img => this.getImageUrl(img));
        uni.previewImage({
          current: this.getImageUrl(current),
          urls: urls
        });
      } else {
        // 否则是动态图片
        const urls = this.post.image_urls.map(img => this.getImageUrl(img));
        uni.previewImage({
          current: this.getImageUrl(current),
          urls: urls
        });
      }
    },
    
    async likePost(post) {
      try {
        const res = await Database.likePost(post.pid);
        if (res.success) {
          // 更新本地点赞状态和数量
          post.is_liked = res.is_liked;
          post.likes = res.likes_count;
          uni.showToast({ 
            title: res.is_liked ? '点赞成功' : '取消点赞', 
            icon: 'success' 
          });
        } else {
          uni.showToast({ title: res.message || '操作失败', icon: 'none' });
        }
      } catch (error) {
        console.error('点赞操作失败:', error);
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },
    
    async fetchComments() {
      try {
        const res = await Database.getComments(this.pid);
        if (res.success) {
          this.comments = res.comments || [];
        }
      } catch (error) {
        console.error('获取评论失败:', error);
      }
    },
    
    async submitComment() {
      if (!this.commentText.trim() && this.commentImages.length === 0) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' });
        return;
      }
      
      try {
        const res = await Database.createComment(this.pid, this.commentText, this.commentImages);
        if (res.success) {
          uni.showToast({ title: '评论成功', icon: 'success' });
          this.commentText = '';
          this.commentImages = [];
          this.showCommentInput = false;
          this.fetchComments();
          this.post.comments = (this.post.comments || 0) + 1;
        } else {
          uni.showToast({ title: res.message || '评论失败', icon: 'none' });
        }
      } catch (error) {
        console.error('评论失败:', error);
        uni.showToast({ title: '评论失败', icon: 'none' });
      }
    },
    
    chooseCommentImage() {
      // 检查是否已达到最大图片数量限制
      if (this.commentImages.length >= 3) {
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
          
          // 检查文件大小（100MB限制）
          uni.getFileInfo({
            filePath,
            success: (fileInfo) => {
              const maxSize = 100 * 1024 * 1024; // 100MB
              if (fileInfo.size > maxSize) {
                uni.showToast({
                  title: '图片大小不能超过100MB',
                  icon: 'none'
                });
                return;
              }
              
              uni.showLoading({ title: '上传中...' });
              
              uni.uploadFile({
                url: `${config.API_BASE_URL}/upload/postimage`,
                filePath,
                name: 'file',
                header: {
                  'Authorization': `Bearer ${Database.getToken()}`
                },
                success: (uploadRes) => {
                  uni.hideLoading();
                  const data = JSON.parse(uploadRes.data);
                  if (data.success && data.url) {
                    this.commentImages.push(data.url);
                    uni.showToast({ title: '图片上传成功', icon: 'success' });
                  } else {
                    uni.showToast({ title: data.message || '图片上传失败', icon: 'none' });
                  }
                },
                fail: () => {
                  uni.hideLoading();
                  uni.showToast({ title: '图片上传失败', icon: 'none' });
                }
              });
            },
            fail: () => {
              uni.showToast({ title: '获取文件信息失败', icon: 'none' });
            }
          });
        }
      });
    },
    
    removeCommentImage(index) {
      this.commentImages.splice(index, 1);
    },
    
    canDeleteComment(comment) {
      const currentUser = uni.getStorageSync('currentUser');
      // 管理员(type=0)可以删除任何评论，或者评论作者可以删除自己的评论，或者动态作者可以删除自己动态下的评论
      return currentUser && (currentUser.type === 0 || currentUser.uid === comment.uid || currentUser.uid === this.post.uid);
    },
    
    async deleteComment(comment) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条评论吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await Database.deleteComment(comment.cid);
              if (result.success) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.fetchComments();
                this.post.comments = Math.max((this.post.comments || 0) - 1, 0);
              } else {
                uni.showToast({ title: result.message || '删除失败', icon: 'none' });
              }
            } catch (error) {
              console.error('删除评论失败:', error);
              uni.showToast({ title: '删除失败', icon: 'none' });
            }
          }
        }
      });
    },
    
    deletePost() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条动态吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await Database.deletePost(this.pid);
              if (result.success) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                setTimeout(() => {
                  uni.navigateBack();
                }, 1000);
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
    
    getFileName(filePath) {
      if (!filePath) return '未知文件';
      const fileName = filePath.split('/').pop();
      return fileName || '未知文件';
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
    
    goToPersonalSpace(uid) {
      uni.navigateTo({
        url: `/pages/personalSpace/index?uid=${uid}`
      });
    }
  }
}
</script>

<style scoped>
.post-detail-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.header-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 32rpx;
  background: white;
  border-bottom: 1rpx solid #eee;
}

.back-btn {
  font-size: 28rpx;
  color: #2ca163;
  margin-right: 24rpx;
}

.header-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
}

.loading, .error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  font-size: 28rpx;
  color: #7f8c8d;
}

.post-detail {
  background: white;
  margin: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #e0e0e0;
}

.user-info {
  flex: 1;
}

.username {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.post-time {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
}

.delete-btn {
  padding: 12rpx 24rpx;
  background: #e74c3c;
  color: white;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.post-content {
  padding: 32rpx;
}

.content-text {
  font-size: 28rpx;
  color: #2c3e50;
  line-height: 1.6;
}

.post-images {
  padding: 0 32rpx 32rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.post-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: #eee;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  padding: 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  border-radius: 8rpx;
  background: #f8f9fa;
}

.action-btn.liked {
  background: #ffe6e6;
  color: #e74c3c;
}

.comment-input-section {
  width: 90%;
  background: white;
  padding: 24rpx;
  margin: 0;
  border-radius: 16rpx;
}

.comment-input-box {
  display: flex;
  align-items: flex-start;
  background: #f8f8f8;
  border-radius: 24rpx;
  padding: 16rpx 20rpx;
  gap: 16rpx;
  min-height: 80rpx;
  margin-bottom: 16rpx;
}

.comment-input {
  flex: 1;
  min-height: 60rpx;
  max-height: 120rpx;
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

.add-button.disabled {
  background: #ccc;
  cursor: not-allowed;
}

.add-button.disabled:active {
  transform: none;
  background: #ccc;
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
  background:#098532;
  transform: scale(0.95);
}

.send-icon {
  font-size: 24rpx;
  color: white;
}

.image-limit-tip {
  margin-bottom: 16rpx;
  text-align: right;
}

.tip-text {
  font-size: 22rpx;
  color: #999;
}

.comment-images {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
}

.comment-image-item {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}

.comment-image {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

.remove-image {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 32rpx;
  height: 32rpx;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}

.comments-section {
  background: white;
  margin: 16rpx 0;
  border-radius: 16rpx;
  padding: 24rpx;
}

.comments-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 24rpx;
}

.no-comments {
  text-align: center;
  color: #999;
  padding: 40rpx 0;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.comment-item {
  display: flex;
  gap: 16rpx;
}

.comment-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.comment-username {
  font-size: 26rpx;
  font-weight: bold;
  color: #2c3e50;
}

.comment-time {
  font-size: 20rpx;
  color: #999;
}

.comment-delete {
  font-size: 20rpx;
  color: #e74c3c;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  background: #ffe6e6;
}

.comment-text {
  font-size: 26rpx;
  color: #2c3e50;
  line-height: 1.5;
  margin-bottom: 8rpx;
}

.comment-images {
  display: flex;
  gap: 12rpx;
  flex-wrap: wrap;
  margin-top: 8rpx;
}

.comment-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  background: #eee;
}

.action-icon {
  font-size: 24rpx;
}

.action-count, .action-text {
  font-size: 24rpx;
  color: #7f8c8d;
}

.post-files {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin: 12rpx 0;
}

.post-file-item {
  display: flex;
  align-items: center;
  background: #f0f0f0;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-file-item:active {
  background: #e0e0e0;
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
</style>
