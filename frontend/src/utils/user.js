// 用户管理相关API模块
class UserModule {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // 获取存储的token
  getToken() {
    return uni.getStorageSync('jwt_token');
  }

  // 获取所有用户（管理员功能）
  getAllUsers() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/admin/users`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }

  // 添加用户（管理员功能）
  addUser(userData) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/admin/users`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
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

  // 更新用户（管理员功能）
  updateUser(userData) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/admin/users/${userData.uid}`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${token}`
        },
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

  // 删除用户（管理员功能）
  deleteUser(uid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/admin/users/${uid}`,
        method: 'DELETE',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }

  // 获取用户详细信息（从userinfo表）
  getUserById(id) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/user/${id}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 创建用户信息（userinfo表）
  createUserInfo(id, name, avatar) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/user/${id}`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { name, avatar },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 更新用户资料（userinfo表）
  updateUserProfile(id, name, avatar) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/user/${id}`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { name, avatar },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取用户信息
  getUserInfo(uid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/user/${uid}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 搜索用户
  searchUsers(keyword) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/search/users`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { keyword },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }
}

export default UserModule;
