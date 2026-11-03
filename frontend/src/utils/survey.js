// 测评相关API模块
class SurveyModule {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // 获取存储的token
  getToken() {
    return uni.getStorageSync('jwt_token');
  }

  // 上传测评相关图片（封面、问题图片、选项图片）
  uploadSurveyImage(filePath, type = 'survey') {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: `${this.baseURL}/upload/surveyimage`,
        filePath,
        name: 'file',
        formData: {
          type: type // 'survey', 'question', 'option'
        },
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            reject(e);
          }
        },
        fail: (err) => reject(err)
      });
    });
  }

  // 获取测评列表
  getSurveys() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/surveys`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取测评详情
  getSurveyById(sid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/surveys/${sid}`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 提交测评答案
  submitSurveyAnswer(sid, answers, textInputQids = [], textInputAnswers = []) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/surveys/${sid}/submit`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          answers: answers,
          textInputQids: textInputQids,
          textInputAnswers: textInputAnswers
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 创建测评
  createSurvey(surveyData) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/surveys`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: surveyData,
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取用户测评结果统计
  getUserSurveyResults(uid = null) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      const url = uid ? `${this.baseURL}/surveys/results/user/${uid}` : `${this.baseURL}/surveys/results/user`;
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

  // 获取所有用户测评结果统计（管理员）
  getAllSurveyResults() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/surveys/results/all`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 删除测评（管理员功能）
  deleteSurvey(sid) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/surveys/${sid}`,
        method: 'DELETE',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      });
    });
  }

  // 获取用户SurveyAnswers详细信息
  getUserSurveyAnswersWithDetails(uid = null) {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      const url = uid ? `${this.baseURL}/surveys/answers/details/${uid}` : `${this.baseURL}/surveys/answers/details`;
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

  // 获取所有SurveyAnswers详细信息（管理员）
  getAllSurveyAnswersWithDetails() {
    const token = this.getToken();
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${this.baseURL}/surveys/answers/details/all`,
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

export default SurveyModule;
