/**
 * 聊天导航工具
 * 提供安全的聊天页面跳转功能
 */

import secureParamsManager from './secureParams.js'

class ChatNavigation {
  /**
   * 跳转到私聊页面
   * @param {string} uid - 用户ID
   * @param {string} name - 用户名称
   * @param {string} avatar - 用户头像
   */
  static navigateToPrivateChat(uid, name, avatar = '/static/avatar.png') {
    const params = {
      type: 'private',
      targetId: uid,
      name: name,
      avatar: avatar
    }
    
    const secureUrl = secureParamsManager.createSecureChatUrl('/pages/chat/private', params)
    
    uni.navigateTo({
      url: secureUrl
    })
  }

  /**
   * 跳转到群聊页面
   * @param {string} gid - 群组ID
   * @param {string} name - 群组名称
   * @param {string} avatar - 群组头像
   */
  static navigateToGroupChat(gid, name, avatar = '/static/avatarg.png') {
    const params = {
      type: 'group',
      targetId: gid,
      name: name,
      avatar: avatar
    }
    
    const secureUrl = secureParamsManager.createSecureChatUrl('/pages/chat/group', params)
    
    uni.navigateTo({
      url: secureUrl
    })
  }

  /**
   * 生成安全的私聊URL（用于分享等场景）
   * @param {string} uid - 用户ID
   * @param {string} name - 用户名称
   * @param {string} avatar - 用户头像
   * @returns {string} 安全的URL
   */
  static generatePrivateChatUrl(uid, name, avatar = '/static/avatar.png') {
    const params = {
      type: 'private',
      targetId: uid,
      name: name,
      avatar: avatar
    }
    
    return secureParamsManager.createSecureChatUrl('/pages/chat/private', params)
  }

  /**
   * 生成安全的群聊URL（用于分享等场景）
   * @param {string} gid - 群组ID
   * @param {string} name - 群组名称
   * @param {string} avatar - 群组头像
   * @returns {string} 安全的URL
   */
  static generateGroupChatUrl(gid, name, avatar = '/static/avatarg.png') {
    const params = {
      type: 'group',
      targetId: gid,
      name: name,
      avatar: avatar
    }
    
    return secureParamsManager.createSecureChatUrl('/pages/chat/group', params)
  }
}

export default ChatNavigation
