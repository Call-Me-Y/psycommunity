// 聊天通讯相关API模块
class ChatModule {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // 获取存储的token
  getToken() {
    return uni.getStorageSync('jwt_token');
  }

  // 获取用户群组列表
  getUserGroups() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/groups`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取用户好友列表
  getUserContacts() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/contacts`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 搜索群组
  searchGroups(keyword) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/search/groups`,
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

  // 创建群组
  createGroup(name, avatar) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/groups`,
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

  // 加入群组
  joinGroup(gid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/groups/${gid}/join`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 添加好友
  addContact(contactUid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/contacts`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { contact_uid: contactUid },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取未读消息数量
  getUnreadCount(contactType, contactId) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/unread-count`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { type: contactType, id: contactId },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 发送私聊消息
  sendPrivateMessage(receiverUid, content, msgType = 0, link=null) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/private/send`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { receiver_uid: receiverUid, content, msg_type: msgType, link },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 发送管理员消息
  sendAdminMessage(receiverUid, content, msgType = 0, link = null) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/admin/send`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { receiver_uid: receiverUid, content, msg_type: msgType, link },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 发送群聊消息
  sendGroupMessage(gid, content, msgType = 0, link=null) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/group/send`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { gid, content, msg_type: msgType, link },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取私聊消息
  getPrivateMessages(otherUid, limit = 50, offset = 0) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/private/messages`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { other_uid: otherUid, limit, offset },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取群聊消息
  getGroupMessages(gid, limit = 50, offset = 0) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/group/messages`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { gid, limit, offset },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取群组成员
  getGroupMembers(gid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/group/members`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { gid },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取最新消息列表
  getLatestMessages(limit = 50) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/consultation/latest-messages`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { limit },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 退出群组
  leaveGroup(gid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/group/${gid}/leave`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 删除好友
  deleteContact(contactUid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/contact/${contactUid}`,
        method: 'DELETE',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 更新好友备注
  updateContactRemark(contactUid, remark) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/contact/${contactUid}/remark`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { remark },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取好友列表（包含备注）
  getContacts() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/contacts`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 检查好友关系
  checkFriendRelationship(contactUid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/check-friend/${contactUid}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取群组信息
  getGroupInfo(gid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/group/${gid}/info`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 更新群组信息
  updateGroupInfo(gid, groupInfo) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/group/${gid}/info`,
        method: 'PUT',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: groupInfo,
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 上传群头像
  uploadGroupAvatar(filePath, gid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: `${this.baseURL}/upload/groupavatar`,
        filePath,
        name: 'file',
        formData: {
          gid: gid
        },
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          // 检查响应状态码
          if (res.statusCode && res.statusCode >= 400) {
            // 如果是错误状态码，尝试解析错误信息
            let errorMessage = '上传失败';
            if (res.statusCode === 413) {
              errorMessage = '图片太大，请选择较小的图片';
            }
            
            // 尝试解析响应数据
            try {
              const errorData = JSON.parse(res.data);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // 如果解析失败，可能是HTML错误页面
              if (res.data && res.data.includes('413') || res.data.includes('Content Too Large')) {
                errorMessage = '图片太大，请选择较小的图片';
              }
            }
            
            reject(new Error(errorMessage));
            return;
          }
          
          // 检查响应内容是否为JSON
          if (!res.data || typeof res.data !== 'string') {
            reject(new Error('服务器响应格式错误'));
            return;
          }
          
          // 检查是否是HTML错误页面
          if (res.data.trim().startsWith('<')) {
            let errorMessage = '上传失败';
            if (res.data.includes('413') || res.data.includes('Content Too Large')) {
              errorMessage = '图片太大，请选择较小的图片';
            }
            reject(new Error(errorMessage));
            return;
          }
          
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            console.error('解析响应数据失败:', e, '响应内容:', res.data);
            reject(new Error('服务器响应格式错误'));
          }
        },
        fail: (err) => {
          console.error('上传文件失败:', err);
          let errorMessage = '上传失败';
          if (err.errMsg && err.errMsg.includes('413')) {
            errorMessage = '图片太大，请选择较小的图片';
          }
          reject(new Error(errorMessage));
        }
      });
    });
  }

  // 添加好友
  addFriend(uid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/contact/${uid}`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取用户群组消息统计
  getUserGroupStats(uid = null) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      const url = uid ? `${this.baseURL}/chat/group/stats/user/${uid}` : `${this.baseURL}/chat/group/stats/user`;
      uni.request({
        url: url,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // ========== 已读消息相关API ==========

  // 更新私聊已读状态
  updatePrivateReadStatus(contactUid, lastReadMsgId) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/private/read-status`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { 
          contact_uid: contactUid, 
          last_read_msg_id: lastReadMsgId 
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 更新群聊已读状态
  updateGroupReadStatus(gid, lastReadMsgId) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/group/read-status`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { 
          gid: gid, 
          last_read_msg_id: lastReadMsgId 
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取私聊已读状态
  getPrivateReadStatus(contactUid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/private/read-status`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { contact_uid: contactUid },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取群聊已读状态
  getGroupReadStatus(gid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/group/read-status`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { gid: gid },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 批量获取所有已读状态
  getAllReadStatus() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/read-status/all`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 同步已读状态到服务器
  syncReadStatusToServer(privateReadStatus = [], groupReadStatus = []) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/chat/read-status/sync`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`
        },
        data: { 
          private_read_status: privateReadStatus,
          group_read_status: groupReadStatus
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }
}

export default ChatModule;
