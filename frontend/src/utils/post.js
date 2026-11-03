// 动态相关API模块
class PostModule {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // 获取存储的token
  getToken() {
    return uni.getStorageSync('jwt_token');
  }

  // 发布动态
  createPost(postData) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: postData,
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 用户添加动态编号
  addUserPost(userId, postId) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/user/${userId}/addPost`,
        method: 'POST',
        data: { postId },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取动态列表
  getPosts(orderBy = 'time', limit = 20, offset = 0) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { order_by: orderBy, limit, offset },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取单个动态
  getPostById(pid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/${pid}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 删除动态
  deletePost(pid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/${pid}`,
        method: 'DELETE',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 点赞/取消点赞动态
  likePost(pid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/${pid}/like`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 搜索动态
  searchPosts(keyword, orderBy = 'time', limit = 20, offset = 0) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/search`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { keyword, order_by: orderBy, limit, offset },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取用户自己的动态
  getUserPosts(uid, orderBy = 'time', limit = 20, offset = 0) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/user/${uid}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { order_by: orderBy, limit, offset },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 更新动态隐私设置
  updatePostPrivacy(pid, isPublic) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/${pid}/privacy`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { is_public: isPublic },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取评论
  getComments(pid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/${pid}/comments`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 创建评论
  createComment(pid, textContent, imageUrls = []) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/${pid}/comments`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { text_content: textContent, image_urls: imageUrls },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 删除评论
  deleteComment(cid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/comments/${cid}`,
        method: 'DELETE',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取所有动态统计（管理员）
  getAllPostsStats() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/posts/stats/all`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }
}

export default PostModule;
