<template>
  <view class="user-management-container">
    <!-- 头部 -->
    <view class="header">
      <view class="nav-bar">
        <view class="nav-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>

      <view class="header-content">
        <text class="header-title">账号管理</text>
        <button class="add-user-btn" @click="showAddDialog">新增用户</button>
      </view>
    </view>
        </view>

    <!-- 用户列表 -->
    <view class="user-list">
      <view class="table-header">
        <text class="col-uid">用户ID</text>
        <text class="col-password">密码</text>
        <text class="col-type">类型</text>
        <text class="col-actions">操作</text>
      </view>
      
      <view class="table-body">
        <view class="table-row" v-for="(user, index) in users" :key="user.uid">
          <text class="col-uid">{{ user.uid }}</text>
          <view class="col-password">
            <text class="password-hidden">已加密</text>
          </view>
          <text class="col-type">{{ getTypeName(user.type) }}</text>
          <view class="col-actions">
            <button class="edit-btn" @click="editUser(user, index)">编辑</button>
            <button class="delete-btn" @click="deleteUser(user.uid, index)">删除</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 新增用户弹窗 -->
    <view class="dialog-overlay" v-if="showAddUserDialog" @click="closeAddDialog">
      <view class="dialog-content" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">新增用户</text>
          <text class="close-btn" @click="closeAddDialog">×</text>
        </view>
        <view class="dialog-body">
          <view class="form-group">
            <text class="form-label">用户ID:</text>
            <input class="form-input" v-model="newUser.uid" placeholder="请输入用户ID" maxlength="50" />
          </view>
          <view class="form-group">
            <text class="form-label">密码:</text>
            <input class="form-input" v-model="newUser.password" placeholder="请输入至少8位密码" maxlength="72" password />
          </view>
          <view class="form-group">
            <text class="form-label">类型:</text>
            <picker @change="onTypeChange" :value="typeIndex" :range="typeOptions">
              <view class="picker-view">
                {{ typeOptions[typeIndex] }}
              </view>
            </picker>
          </view>
        </view>
        <view class="dialog-footer">
          <button class="cancel-btn" @click="closeAddDialog">取消</button>
          <button class="confirm-btn" @click="addUser">确认</button>
        </view>
      </view>
    </view>

    <!-- 编辑用户弹窗 -->
    <view class="dialog-overlay" v-if="showEditUserDialog" @click="closeEditDialog">
      <view class="dialog-content" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">编辑用户</text>
          <text class="close-btn" @click="closeEditDialog">×</text>
        </view>
        <view class="dialog-body">
          <view class="form-group">
            <text class="form-label">用户ID:</text>
            <input class="form-input" v-model="editUserData.uid" disabled />
          </view>
          <view class="form-group">
            <text class="form-label">密码:</text>
            <input class="form-input" v-model="editUserData.password" placeholder="留空则不修改密码" maxlength="72" password />
          </view>
          <view class="form-group">
            <text class="form-label">类型:</text>
            <picker @change="onEditTypeChange" :value="editTypeIndex" :range="typeOptions">
              <view class="picker-view">
                {{ typeOptions[editTypeIndex] }}
              </view>
            </picker>
          </view>
        </view>
        <view class="dialog-footer">
          <button class="cancel-btn" @click="closeEditDialog">取消</button>
          <button class="confirm-btn" @click="updateUser">确认</button>
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
      users: [],
      showAddUserDialog: false,
      showEditUserDialog: false,
      newUser: {
        uid: '',
        password: '',
        type: 2
      },
      editUserData: {
        uid: '',
        password: '',
        type: 1
      },
      editIndex: -1,
      typeOptions: ['管理员', '教师', '学生'],
      typeIndex: 2,
      editTypeIndex: 1
    }
  },
  onLoad() {
    this.loadUsers();
  },
  methods: {
    goBack() {
      uni.switchTab({
        url: '/pages/profile/index'
      })
    },

    // 验证新增用户ID输入（只允许数字和英文字母）
    validateNewUid(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.newUser.uid = filteredValue;
        uni.showToast({
          title: '用户ID只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 验证新增用户密码输入（只允许数字和英文字母）
    validateNewPassword(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.newUser.password = filteredValue;
        uni.showToast({
          title: '密码只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 验证编辑用户ID输入（只允许数字和英文字母）
    validateEditUid(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.editUserData.uid = filteredValue;
        uni.showToast({
          title: '用户ID只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 验证编辑用户密码输入（只允许数字和英文字母）
    validateEditPassword(event) {
      const value = event.detail.value;
      const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
      if (value !== filteredValue) {
        this.editUserData.password = filteredValue;
        uni.showToast({
          title: '密码只能包含数字和英文字母',
          icon: 'none',
          duration: 2000
        });
      }
    },

    // 加载用户列表
    async loadUsers() {
      try {
        uni.showLoading({ title: '加载中...' });
        const result = await Database.getAllUsers();
        if (result.success) {
          this.users = result.users.map(user => ({
            ...user,
            showPassword: false
          }));
        } else {
          uni.showToast({
            title: result.message || '加载用户列表失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载用户列表错误:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },

    // 获取类型名称
    getTypeName(type) {
      const typeNames = {
        0: '管理员',
        1: '教师',
        2: '学生',
      };
      return typeNames[type] || '未知';
    },

    // 切换密码显示
    togglePassword(index) {
      this.users[index].showPassword = !this.users[index].showPassword;
    },

    // 显示新增用户弹窗
    showAddDialog() {
      this.newUser = {
        uid: '',
        password: '',
        type: 2
      };
      this.typeIndex = 2;
      this.showAddUserDialog = true;
    },

    // 关闭新增用户弹窗
    closeAddDialog() {
      this.showAddUserDialog = false;
    },

    // 类型选择变化
    onTypeChange(e) {
      this.typeIndex = e.detail.value;
      this.newUser.type = parseInt(e.detail.value);
    },

    // 编辑类型选择变化
    onEditTypeChange(e) {
      this.editTypeIndex = e.detail.value;
      this.editUserData.type = parseInt(e.detail.value);
    },

    // 新增用户
    async addUser() {
      if (!this.newUser.uid.trim() || !this.newUser.password.trim()) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }

      try {
        uni.showLoading({ title: '添加中...' });
        const result = await Database.addUser(this.newUser);
        if (result.success) {
          uni.showToast({
            title: '添加成功',
            icon: 'success'
          });
          this.closeAddDialog();
          this.loadUsers(); // 重新加载列表
        } else {
          uni.showToast({
            title: result.message || '添加失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('添加用户错误:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },

    // 编辑用户
    editUser(user, index) {
      this.editUserData = { ...user, password: '' };
      this.editIndex = index;
      this.editTypeIndex = user.type;
      this.showEditUserDialog = true;
    },

    // 关闭编辑用户弹窗
    closeEditDialog() {
      this.showEditUserDialog = false;
    },

    // 更新用户
    async updateUser() {
      if (!this.editUserData.uid.trim()) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }

      try {
        uni.showLoading({ title: '更新中...' });
        const result = await Database.updateUser(this.editUserData);
        if (result.success) {
          uni.showToast({
            title: '更新成功',
            icon: 'success'
          });
          this.closeEditDialog();
          this.loadUsers(); // 重新加载列表
        } else {
          uni.showToast({
            title: result.message || '更新失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('更新用户错误:', error);
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },

    // 删除用户
    async deleteUser(uid, index) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除用户 ${uid} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              uni.showLoading({ title: '删除中...' });
              const result = await Database.deleteUser(uid);
              if (result.success) {
                uni.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                this.users.splice(index, 1);
              } else {
                uni.showToast({
                  title: result.message || '删除失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('删除用户错误:', error);
              uni.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              });
            } finally {
              uni.hideLoading();
            }
          }
        }
      });
    }
  }
}
</script>

<style>
.user-management-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20rpx;
}

.header {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
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

.header-content {
  display: flex;
  align-items: center;
  padding: 30rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #2d3748;
}

.add-user-btn {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 5rpx 20rpx;
  font-size: 25rpx;
}

.user-list {
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  background: #f7fafc;
  padding: 20rpx;
  border-bottom: 2rpx solid #e2e8f0;
}

.col-uid {
  flex: 2;
  font-weight: bold;
  color: #2d3748;
}

.col-password {
  flex: 2;
  font-weight: bold;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.col-type {
  flex: 1;
  font-weight: bold;
  color: #2d3748;
}

.col-actions {
  flex: 2;
  font-weight: bold;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.table-body {
  max-height: 800rpx;
  overflow-y: auto;
}

.table-row {
  display: flex;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #e2e8f0;
  align-items: center;
  min-height: 60rpx;
}

.table-row:last-child {
  border-bottom: none;
}

.password-hidden {
  color: #a0aec0;
}

.password-visible {
  color: #2d3748;
  font-family: monospace;
}

.toggle-password-btn {
  background: #edf2f7;
  color: #4a5568;
  border: none;
  border-radius: 4rpx;
  padding: 4rpx 8rpx;
  font-size: 20rpx;
  min-width: 60rpx;
  height: 32rpx;
  line-height: 1;
  flex-shrink: 0;
}

.edit-btn {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4rpx;
  padding: 4rpx 8rpx;
  font-size: 20rpx;
  min-width: 50rpx;
  height: 32rpx;
  line-height: 1;
  flex-shrink: 0;
}

.delete-btn {
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 4rpx;
  padding: 4rpx 8rpx;
  font-size: 20rpx;
  min-width: 50rpx;
  height: 32rpx;
  line-height: 1;
  flex-shrink: 0;
}

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

/* 确保dialog内容不会遮挡picker */
.dialog-content {
  z-index: 1001;
}

/* 确保picker弹窗在最顶层 */
picker {
  z-index: 99999 !important;
  position: relative;
}

/* 针对uni-app的picker组件弹窗层级 */
.uni-picker-popup {
  z-index: 99999 !important;
}

/* 确保picker选择器在最顶层 */
.uni-picker-container {
  z-index: 99999 !important;
}

/* 隐藏picker遮罩层 */
.uni-picker-mask {
  display: none !important;
}

/* 隐藏所有可能的picker遮罩层 */
.uni-picker-popup .uni-picker-mask {
  display: none !important;
}

/* 隐藏picker弹窗的背景遮罩 */
.uni-picker-popup {
  background: transparent !important;
}

/* 确保picker弹窗没有背景遮罩 */
.uni-picker-popup::before {
  display: none !important;
}

.uni-picker-popup::after {
  display: none !important;
}

/* 确保picker弹窗内容在最顶层 */
.uni-picker-view {
  z-index: 99999 !important;
}

/* 确保picker弹窗容器在最顶层 */
.uni-picker-popup .uni-picker-container {
  z-index: 99999 !important;
}

.dialog-content {
  background: white;
  border-radius: 16rpx;
  width: 80%;
  max-width: 600rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #e2e8f0;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2d3748;
}

.close-btn {
  font-size: 40rpx;
  color: #a0aec0;
  cursor: pointer;
}

.dialog-body {
  padding: 30rpx;
}

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #2d3748;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e2e8f0;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.picker-view {
  height: 80rpx;
  border: 2rpx solid #e2e8f0;
  border-radius: 8rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #2d3748;
  position: relative;
  z-index: 2000;
}

/* 确保picker在dialog内部也能正确显示 */
.dialog-content picker {
  z-index: 99999 !important;
}

.dialog-content .picker-view {
  z-index: 99999 !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  padding: 30rpx;
  border-top: 1rpx solid #e2e8f0;
}

.cancel-btn {
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
}

.confirm-btn {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 28rpx;
}
</style>
