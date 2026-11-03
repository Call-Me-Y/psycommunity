<template>
  <view class="survey-detail-container">
    <view class="header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">测评填写</text>
      <view class="header-right"></view>
    </view>

    <scroll-view class="content" scroll-y v-if="survey">
      <!-- 测评信息 -->
      <view class="survey-info">
        <image class="survey-cover" :src="getImageUrl(survey.cover)" mode="aspectFill" @error="survey.cover = '/static/cover.jpg'"></image>
        <view class="survey-details">
          <text class="survey-title">{{ survey.name }}</text>
          <text class="survey-intro" v-if="survey.intro">{{ survey.intro }}</text>
          <text class="survey-info-text" v-if="survey.info">{{ survey.info }}</text>
        </view>
      </view>

      <!-- 问题列表 -->
      <view class="questions-section">
        <text class="section-title">请认真填写以下问题</text>
        
        <view class="question-list">
          <view 
            v-for="(question, index) in survey.questions" 
            :key="question.qid"
            class="question-item"
          >
            <view class="question-header">
              <text class="question-number">Q{{ index + 1 }}</text>
              <text class="question-type">{{ getQuestionTypeName(question.type) }}</text>
            </view>
            
            <view class="question-content">
              <text class="question-text">{{ question.content }}</text>
              <image 
                v-if="question.image" 
                class="question-image" 
                :src="getImageUrl(question.image)" 
                mode="aspectFill"
              />
            </view>

            <!-- 问题输入区域 -->
            <view class="question-input">
              <!-- 符合度打分 -->
              <view v-if="question.type === 0" class="rating-input">
                <view class="rating-scale">
                  <view class="rating-buttons">
                    <view 
                      v-for="score in [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]" 
                      :key="score"
                      class="rating-btn"
                      :class="{ active: answers[question.qid] === score }"
                      @click="setAnswer(question.qid, score)"
                    >
                      {{ score }}
                    </view>
                  </view>
                </view>
              </view>

              <!-- 是否题 -->
              <view v-else-if="question.type === 1" class="yesno-input">
                <view 
                  class="yesno-btn"
                  :class="{ active: answers[question.qid] === 1 }"
                  @click="setAnswer(question.qid, 1)"
                >
                  是
                </view>
                <view 
                  class="yesno-btn"
                  :class="{ active: answers[question.qid] === 0 }"
                  @click="setAnswer(question.qid, 0)"
                >
                  否
                </view>
              </view>

              <!-- 单选题 -->
              <view v-else-if="question.type === 2" class="single-choice">
                <view 
                  v-for="option in question.options" 
                  :key="option.oid"
                  class="option-item"
                  :class="{ active: answers[question.qid] === option.value }"
                  @click="setAnswer(question.qid, option.value)"
                >
                  <view class="option-content">
                    <text class="option-text">{{ option.content }}</text>
                    <image 
                      v-if="option.image" 
                      class="option-image" 
                      :src="getImageUrl(option.image)" 
                      mode="aspectFill"
                    />
                  </view>
                </view>
              </view>

              <!-- 多选题 -->
              <view v-else-if="question.type === 3" class="multi-choice">
                <view 
                  v-for="option in question.options" 
                  :key="option.oid"
                  class="option-item"
                  :class="{ active: isOptionSelected(question.qid, option.value) }"
                  @click="toggleMultiAnswer(question.qid, option.value)"
                >
                  <view class="option-content">
                    <text class="option-text">{{ option.content }}</text>
                    <image 
                      v-if="option.image" 
                      class="option-image" 
                      :src="getImageUrl(option.image)" 
                      mode="aspectFill"
                    />
                  </view>
                </view>
              </view>

              <!-- 文字输入 -->
              <view v-else-if="question.type === 4" class="text-input">
                <textarea 
                  class="text-area"
                  v-model="answers[question.qid]"
                  placeholder="请输入您的回答（可选）..."
                  maxlength="100"
                  :auto-height="true"
                />
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button class="submit-btn" @click="submitSurvey" :disabled="!canSubmit">
          {{ canSubmit ? '提交测评' : '请完成所有必填项' }}
        </button>
      </view>
    </scroll-view>

    <!-- 加载状态 -->
    <view v-else-if="loading" class="loading-container">
      <text class="loading-text">正在加载测评...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error-container">
      <text class="error-text">加载测评失败</text>
      <button class="retry-btn" @click="loadSurvey">重试</button>
    </view>

    <!-- 结果显示弹窗 -->
    <view class="dialog-overlay" v-if="showResultsDialog" @click="hideResults">
      <view class="results-dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">测评结果</text>
          <text class="dialog-close" @click="hideResults">×</text>
        </view>
        
        <view class="dialog-content">
          <!-- 单个结果居中显示 -->
          <view v-if="getResultDisplayType() === 'single'" class="single-result">
            <view class="result-card">
              <text class="result-name">{{ results[0].name }}</text>
              <text class="result-value">{{ results[0].value }}</text>
              <text v-if="results[0].error" class="result-error">{{ results[0].error }}</text>
            </view>
          </view>

          <!-- 两个结果显示二维坐标图 -->
          <view v-else-if="getResultDisplayType() === 'coordinate'" class="coordinate-chart">
            <view class="chart-container">
              <view class="chart-title">测评结果坐标图</view>
              
              <!-- 结果表格 -->
              <view class="results-table">
                <view class="table-header">
                  <text class="table-title">测评结果详情</text>
                </view>
                <view class="table-content">
                  <view 
                    v-for="(result, index) in results" 
                    :key="index"
                    class="table-row"
                  >
                    <text class="result-name">{{ result.name }}</text>
                    <text class="result-score">{{ result.value }}</text>
                  </view>
                </view>
              </view>

              <view class="coordinate-system">
                <!-- X轴 -->
                <view class="axis x-axis"></view>
                <!-- Y轴 -->
                <view class="axis y-axis"></view>
                <!-- 原点 -->
                <view class="origin-point"></view>
                <!-- 数据点 -->
                <view 
                  class="data-point"
                  :style="{
                    left: (50 + (results[0].value / 10) * 40) + '%',
                    top: (50 - (results[1].value / 10) * 40) + '%'
                  }"
                >
                  <text class="point-value">{{ results[0].value }}, {{ results[1].value }}</text>
                </view>
                <!-- 轴标签 -->
                <view class="axis-labels">
                  <text class="x-axis-label">{{ results[0].name }}</text>
                  <text class="y-axis-label">{{ results[1].name }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 多个结果显示雷达图 -->
          <view v-else class="radar-chart">
            <view class="chart-container">
              <view class="chart-title">测评结果雷达图</view>
              
              <!-- 结果表格 -->
              <view class="results-table">
                <view class="table-header">
                  <text class="table-title">测评结果详情</text>
                </view>
                <view class="table-content">
                  <view 
                    v-for="(result, index) in results" 
                    :key="index"
                    class="table-row"
                  >
                    <text class="result-name">{{ result.name }}</text>
                    <text class="result-score">{{ result.value }}</text>
                  </view>
                </view>
              </view>

              <!-- 雷达图 -->
              <view class="radar-section">
                <view class="radar-container">
                  <view class="radar-grid">
                    <view class="grid-circle" v-for="i in 5" :key="i"></view>
                  </view>
                  <view class="radar-data">
                    <view 
                      v-for="(result, index) in results" 
                      :key="index"
                      class="radar-point"
                      :style="getPointStyle(result, index)"
                    >
                      <!-- 连接线 -->
                      <view 
                        class="connection-line"
                        :class="result.value >= 0 ? 'positive' : 'negative'"
                        :style="{
                          '--point-radius': Math.min(Math.abs(result.value) * 10, 100)
                        }"
                      >
                        <!-- 箭头 -->
                        <view class="arrow" :class="result.value >= 0 ? 'positive' : 'negative'"></view>
                      </view>
                      <!-- 结果点 -->
                      <view 
                        class="point"
                        :class="result.value >= 0 ? 'positive' : 'negative'"
                        :style="{
                          '--point-radius': Math.min(Math.abs(result.value) * 10, 100)
                        }"
                      ></view>
                      <text class="point-label">{{ result.name }}</text>
                    </view>
                  </view>
                </view>
                <!-- 图例 -->
                <view class="radar-legend">
                  <view class="legend-item">
                    <view class="legend-color positive"></view>
                    <text class="legend-text">正数结果</text>
                  </view>
                  <view class="legend-item">
                    <view class="legend-color negative"></view>
                    <text class="legend-text">负数结果</text>
                  </view>
                </view>
                
                <!-- 比例尺信息 -->
                <view class="scale-info">
                  <text class="scale-text">比例尺: 最大值 {{ getMaxAbsValue() }} 对应 100%</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="dialog-actions">
          <button class="btn confirm" @click="hideResults">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js'

