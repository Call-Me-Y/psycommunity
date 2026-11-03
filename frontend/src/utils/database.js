// 数据库工具类 - 使用uni-app本地存储API
// 整合所有功能模块
import AuthModule from './auth.js';
import UserModule from './user.js';
import PostModule from './post.js';
import ChatModule from './chat.js';
import SurveyModule from './survey.js';
import config from '../config/api.js';

class Database {
  constructor() {
    this.baseURL = config.API_BASE_URL; // 使用配置文件中的API基础URL
    
    // 初始化各个功能模块
    this.auth = new AuthModule(this.baseURL);
    this.user = new UserModule(this.baseURL);
    this.post = new PostModule(this.baseURL);
    this.chat = new ChatModule(this.baseURL);
    this.survey = new SurveyModule(this.baseURL);
  }

  // ========== 认证相关方法 ==========
  getToken() {
    return this.auth.getToken();
  }

  setToken(token) {
    return this.auth.setToken(token);
  }

  clearToken() {
    return this.auth.clearToken();
  }

  validateLogin(uid, password) {
    return this.auth.validateLogin(uid, password);
  }

  verifyToken() {
    return this.auth.verifyToken();
  }

  changePassword(oldPassword, newPassword) {
    return this.auth.changePassword(oldPassword, newPassword);
  }

  registerUser(userData) {
    return this.auth.registerUser(userData);
  }

  // ========== 用户管理相关方法 ==========
  getAllUsers() {
    return this.user.getAllUsers();
  }

  addUser(userData) {
    return this.user.addUser(userData);
  }

  updateUser(userData) {
    return this.user.updateUser(userData);
  }

  deleteUser(uid) {
    return this.user.deleteUser(uid);
  }

  getUserById(id) {
    return this.user.getUserById(id);
  }

  createUserInfo(id, name, avatar) {
    return this.user.createUserInfo(id, name, avatar);
  }

  updateUserProfile(id, name, avatar) {
    return this.user.updateUserProfile(id, name, avatar);
  }

  getUserInfo(uid) {
    return this.user.getUserInfo(uid);
  }

  searchUsers(keyword) {
    return this.user.searchUsers(keyword);
  }

  // ========== 动态相关方法 ==========
  createPost(postData) {
    return this.post.createPost(postData);
  }

  addUserPost(userId, postId) {
    return this.post.addUserPost(userId, postId);
  }

  getPosts(orderBy = 'time', limit = 20, offset = 0) {
    return this.post.getPosts(orderBy, limit, offset);
  }

  getPostById(pid) {
    return this.post.getPostById(pid);
  }

  deletePost(pid) {
    return this.post.deletePost(pid);
  }

  likePost(pid) {
    return this.post.likePost(pid);
  }

  searchPosts(keyword, orderBy = 'time', limit = 20, offset = 0) {
    return this.post.searchPosts(keyword, orderBy, limit, offset);
  }

  getUserPosts(uid, orderBy = 'time', limit = 20, offset = 0) {
    return this.post.getUserPosts(uid, orderBy, limit, offset);
  }

  updatePostPrivacy(pid, isPublic) {
    return this.post.updatePostPrivacy(pid, isPublic);
  }

  getComments(pid) {
    return this.post.getComments(pid);
  }

  createComment(pid, textContent, imageUrls = []) {
    return this.post.createComment(pid, textContent, imageUrls);
  }

  deleteComment(cid) {
    return this.post.deleteComment(cid);
  }

  getAllPostsStats() {
    return this.post.getAllPostsStats();
  }

  // ========== 聊天通讯相关方法 ==========
  getUserGroups() {
    return this.chat.getUserGroups();
  }

  getUserContacts() {
    return this.chat.getUserContacts();
  }

  searchGroups(keyword) {
    return this.chat.searchGroups(keyword);
  }

  createGroup(name, avatar) {
    return this.chat.createGroup(name, avatar);
  }

  joinGroup(gid) {
    return this.chat.joinGroup(gid);
  }

  addContact(contactUid) {
    return this.chat.addContact(contactUid);
  }

