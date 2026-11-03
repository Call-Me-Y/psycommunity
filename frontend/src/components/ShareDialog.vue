<template>
  <view v-if="visible" class="share-overlay" @click="closeDialog">
    <view class="share-dialog" @click.stop>
      <view class="share-header">
        <text class="share-title">分享到</text>
        <text class="close-btn" @click="closeDialog">×</text>
      </view>
      
      <!-- 搜索栏 -->
      <view class="search-section">
        <view class="search-input-wrapper">
          <input 
            class="search-input" 
            type="text" 
            placeholder="搜索群组或好友" 
            v-model="searchKeyword"
            @input="onSearchInput"
          />
          <text class="search-icon">🔍</text>
        </view>
      </view>
      
      <scroll-view class="share-content" scroll-y="true">
        <!-- 群组列表 -->
        <view v-if="filteredGroups.length > 0" class="share-section">
          <text class="section-title">群组</text>
          <view class="contact-list">
            <view 
              v-for="group in filteredGroups" 
              :key="group.gid" 
              class="contact-item" 
              @click="shareToGroup(group)"
            >
              <image class="contact-avatar" :src="getAvatarUrl(group.avatar, 'group')" mode="aspectFill"/>
              <text class="contact-name">{{ group.name }}</text>
            </view>
          </view>
        </view>
        
         <!-- 好友列表 -->
         <view v-if="filteredContacts.length > 0 || (currentUser && shouldShowSelf)" class="share-section">
           <text class="section-title">好友</text>
           <view class="contact-list">
             <!-- 自己 -->
             <view v-if="currentUser && shouldShowSelf" class="contact-item" @click="shareToSelf">
               <image class="contact-avatar" :src="getSelfAvatarUrl()" mode="aspectFill"/>
               <text class="contact-name">{{ currentUser.username || currentUser.name || currentUser.uid }} (自己)</text>
             </view>
             <!-- 其他好友 -->
             <view 
               v-for="contact in filteredContacts" 
               :key="contact.uid" 
               class="contact-item" 
               @click="shareToContact(contact)"
             >
               <image class="contact-avatar" :src="getAvatarUrl(contact.avatar, 'private')" mode="aspectFill"/>
               <text class="contact-name">{{ contact.name }}</text>
             </view>
           </view>
         </view>
        
        <!-- 空状态 -->
        <view v-if="filteredGroups.length === 0 && filteredContacts.length === 0 && !shouldShowSelf" class="empty-state">
          <text class="empty-text">{{ searchKeyword ? '未找到相关群组或好友' : '暂无群组和好友' }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import config from '../config/api.js';
import Database from '@/utils/database.js';

export default {
  name: 'ShareDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    shareType: {
      type: String,
      required: true, // 'post' 或 'survey'
      validator: value => ['post', 'survey'].includes(value)
    },
    shareId: {
      type: [Number, String, null],
      required: false,
      default: null
    },
    shareTitle: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      groups: [],
      contacts: [],
      loading: false,
      currentUser: null,
      searchKeyword: ''
    }
  },
  computed: {
    filteredGroups() {
      if (!this.searchKeyword) return this.groups;
      return this.groups.filter(group => 
        group.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );
    },
    
    filteredContacts() {
      if (!this.searchKeyword) return this.contacts;
      return this.contacts.filter(contact => 
        contact.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );
    },
    
    shouldShowSelf() {
      if (!this.currentUser) return false;
      if (!this.searchKeyword) return true;
      
      const selfName = this.currentUser.username || this.currentUser.name || this.currentUser.uid || '';
      return selfName.toLowerCase().includes(this.searchKeyword.toLowerCase());
    }
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadContacts();
        this.searchKeyword = ''; // 重置搜索关键词
      }
    }
  },
  methods: {
    async loadContacts() {
      try {
        this.loading = true;
        
        // 并行加载群组、好友列表和当前用户信息
        const [groupsRes, contactsRes, userRes] = await Promise.all([
          Database.getUserGroups(),
          Database.getUserContacts(),
          Database.verifyToken()
        ]);
        
        if (groupsRes.success) {
          this.groups = groupsRes.groups || [];
        }
        
        if (contactsRes.success) {
          this.contacts = contactsRes.contacts || [];
        }
        
        if (userRes.success) {
          // 获取用户详细信息，包括头像
          const userDetailRes = await Database.getUserById(userRes.user.uid);
          if (userDetailRes.success) {
            this.currentUser = {
              ...userRes.user,
              name: userDetailRes.user.name,
              avatar: this.getAvatarUrl(userDetailRes.user.avatar, 'private')
            };
          } else {
            this.currentUser = userRes.user;
          }
        }
      } catch (error) {
        console.error('加载联系人失败:', error);
        uni.showToast({ title: '加载失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    getAvatarUrl(avatar, chatType) {
      if (!avatar) {
        // 根据聊天类型返回不同的默认头像
        return chatType === 'group' ? '/static/avatarg.png' : '/static/avatar.png'
      }
      
      // 如果是完整URL，直接返回
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar
      }
      
      // 如果是相对路径，添加后端基础URL
      if (avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${avatar}`
      }
      
      // 如果是默认头像路径，直接返回
      if (avatar.startsWith('/static/')) {
        return avatar
      }
      
      // 默认情况，根据聊天类型返回不同的默认头像
      return chatType === 'group' ? '/static/avatarg.png' : '/static/avatar.png'
    },
    
    getSelfAvatarUrl() {
      if (!this.currentUser) return '/static/avatar.png';
      
      // 优先使用 avatar 字段，然后是 profile_picture
      const avatar = this.currentUser.avatar || this.currentUser.profile_picture;
      
      // 使用统一的头像处理方法
      return this.getAvatarUrl(avatar, 'private');
    },
    
    onSearchInput() {
      // 搜索输入处理，这里可以添加防抖逻辑
      // 当前直接使用 v-model 绑定，实时搜索
    },
    
    async shareToGroup(group) {
      try {
        const shareData = await this.getShareData();
        if (!shareData) {
          uni.showToast({ title: '获取分享信息失败', icon: 'none' });
          return;
        }
        
        const res = await Database.sendGroupMessage(group.gid, shareData.content, 4, shareData.url);
        if (res.success) {
          uni.showToast({ title: '分享成功', icon: 'success' });
          this.closeDialog();
        } else {
          uni.showToast({ title: res.message || '分享失败', icon: 'none' });
        }
      } catch (error) {
        console.error('分享到群组失败:', error);
        uni.showToast({ title: '分享失败', icon: 'none' });
      }
    },
    
     async shareToContact(contact) {
       try {
         const shareData = await this.getShareData();
         if (!shareData) {
           uni.showToast({ title: '获取分享信息失败', icon: 'none' });
           return;
         }
         
         const res = await Database.sendPrivateMessage(contact.uid, shareData.content, 4, shareData.url);
         if (res.success) {
           uni.showToast({ title: '分享成功', icon: 'success' });
           this.closeDialog();
         } else {
           uni.showToast({ title: res.message || '分享失败', icon: 'none' });
         }
       } catch (error) {
         console.error('分享给好友失败:', error);
         uni.showToast({ title: '分享失败', icon: 'none' });
       }
     },
     
     async shareToSelf() {
       try {
         const shareData = await this.getShareData();
         if (!shareData) {
           uni.showToast({ title: '获取分享信息失败', icon: 'none' });
           return;
         }
         
         const res = await Database.sendPrivateMessage(this.currentUser.uid, shareData.content, 4, shareData.url);
         if (res.success) {
           uni.showToast({ title: '分享成功', icon: 'success' });
           this.closeDialog();
         } else {
           uni.showToast({ title: res.message || '分享失败', icon: 'none' });
         }
       } catch (error) {
         console.error('分享给自己失败:', error);
         uni.showToast({ title: '分享失败', icon: 'none' });
       }
     },
    
    async getShareData() {
      try {
        // 检查 shareId 是否有效
        if (!this.shareId) {
          console.warn('shareId 为空，无法获取分享数据');
          return null;
        }
        
        const url = this.getShareUrl();
        
        if (this.shareType === 'post') {
          // 获取动态详情
          const postRes = await Database.getPostById(this.shareId);
          if (postRes.success && postRes.post) {
            const post = postRes.post;
            const senderName = post.username || post.uid || '未知用户';
            const content = post.text_content || '';
            const shortContent = content.length > 20 ? content.substring(0, 20) + '...' : content;
            
            return {
              content: `[分享动态] ${senderName}：${shortContent}`,
              url: url
            };
          }
        } else if (this.shareType === 'survey') {
          // 获取测评详情
          const surveyRes = await Database.getSurveyById(this.shareId);
          if (surveyRes.success && surveyRes.survey) {
            const survey = surveyRes.survey;
            return {
              content: `[分享测评] ${survey.name || '测评分享'}`,
              url: url
            };
          }
        }
        
        return null;
      } catch (error) {
        console.error('获取分享数据失败:', error);
        return null;
      }
    },
    
    getShareUrl() {
      if (!this.shareId) {
        return '';
      }
      
      if (this.shareType === 'post') {
        return `${config.FRONTEND_BASE_URL}/pages/community/postDetail?pid=${this.shareId}`;
      } else {
        return `${config.FRONTEND_BASE_URL}/pages/survey/detail?id=${this.shareId}`;
      }
    },
    
    closeDialog() {
      this.$emit('close');
    }
  }
}
</script>

<style scoped>
.share-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.share-dialog {
  width: 100%;
  background: white;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  overflow: hidden;
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.share-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
}

.close-btn {
  font-size: 40rpx;
  color: #999;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-section {
  padding: 0 32rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  height: 72rpx;
  padding: 0 80rpx 0 32rpx;
  background: #f8f9fa;
  border: 1rpx solid #e9ecef;
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #2c3e50;
}

.search-input::placeholder {
  color: #999;
}

.search-icon {
  position: absolute;
  right: 24rpx;
  font-size: 28rpx;
  color: #999;
  pointer-events: none;
}

.share-content {
  height: 50vh;
  max-height: 50vh;
  padding: 24rpx 32rpx 32rpx;
}

.share-section {
  margin-bottom: 32rpx;
}

.section-title {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  border-radius: 12rpx;
  background: #f8f9fa;
  transition: background-color 0.2s;
}

.contact-item:active {
  background: #e9ecef;
}

.contact-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #e0e0e0;
}

.contact-name {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