export default {
  data() {
    return {
      survey: null,
      answers: {},
      loading: false,
      surveyId: null,
      showResultsDialog: false,
      results: []
    }
  },
  computed: {
    canSubmit() {
      if (!this.survey || !this.survey.questions) return false
      
      // 检查所有问题是否都已回答
      for (let question of this.survey.questions) {
        if (question.type === 3) {
          // 多选题需要至少选择一个选项
          if (!this.answers[question.qid] || this.answers[question.qid].length === 0) {
            return false
          }
        } else if (question.type === 4) {
          // 文字输入题为可选，不需要验证
          continue
        } else {
          // 其他类型需要非空答案
          if (this.answers[question.qid] === undefined || this.answers[question.qid] === null || this.answers[question.qid] === '') {
            return false
          }
        }
      }
      return true
    },

    positiveResults() {
      return this.results.filter(result => result.value > 0)
    },

    negativeResults() {
      return this.results.filter(result => result.value < 0)
    }
  },
  onLoad(options) {
    if (options.id) {
      this.surveyId = parseInt(options.id)
      this.loadSurvey()
    } else {
      uni.showToast({
        title: '测评ID无效',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },

    async loadSurvey() {
      try {
        this.loading = true
        const result = await Database.getSurveyById(this.surveyId)
        
        if (result.success && result.survey) {
          this.survey = result.survey
          // 初始化答案对象
          this.answers = {}
          for (let question of this.survey.questions) {
            if (question.type === 3) {
              // 多选题初始化为空数组
              this.answers[question.qid] = []
            } else {
              // 其他类型初始化为null
              this.answers[question.qid] = null
            }
          }
        } else {
          uni.showToast({
            title: result.message || '加载测评失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('加载测评失败:', error)
        uni.showToast({
          title: '加载测评失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    getImageUrl(imagePath) {
      if (!imagePath) return '/static/cover.jpg'
      if (imagePath.startsWith('http')) return imagePath
      if (imagePath.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${imagePath}`
      }
      return '/static/cover.jpg'
    },

    getQuestionTypeName(type) {
      const typeMap = {
        0: '符合度打分',
        1: '是否题',
        2: '单选题',
        3: '多选题',
        4: '文字输入'
      }
      return typeMap[type] || '未知类型'
    },

    setAnswer(qid, value) {
      this.answers[qid] = value
    },

    isOptionSelected(qid, value) {
      return this.answers[qid] && this.answers[qid].includes(value)
    },

    toggleMultiAnswer(qid, value) {
      if (!this.answers[qid]) {
        this.answers[qid] = []
      }
      
      const index = this.answers[qid].indexOf(value)
      if (index > -1) {
        this.answers[qid].splice(index, 1)
      } else {
        this.answers[qid].push(value)
      }
    },

    async submitSurvey() {
      if (!this.canSubmit) {
        uni.showToast({
          title: '请完成所有必填项',
          icon: 'none'
        })
        return
      }

      try {
        uni.showLoading({ title: '提交中...' })
        
        // 分离文字输入类型的问题
        const textInputQids = []
        const textInputAnswers = []
        const regularAnswers = {}
        
        for (const question of this.survey.questions) {
          if (question.type === 4) {
            // 文字输入类型
            textInputQids.push(question.qid)
            textInputAnswers.push(this.answers[question.qid] || null)
          } else {
            // 其他类型
            regularAnswers[question.qid] = this.answers[question.qid]
          }
        }
        
        const result = await Database.submitSurveyAnswer(this.surveyId, regularAnswers, textInputQids, textInputAnswers)
        
        uni.hideLoading()
        
        if (result.success) {
          // 显示计算结果
          this.showResults(result.results)
        } else {
          uni.showToast({
            title: result.message || '提交失败',
            icon: 'none'
          })
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('提交测评失败:', error)
        uni.showToast({
          title: '提交失败',
          icon: 'none'
        })
      }
    },

    showResults(results) {
      this.results = results
      this.showResultsDialog = true
    },

    hideResults() {
      this.showResultsDialog = false
      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 500)
    },

    getResultDisplayType() {
      if (this.results.length === 1) {
        return 'single'
      } else if (this.results.length === 2) {
        return 'coordinate'
      } else {
        return 'radar'
      }
    },

    getPointStyle(result, index) {
      const total = this.results.length
      const angle = (index * 360 / total) - 90 // -90°起点从顶部开始
      
      // 计算半径比例（基于最大绝对值）
      const maxAbsValue = Math.max(...this.results.map(r => Math.abs(r.value)))
      const radiusPercentage = maxAbsValue > 0 ? 
        (Math.abs(result.value) / maxAbsValue) * 100 : 0
      
      return {
        transform: `rotate(${angle}deg)`,
        '--point-radius': radiusPercentage
      }
    },

    getMaxAbsValue() {
      if (!this.results || this.results.length === 0) return 0
      return Math.max(...this.results.map(r => Math.abs(r.value)))
    }
  }
}
</script>

<style scoped>
.survey-detail-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: white;
  border-bottom: 1rpx solid #e0e0e0;
}

.header-left, .header-right {
  width: 80rpx;
  display: flex;
  justify-content: center;
}

.back-icon {
  font-size: 36rpx;
  color: #55B99E;
}

.page-title {
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
}

.content {
    width: 90%;
  height: calc(100vh - 100rpx);
  padding: 32rpx;
}

.survey-info {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.survey-cover {
  width: 100%;
  height: 300rpx;
  border-radius: 12rpx;
  background: #eee;
  margin-bottom: 24rpx;
}

.survey-title {
  display: block;
  font-size: 36rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.survey-intro {
  display: block;
  font-size: 28rpx;
  color: #7f8c8d;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.survey-info-text {
  display: block;
  font-size: 24rpx;
  color: #95a5a6;
  line-height: 1.4;
}

.questions-section {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  display: block;
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 32rpx;
}

.question-item {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.question-number {
  font-size: 28rpx;
  color: #55B99E;
  font-weight: bold;
}

.question-type {
  font-size: 24rpx;
  color: #7f8c8d;
  background: #f0f0f0;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.question-content {
  margin-bottom: 24rpx;
}

.question-text {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  margin-bottom: 16rpx;
}

.question-image {
  width: 100%;
  max-height: 400rpx;
  border-radius: 8rpx;
  background: #eee;
}

.question-input {
  margin-top: 16rpx;
}

/* 符合度打分样式 */
.rating-input {
  display: flex;
  justify-content: center;
}

.rating-scale {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.scale-label {
  font-size: 24rpx;
  color: #7f8c8d;
}

.rating-buttons {
  display: flex;
  gap: 8rpx;
}

.rating-btn {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #2c3e50;
  background: white;
}

.rating-btn.active {
  background: #55B99E;
  color: white;
  border-color: #55B99E;
}

/* 是否题样式 */
.yesno-input {
  display: flex;
  gap: 24rpx;
  justify-content: center;
}

.yesno-btn {
  width: 120rpx;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #2c3e50;
  background: white;
}

.yesno-btn.active {
  background: #55B99E;
  color: white;
  border-color: #55B99E;
}

/* 单选题和多选题样式 */
.single-choice, .multi-choice {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.option-item {
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 20rpx;
  background: white;
}

.option-item.active {
  border-color: #55B99E;
  background: rgba(0, 122, 255, 0.1);
}

.option-content {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.option-text {
  flex: 1;
  font-size: 28rpx;
  color: #2c3e50;
}

.option-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  background: #eee;
}

/* 文字输入样式 */
.text-input {
  width: 100%;
}

.text-area {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #2c3e50;
  background: white;
  box-sizing: border-box;
}

/* 提交按钮样式 */
.submit-section {
  padding: 32rpx 0;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #55B99E;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.submit-btn:disabled {
  background: #bdc3c7;
  color: #7f8c8d;
}

/* 加载和错误状态样式 */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
  gap: 32rpx;
}

.loading-text, .error-text {
  font-size: 28rpx;
  color: #7f8c8d;
}

.retry-btn {
  padding: 16rpx 32rpx;
  background: #55B99E;
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
}

/* 结果显示样式 */
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

.results-dialog {
  background: white;
  border-radius: 16rpx;
  width: 90%;
  max-height: 80%;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.dialog-title {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
}

.dialog-close {
  font-size: 40rpx;
  color: #7f8c8d;
}

.dialog-content {
  padding: 32rpx;
  max-height: 600rpx;
  overflow-y: auto;
}

/* 单个结果样式 */
.single-result {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200rpx;
}

.result-card {
  text-align: center;
  padding: 40rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  border: 2rpx solid #55B99E;
}

.result-name {
  display: block;
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.result-value {
  display: block;
  font-size: 48rpx;
  color: #55B99E;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.result-error {
  display: block;
  font-size: 24rpx;
  color: #e74c3c;
}

/* 坐标图样式 */
.coordinate-chart {
  width: 100%;
}

.chart-container {
  width: 100%;
}

.chart-title {
  text-align: center;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 32rpx;
}

.coordinate-system {
  position: relative;
  width: 100%;
  height: 400rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  background: #f8f9fa;
}

.axis {
  position: absolute;
  background: #55B99E;
}

.x-axis {
  top: 50%;
  left: 0;
  right: 0;
  height: 2rpx;
  transform: translateY(-50%);
}

.y-axis {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2rpx;
  transform: translateX(-50%);
}

.origin-point {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8rpx;
  height: 8rpx;
  background: #55B99E;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.axis-labels {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.x-axis-label {
  position: absolute;
  bottom: 20rpx;
  right: 20rpx;
  font-size: 24rpx;
  color: #2c3e50;
  background: white;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  border: 1rpx solid #e0e0e0;
}

.y-axis-label {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  font-size: 24rpx;
  color: #2c3e50;
  background: white;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  border: 1rpx solid #e0e0e0;
}

.data-point {
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  background: #e74c3c;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 2rpx solid white;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.point-value {
  position: absolute;
  top: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20rpx;
  color: #2c3e50;
  background: white;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  white-space: nowrap;
}

/* 结果表格样式 */
.results-table {
  background: #f8f9fa;
  border-radius: 12rpx;
  margin-bottom: 32rpx;
  overflow: hidden;
}

.table-header {
  background: #55B99E;
  padding: 16rpx 24rpx;
}

.table-title {
  font-size: 28rpx;
  color: white;
  font-weight: bold;
}

.table-content {
  padding: 16rpx 0;
}

.table-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 24rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.table-row:last-child {
  border-bottom: none;
}

.result-name {
  font-size: 26rpx;
  color: #2c3e50;
  font-weight: bold;
}

.result-score {
  font-size: 26rpx;
  color: #55B99E;
  font-weight: bold;
}

/* 雷达图样式 */
.radar-chart {
  width: 100%;
}

.radar-section {
  margin-bottom: 32rpx;
}

.radar-container {
  position: relative;
  width: 300rpx;
  height: 300rpx;
  margin: 0 auto;
}

.radar-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.grid-circle {
  position: absolute;
  border: 1rpx solid #e0e0e0;
  border-radius: 50%;
}

.grid-circle:nth-child(1) { top: 0; left: 0; right: 0; bottom: 0; }
.grid-circle:nth-child(2) { top: 20%; left: 20%; right: 20%; bottom: 20%; }
.grid-circle:nth-child(3) { top: 40%; left: 40%; right: 40%; bottom: 40%; }
.grid-circle:nth-child(4) { top: 60%; left: 60%; right: 60%; bottom: 60%; }
.grid-circle:nth-child(5) { top: 80%; left: 80%; right: 80%; bottom: 80%; }

.radar-data {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.radar-point {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  /* 临时调试样式 */
  border: 1rpx dashed rgba(255, 0, 0, 0.3);
}

.connection-line {
  position: absolute;
  bottom: 50%;
  left: 50%;
  width: 4rpx;
  transform: translateX(-50%);
  border-radius: 2rpx;
  transform-origin: center bottom;
  /* 临时调试样式 */
  border: 1rpx dashed rgba(0, 0, 255, 0.3);
}

.connection-line.positive {
  background: #27ae60;
  height: calc(var(--point-radius) * 1.5px);
}

.connection-line.negative {
  background: #e74c3c;
  height: calc(var(--point-radius) * 1.5px);
}

.arrow {
  position: absolute;
  width: 0;
  height: 0;
  left: 50%;
  transform: translateX(-50%);
}

.arrow.positive {
  top: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-top: 12rpx solid #27ae60;
}

.arrow.negative {
  bottom: 0;
  border-left: 6rpx solid transparent;
  border-right: 6rpx solid transparent;
  border-bottom: 12rpx solid #e74c3c;
}

.point {
  position: absolute;
  bottom: calc(50% + var(--point-radius) * 1.5px);
  left: 50%;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  transform: translate(-50%, 50%);
}

.point.positive {
  background: #27ae60;
  border: 2rpx solid #2ecc71;
}

.point.negative {
  background: #e74c3c;
  border: 2rpx solid #c0392b;
}

.point-label {
  position: absolute;
  bottom: calc(50% + var(--point-radius) * 1.5px + 20rpx);
  left: 50%;
  transform: translateX(-50%);
  font-size: 20rpx;
  color: #2c3e50;
  white-space: nowrap;
}

.radar-legend {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  margin-top: 24rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-color {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.legend-color.positive {
  background: #27ae60;
}

.legend-color.negative {
  background: #e74c3c;
}

.legend-text {
  font-size: 24rpx;
  color: #2c3e50;
}

.scale-info {
  margin-top: 16rpx;
  text-align: center;
}

.scale-text {
  font-size: 22rpx;
  color: #7f8c8d;
  background: #f8f9fa;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
}


.dialog-actions {
  padding: 32rpx;
  border-top: 1rpx solid #e0e0e0;
}

.btn {
  width: 100%;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.btn.confirm {
  background: #55B99E;
  color: white;
}
</style>