  getUnreadCount(contactType, contactId) {
    return this.chat.getUnreadCount(contactType, contactId);
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

  // 获取所有已读状态
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

  sendPrivateMessage(receiverUid, content, msgType = 0, link=null) {
    return this.chat.sendPrivateMessage(receiverUid, content, msgType, link);
  }

  sendAdminMessage(receiverUid, content, msgType = 0, link = null) {
    return this.chat.sendAdminMessage(receiverUid, content, msgType, link);
  }

  sendGroupMessage(gid, content, msgType = 0, link=null) {
    return this.chat.sendGroupMessage(gid, content, msgType, link);
  }

  getPrivateMessages(otherUid, limit = 50, offset = 0) {
    return this.chat.getPrivateMessages(otherUid, limit, offset);
  }

  getGroupMessages(gid, limit = 50, offset = 0) {
    return this.chat.getGroupMessages(gid, limit, offset);
  }

  getGroupMembers(gid) {
    return this.chat.getGroupMembers(gid);
  }

  getLatestMessages(limit = 50) {
    return this.chat.getLatestMessages(limit);
  }

  leaveGroup(gid) {
    return this.chat.leaveGroup(gid);
  }

  deleteContact(contactUid) {
    return this.chat.deleteContact(contactUid);
  }

  updateContactRemark(contactUid, remark) {
    return this.chat.updateContactRemark(contactUid, remark);
  }

  getContacts() {
    return this.chat.getContacts();
  }

  checkFriendRelationship(contactUid) {
    return this.chat.checkFriendRelationship(contactUid);
  }

  getGroupInfo(gid) {
    return this.chat.getGroupInfo(gid);
  }

  updateGroupInfo(gid, groupInfo) {
    return this.chat.updateGroupInfo(gid, groupInfo);
  }

  uploadGroupAvatar(filePath, gid) {
    return this.chat.uploadGroupAvatar(filePath, gid);
  }

  addFriend(uid) {
    return this.chat.addFriend(uid);
  }

  getUserGroupStats(uid = null) {
    return this.chat.getUserGroupStats(uid);
  }

  // ========== 已读消息相关方法 ==========
  updatePrivateReadStatus(contactUid, lastReadMsgId) {
    return this.chat.updatePrivateReadStatus(contactUid, lastReadMsgId);
  }

  updateGroupReadStatus(gid, lastReadMsgId) {
    return this.chat.updateGroupReadStatus(gid, lastReadMsgId);
  }

  getPrivateReadStatus(contactUid) {
    return this.chat.getPrivateReadStatus(contactUid);
  }

  getGroupReadStatus(gid) {
    return this.chat.getGroupReadStatus(gid);
  }

  getAllReadStatus() {
    return this.chat.getAllReadStatus();
  }

  syncReadStatusToServer(privateReadStatus = [], groupReadStatus = []) {
    return this.chat.syncReadStatusToServer(privateReadStatus, groupReadStatus);
  }

  // ========== 测评相关方法 ==========
  uploadSurveyImage(filePath, type = 'survey') {
    return this.survey.uploadSurveyImage(filePath, type);
  }

  getSurveys() {
    return this.survey.getSurveys();
  }

  getSurveyById(sid) {
    return this.survey.getSurveyById(sid);
  }

  submitSurveyAnswer(sid, answers, textInputQids = [], textInputAnswers = []) {
    return this.survey.submitSurveyAnswer(sid, answers, textInputQids, textInputAnswers);
  }

  createSurvey(surveyData) {
    return this.survey.createSurvey(surveyData);
  }

  getUserSurveyResults(uid = null) {
    return this.survey.getUserSurveyResults(uid);
  }

  getAllSurveyResults() {
    return this.survey.getAllSurveyResults();
  }

  deleteSurvey(sid) {
    return this.survey.deleteSurvey(sid);
  }

  getUserSurveyAnswersWithDetails(uid = null) {
    return this.survey.getUserSurveyAnswersWithDetails(uid);
  }

  getAllSurveyAnswersWithDetails() {
    return this.survey.getAllSurveyAnswersWithDetails();
  }
}

export default new Database();