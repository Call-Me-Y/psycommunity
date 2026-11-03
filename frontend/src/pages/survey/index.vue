<template>
  <view class="survey-stats-container">
    <view class="header">
      <text class="page-title">统计展示</text>
      <text class="subtitle">数据统计与分析</text>
    </view>

    <scroll-view class="content" scroll-y refresher-enabled :refresher-triggered="contentRefreshing"
                 refresher-background="#f8f9fa" @refresherrefresh="onContentRefresh">
      <!-- 用户信息卡片 -->
      <view class="user-info-card">
        <view class="user-header">
          <image class="user-avatar" :src="getAvatarUrl(currentUserInfo.avatar)" mode="aspectFill"></image>
          <view class="user-details">
            <text class="user-name">{{ currentUserInfo.name }}</text>
            <text class="user-role">{{ getAccountTypeName(currentUser.type) }}</text>
          </view>
        </view>
        <view class="stats-summary">
          <view class="summary-item">
            <text class="summary-number">{{ totalSurveys }}</text>
            <text class="summary-label">已完成测评</text>
          </view>
          <view class="summary-item">
            <text class="summary-number">{{ totalPosts }}</text>
            <text class="summary-label">发布动态</text>
          </view>
          <view class="summary-item">
            <text class="summary-number">{{ totalGroups }}</text>
            <text class="summary-label">参与群组</text>
          </view>
        </view>
      </view>

      <!-- 测评结果统计 -->
      <view class="stats-section">
        <view class="section-header">
          <text class="section-title">📊 测评结果统计</text>
          <view class="header-actions">
            <view class="view-toggle">
              <text 
                class="toggle-btn" 
                :class="{ active: currentView === 'preview' }"
                @click="switchView('preview')"
              >
                预览
              </text>
              <text 
                class="toggle-btn" 
                :class="{ active: currentView === 'detail' }"
                @click="switchView('detail')"
              >
                详细
              </text>
            </view>
            <view v-if="currentUser.type === 0" class="export-btn" @click="exportSurveyResults">
              <text class="export-text">📥 导出</text>
            </view>
          </view>
        </view>

        <!-- 预览模式 -->
        <view v-if="currentView === 'preview'" class="preview-content">
          <view class="recent-results">
            <text class="preview-title" v-if="currentUser.type === 0">各测评统计概览</text>
            <text class="preview-title" v-else>最近几次测评结果</text>
            <view class="results-list">
              <view 
                v-for="(result, index) in recentSurveyResults" 
                :key="index"
                class="result-item"
              >
                <view class="result-info">
                  <text class="survey-name" v-if="currentUser.type === 0">{{ result.surveyName }} ({{ result.totalCount }}份)</text>
                  <text class="survey-name" v-else>{{ result.surveyName }}</text>
                  <text class="result-time" v-if="currentUser.type === 0"></text>
                  <text class="result-time" v-else>{{ formatTime(result.doneTime) }}</text>
                </view>
                <view class="result-scores">
                  <view 
                    v-for="score in (currentUser.type === 0 ? result.avgScores : result.scores)" 
                    :key="score.name"
                    class="score-item"
                  >
                    <text class="score-name">{{ score.name }}</text>
                    <text class="score-value" :class="getScoreClass(score.value)">
                      {{ score.value }}
                    </text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 详细模式 -->
        <view v-else class="detail-content">
          <view class="all-results">
            <text class="detail-title" v-if="currentUser.type === 0">各测评统计详情</text>
            <text class="detail-title" v-else>所有测评结果详情</text>
            
            <!-- 管理员视图：按测评分组统计 -->
            <view v-if="currentUser.type === 0" class="survey-stats-table">
              <view class="table-header">
                <text class="col-survey">测评名称</text>
                <text class="col-scores">各项平均得分</text>
              </view>
              <view 
                v-for="(survey, index) in allSurveyResults" 
                :key="index"
                class="table-row"
              >
                <text class="col-survey">{{ survey.surveyName }} ({{ survey.totalCount }}份)</text>
                <view class="col-scores">
                  <view 
                    v-for="score in survey.avgScores" 
                    :key="score.name"
                    class="score-detail"
                  >
                    <text class="score-name">{{ score.name }}: {{ score.value }}</text>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 普通用户视图：个人测评记录 -->
            <view v-else class="results-table">
              <view class="table-header">
                <text class="col-survey">测评名称</text>
                <text class="col-time">完成时间</text>
                <text class="col-scores">各项得分</text>
              </view>
              <view 
                v-for="(result, index) in allSurveyResults" 
                :key="index"
                class="table-row"
              >
                <text class="col-survey">{{ result.surveyName }}</text>
                <text class="col-time">{{ formatTime(result.doneTime) }}</text>
                <view class="col-scores">
                  <view 
                    v-for="score in result.scores" 
                    :key="score.name"
                    class="score-detail"
                  >
                    <text class="score-name">{{ score.name }}: {{ score.value }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- SurveyAnswers统计 -->
      <view class="stats-section">
        <view class="section-header">
          <text class="section-title">📋 测评答案详情</text>
          <view class="header-actions">
            <view class="view-toggle">
              <text 
                class="toggle-btn" 
                :class="{ active: currentView === 'preview' }"
                @click="switchView('preview')"
              >
                预览
              </text>
              <text 
                class="toggle-btn" 
                :class="{ active: currentView === 'detail' }"
                @click="switchView('detail')"
              >
                详细
              </text>
            </view>
            <view v-if="currentUser.type === 0" class="export-btn" @click="showExportOptions">
              <text class="export-text">📥 导出</text>
            </view>
          </view>
        </view>

        <!-- 预览模式 -->
        <view v-if="currentView === 'preview'" class="preview-content">
          <view class="all-text-answers">
            <text class="preview-title">所有文字输入答案</text>
            <view v-if="getAllTextInputAnswers().length > 0" class="answers-by-survey">
              <view 
                v-for="(survey, index) in getAllTextInputAnswers()" 
                :key="index"
                class="survey-answers-group"
              >
                <view class="survey-header">
                  <text class="survey-name">{{ survey.surveyName }}</text>
                </view>
                <view class="answers-list">
                  <view 
                    v-for="(answer, answerIndex) in survey.answers" 
                    :key="answerIndex"
                    class="answer-item"
                  >
                    <view class="answer-header" v-if="currentUser.type === 0">
                      <text class="answer-user">{{ answer.userName || '未知用户' }}</text>
                      <text class="answer-time">{{ formatTime(answer.doneTime) }}</text>
                    </view>
                    <text class="question-content">{{ answer.questionContent }}</text>
                    <text class="answer-content">{{ formatAnswer(answer.answer, answer.answerType) }}</text>
                    <text class="answer-time" v-if="currentUser.type !== 0">{{ formatTime(answer.doneTime) }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="no-data">
              <text class="no-data-text">暂无文字输入答案</text>
            </view>
          </view>
        </view>

        <!-- 详细模式 -->
        <view v-else class="detail-content">
          <view class="all-answers">
            <text class="detail-title">所有类型答案详情</text>
            
            <view v-if="allSurveyAnswers.length > 0" class="answers-by-survey">
              <view 
                v-for="(survey, index) in allSurveyAnswers" 
                :key="index"
                class="survey-answers-group"
              >
                <view class="survey-header">
                  <text class="survey-name">{{ survey.surveyName }}</text>
                </view>
                <view class="answers-list">
                  <view 
                    v-for="(answer, answerIndex) in survey.answers" 
                    :key="answerIndex"
                    class="answer-item"
                  >
                    <view class="answer-header" v-if="currentUser.type === 0">
                      <text class="answer-user">{{ answer.userName || '未知用户' }}</text>
                      <text class="answer-time">{{ formatTime(answer.doneTime) }}</text>
                    </view>
                    <text class="question-content">{{ answer.questionContent }}</text>
                    <text class="answer-content">{{ formatAnswer(answer.answer, answer.answerType) }}</text>
                    <text class="answer-time" v-if="currentUser.type !== 0">{{ formatTime(answer.doneTime) }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="no-data">
              <text class="no-data-text">暂无答案记录</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 动态发布统计 -->
      <view class="stats-section">
        <view class="section-header">
          <text class="section-title">📝 动态发布统计</text>
          <view class="header-actions">
            <view class="view-toggle">
              <text 
                class="toggle-btn" 
                :class="{ active: currentPostView === 'preview' }"
                @click="switchPostView('preview')"
              >
                预览
              </text>
              <text 
                class="toggle-btn" 
                :class="{ active: currentPostView === 'detail' }"
                @click="switchPostView('detail')"
              >
                详细
              </text>
            </view>
            <view v-if="currentUser.type === 0" class="export-btn" @click="exportPosts">
              <text class="export-text">📥 导出</text>
            </view>
          </view>
        </view>

        <!-- 预览模式 -->
        <view v-if="currentPostView === 'preview'" class="preview-content">
          <view class="post-summary">
            <text class="preview-title" v-if="currentUser.type === 0">全平台动态统计概览</text>
            <view class="summary-cards">
              <view class="summary-card">
                <text class="card-number">{{ totalPosts }}</text>
                <text class="card-label" v-if="currentUser.type === 0">全平台发布数</text>
                <text class="card-label" v-else>总发布数</text>
              </view>
              <view class="summary-card">
                <text class="card-number">{{ totalLikes }}</text>
                <text class="card-label" v-if="currentUser.type === 0">全平台点赞数</text>
                <text class="card-label" v-else>总点赞数</text>
              </view>
              <view class="summary-card">
                <text class="card-number">{{ totalComments }}</text>
                <text class="card-label" v-if="currentUser.type === 0">全平台评论数</text>
                <text class="card-label" v-else>总评论数</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 详细模式 -->
        <view v-else class="detail-content">
          <view class="post-details">
            <text class="detail-title" v-if="currentUser.type === 0">全平台动态发布详细数据</text>
            <text class="detail-title" v-else>动态发布详细数据</text>
            <view class="posts-table">
              <view class="table-header">
                <text class="col-user" v-if="currentUser.type === 0">发布者</text>
                <text class="col-content">内容</text>
                <text class="col-time">发布时间</text>
                <text class="col-stats">点赞/评论</text>
              </view>
              <view 
                v-for="(post, index) in allPosts" 
                :key="index"
                class="table-row"
              >
                <text class="col-user" v-if="currentUser.type === 0">{{ post.username || post.userName || post.authorName || '未知用户' }}</text>
                <view class="col-content">
                  <text class="post-text">{{ post.text_content || post.textContent || '无内容' }}</text>
                </view>
                <text class="col-time">{{ formatTime(post.created_time || post.createdTime) }}</text>
                <view class="col-stats">
                  <text class="stats-text">{{ post.likes || 0 }}👍 / {{ post.comments || 0 }}💬</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 群会话统计 -->
      <view class="stats-section">
        <view class="section-header">
          <text class="section-title">💬 群会话统计</text>
          <view class="header-actions">
            <view class="view-toggle">
              <text 
                class="toggle-btn" 
                :class="{ active: currentGroupView === 'preview' }"
                @click="switchGroupView('preview')"
              >
                预览
              </text>
              <text 
                class="toggle-btn" 
                :class="{ active: currentGroupView === 'detail' }"
                @click="switchGroupView('detail')"
              >
                详细
              </text>
            </view>
            <view v-if="currentUser.type === 0" class="export-btn" @click="showGroupExportOptions">
              <text class="export-text">📥 导出</text>
            </view>
          </view>
        </view>

        <!-- 预览模式 -->
        <view v-if="currentGroupView === 'preview'" class="preview-content">
          <view class="group-summary">
            <text class="preview-title" v-if="currentUser.type === 0">全平台群会话统计概览</text>
            <text class="preview-title" v-else>已进行 {{ totalGroups }} 次群会话</text>
            <view class="group-stats">
              <view class="group-item">
                <text class="group-name" v-if="currentUser.type === 0">全平台群组数</text>
                <text class="group-name" v-else>参与群组数</text>
                <text class="group-count">{{ totalGroups }}</text>
              </view>
              <view class="group-item">
                <text class="group-name">总消息数</text>
                <text class="group-count">{{ totalGroupMessages }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 详细模式 -->
        <view v-else class="detail-content">
          <view class="group-details">
            <text class="detail-title" v-if="currentUser.type === 0">全平台群组消息统计</text>
            <text class="detail-title" v-else>各群组消息统计</text>
            <view class="groups-table">
              <view class="table-header">
                <text class="col-group">群组名称</text>
                <text class="col-messages">消息数量</text>
                <text class="col-last">最后发言</text>
              </view>
              <view 
                v-for="(group, index) in groupStats" 
                :key="index"
                class="table-row"
              >
                <text class="col-group">{{ group.name }}</text>
                <text class="col-messages">{{ group.messageCount }}</text>
                <text class="col-last">{{ formatTime(group.lastMessageTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

    
    </scroll-view>

    <!-- 导出选项弹窗 -->
    <view v-if="showExportDialog" class="export-dialog-overlay" @click="hideExportOptions">
      <view class="export-dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">导出测评答案</text>
          <text class="close-btn" @click="hideExportOptions">×</text>
        </view>
        
        <view class="dialog-content">
          <!-- 测评选择 -->
          <view class="option-group">
            <text class="option-label">选择测评：</text>
            <view class="survey-list">
              <view 
                v-for="survey in availableSurveys" 
                :key="survey.sid"
                class="survey-option"
                :class="{ selected: selectedSurveys.includes(survey.sid) }"
                @click="toggleSurvey(survey.sid)"
              >
                <text class="survey-name">{{ survey.name }}</text>
                <text class="survey-count">({{ survey.answerCount }}条答案)</text>
              </view>
            </view>
          </view>
          
          <!-- 答案类型选择 -->
          <view class="option-group">
            <text class="option-label">答案类型：</text>
            <view class="type-options">
              <view 
                class="type-option"
                :class="{ selected: answerTypeFilter === 'all' }"
                @click="setAnswerTypeFilter('all')"
              >
                <text class="type-text">全部类型</text>
              </view>
              <view 
                class="type-option"
                :class="{ selected: answerTypeFilter === 'text' }"
                @click="setAnswerTypeFilter('text')"
              >
                <text class="type-text">仅文字输入</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="dialog-actions">
          <view class="action-btn cancel-btn" @click="hideExportOptions">
            <text class="btn-text">取消</text>
          </view>
          <view class="action-btn confirm-btn" @click="confirmExport">
            <text class="btn-text">确认导出</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 群会话导出选项弹窗 -->
    <view v-if="showGroupExportDialog" class="export-dialog-overlay" @click="hideGroupExportOptions">
      <view class="export-dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">导出群会话记录</text>
          <text class="close-btn" @click="hideGroupExportOptions">×</text>
        </view>
        
        <view class="dialog-content">
          <!-- 群组选择 -->
          <view class="option-group">
            <text class="option-label">选择群组：</text>
            <view class="group-list">
              <view 
                v-for="group in availableGroups" 
                :key="group.gid"
                class="group-option"
                :class="{ selected: selectedGroups.includes(group.gid) }"
                @click="toggleGroup(group.gid)"
              >
                <text class="group-name">{{ group.name }}</text>
                <text class="group-count">({{ group.messageCount }}条消息)</text>
              </view>
            </view>
          </view>
          
          <!-- 时间范围选择 -->
          <view class="option-group">
            <text class="option-label">时间范围：</text>
            <view class="time-options">
              <view 
                class="time-option"
                :class="{ selected: timeRangeFilter === 'all' }"
                @click="setTimeRangeFilter('all')"
              >
                <text class="time-text">全部时间</text>
              </view>
              <view 
                class="time-option"
                :class="{ selected: timeRangeFilter === '7' }"
                @click="setTimeRangeFilter('7')"
              >
                <text class="time-text">最近7天</text>
              </view>
              <view 
                class="time-option"
                :class="{ selected: timeRangeFilter === '30' }"
                @click="setTimeRangeFilter('30')"
              >
                <text class="time-text">最近30天</text>
              </view>
              <view 
                class="time-option"
                :class="{ selected: timeRangeFilter === '90' }"
                @click="setTimeRangeFilter('90')"
              >
                <text class="time-text">最近90天</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="dialog-actions">
          <view class="action-btn cancel-btn" @click="hideGroupExportOptions">
            <text class="btn-text">取消</text>
          </view>
          <view class="action-btn confirm-btn" @click="confirmGroupExport">
            <text class="btn-text">确认导出</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <text class="loading-text">正在加载统计数据...</text>
    </view>
  </view>
</template>

<script>
import config from '../../config/api.js';
import Database from '@/utils/database.js'
import * as XLSX from 'xlsx'
import { installMousePullRefresh, removeMousePullRefresh } from '@/utils/mousePullRefresh.js'

export default {
  data() {
    return {
      currentUser: null,
      currentUserInfo: {
        name: '未命名',
        avatar: '/static/avatar.png'
      },
      loading: false,
      contentRefreshing: false,
      pullRefreshing: false,
      
      // 视图控制
      currentView: 'preview',
      currentPostView: 'preview',
      currentGroupView: 'preview',
      
      // 统计数据
      totalSurveys: 0,
      totalPosts: 0,
      totalGroups: 0,
      totalLikes: 0,
      totalComments: 0,
      totalGroupMessages: 0,
      
      // 详细数据
      recentSurveyResults: [],
      allSurveyResults: [],
      allPosts: [],
      groupStats: [],
      
      // SurveyAnswers数据
      latestSurveyAnswers: null,
      allSurveyAnswers: [],
      
      // 管理员数据
      allUsersCount: 0,
      allSurveysCount: 0,
      allPostsCount: 0,
      
      // 导出选项
      showExportDialog: false,
      availableSurveys: [],
      selectedSurveys: [],
      answerTypeFilter: 'all',
      
      // 群会话导出选项
      showGroupExportDialog: false,
      availableGroups: [],
      selectedGroups: [],
      timeRangeFilter: 'all'
    }
  },
  
  async onLoad() {
    await this.loadUserInfo()
    if (this.currentUser) await this.loadStatistics()
  },
  onShow() { this.$nextTick(() => installMousePullRefresh(this)) },
  onHide() { removeMousePullRefresh(this) },
  onUnload() { removeMousePullRefresh(this) },
  onPullDownRefresh() { return this.refreshPage() },
  
  methods: {
    onContentRefresh() {
      this.contentRefreshing = true
      return this.refreshPage()
    },
    async refreshPage() {
      if (this.pullRefreshing) return
      this.pullRefreshing = true
      try {
        await this.loadUserInfo()
        if (this.currentUser) await this.loadStatistics()
      } finally {
        this.pullRefreshing = false
        this.contentRefreshing = false
        uni.stopPullDownRefresh()
      }
    },
    async loadUserInfo() {
      try {
        const currentUser = uni.getStorageSync('currentUser')
        if (currentUser) {
          this.currentUser = currentUser
          
          // 获取用户详细信息
          const userRes = await Database.getUserById(currentUser.uid)
          if (userRes.success && userRes.user) {
            this.currentUserInfo = userRes.user
            this.currentUser = { ...this.currentUser, type: userRes.user.type }
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    },
    
    async loadStatistics() {
      try {
        this.loading = true
        
        if (this.currentUser.type === 0) {
          // 管理员加载所有数据
          await this.loadAdminStatistics()
        } else {
          // 普通用户加载自己的数据
          await this.loadUserStatistics()
        }
        
      } catch (error) {
        console.error('加载统计数据失败:', error)
        uni.showToast({
          title: '加载统计数据失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    
    async loadUserStatistics() {
      // 加载用户自己的统计数据
      await Promise.all([
        this.loadSurveyResults(),
        this.loadSurveyAnswers(),
        this.loadPostStatistics(),
        this.loadGroupStatistics()
      ])
    },
    
    async loadAdminStatistics() {
      // 加载管理员统计数据
      await Promise.all([
        this.loadSurveyResults(),
        this.loadSurveyAnswers(),
        this.loadPostStatistics(),
        this.loadGroupStatistics(),
        this.loadAdminData()
      ])
    },
    
    async loadSurveyResults() {
      try {
        let results = []
        
        if (this.currentUser.type === 0) {
          // 管理员获取所有用户的结果
          const allResults = await Database.getAllSurveyResults()
          if (allResults.success) {
            results = allResults.results
          }
        } else {
          // 普通用户获取自己的结果
          const userResults = await Database.getUserSurveyResults()
          if (userResults.success) {
            results = userResults.results
          }
        }
        
        if (this.currentUser.type === 0) {
          // 管理员：按测评sid分组统计
          const surveyStats = this.processSurveyResultsBySurvey(results)
          this.surveyStats = surveyStats
          this.totalSurveys = surveyStats.length
          this.recentSurveyResults = surveyStats.slice(0, 3) // 最近3个测评
          this.allSurveyResults = surveyStats
        } else {
          // 普通用户：处理时间容差，合并同一用户在同一分钟内完成的同一测评
          const processedResults = this.processSurveyResultsWithTimeTolerance(results)
          this.totalSurveys = processedResults.length
          this.recentSurveyResults = processedResults.slice(0, 3) // 最近3次
          this.allSurveyResults = processedResults
        }
        
      } catch (error) {
        console.error('加载测评结果失败:', error)
        this.totalSurveys = 0
        this.recentSurveyResults = []
        this.allSurveyResults = []
        uni.showToast({ title: '加载测评结果失败', icon: 'none' })
      }
    },
    
    async loadSurveyAnswers() {
      try {
        let allRes
        if (this.currentUser.type === 0) {
          allRes = await Database.getAllSurveyAnswersWithDetails()
        } else {
          allRes = await Database.getUserSurveyAnswersWithDetails()
        }
        
        if (allRes.success) {
          this.allSurveyAnswers = allRes.data
        }
        
      } catch (error) {
        console.error('加载SurveyAnswers失败:', error)
        this.allSurveyAnswers = []
      }
    },
    
    async loadPostStatistics() {
      try {
        if (this.currentUser.type === 0) {
          // 管理员：获取所有用户的动态统计
          const allPostsStats = await Database.getAllPostsStats()
          if (allPostsStats.success) {
            this.totalPosts = allPostsStats.totalPosts
            this.totalLikes = allPostsStats.totalLikes || 0
            this.totalComments = allPostsStats.totalComments || 0
          }
          
          // 获取所有动态详情
          const allPosts = await Database.getPosts('time', 1000, 0) // 获取前1000条动态
          if (allPosts.success && allPosts.posts) {
            this.allPosts = allPosts.posts
          }
        } else {
          // 普通用户：获取自己的动态统计
          const posts = await Database.getUserPosts(this.currentUser.uid)
          
          if (posts.success && posts.posts) {
            this.allPosts = posts.posts
            this.totalPosts = posts.posts.length
            this.totalLikes = posts.posts.reduce((sum, post) => sum + (post.likes || 0), 0)
            this.totalComments = posts.posts.reduce((sum, post) => sum + (post.comments || 0), 0)
          }
        }
        
      } catch (error) {
        console.error('加载动态统计失败:', error)
      }
    },
    
    async loadGroupStatistics() {
      try {
        let groupStats = []
        
        if (this.currentUser.type === 0) {
          // 管理员：获取所有群组统计
          // 使用getUserGroups获取所有群组（管理员可以看到所有群组）
          const allGroups = await Database.getUserGroups()
          
          if (allGroups.success && allGroups.groups) {
            this.totalGroups = allGroups.groups.length
            
            // 计算所有群组统计
            this.groupStats = await Promise.all(
              allGroups.groups.map(async (group) => {
                const messages = await Database.getGroupMessages(group.gid, 1000, 0)
                return {
                  gid: group.gid,
                  name: group.name,
                  messageCount: messages.success ? messages.messages.length : 0,
                  lastMessageTime: messages.success && messages.messages.length > 0 
                    ? messages.messages[0].sent_time 
                    : null
                }
              })
            )
            
            this.totalGroupMessages = this.groupStats.reduce((sum, group) => sum + group.messageCount, 0)
          }
        } else {
          // 普通用户：获取自己的群组统计
          const userGroupStats = await Database.getUserGroupStats()
          if (userGroupStats.success) {
            groupStats = userGroupStats.stats
          }
          
          if (groupStats.length > 0) {
            this.groupStats = groupStats
            this.totalGroups = groupStats.length
            this.totalGroupMessages = groupStats.reduce((sum, group) => sum + group.messageCount, 0)
          } else {
            // 如果API不可用，使用原有方法
            const groups = await Database.getUserGroups()
            
            if (groups.success && groups.groups) {
              this.totalGroups = groups.groups.length
              
              // 计算群组统计
              this.groupStats = await Promise.all(
                groups.groups.map(async (group) => {
                  const messages = await Database.getGroupMessages(group.gid, 1000, 0)
                  return {
                    gid: group.gid,
                    name: group.name,
                    messageCount: messages.success ? messages.messages.length : 0,
                    lastMessageTime: messages.success && messages.messages.length > 0 
                      ? messages.messages[0].sent_time 
                      : null
                  }
                })
              )
              
              this.totalGroupMessages = this.groupStats.reduce((sum, group) => sum + group.messageCount, 0)
            }
          }
        }
        
      } catch (error) {
        console.error('加载群组统计失败:', error)
      }
    },
    
    async loadAdminData() {
      try {
        // 加载管理员专用数据
        const users = await Database.getAllUsers()
        if (users.success) {
          this.allUsersCount = users.users.length
        }
        
        const surveys = await Database.getSurveys()
        if (surveys.success) {
          this.allSurveysCount = surveys.surveys.length
        }
        
        // 获取所有动态统计
        const postsStats = await Database.getAllPostsStats()
        if (postsStats.success) {
          this.allPostsCount = postsStats.totalPosts
        } else {
          this.allPostsCount = await this.getAllPostsCount()
        }
        
      } catch (error) {
        console.error('加载管理员数据失败:', error)
      }
    },
    
    async getAllPostsCount() {
      const result = await Database.getAllPostsStats()
      return result.success ? result.totalPosts : 0
    },

    switchView(view) {
      this.currentView = view
    },
    
    switchPostView(view) {
      this.currentPostView = view
    },
    
    switchGroupView(view) {
      this.currentGroupView = view
    },
    
    getAccountTypeName(accountType) {
      const typeNames = {
        0: '管理员',
        1: '教师',
        2: '学生',
      }
      return typeNames[accountType] || '未知'
    },
    
    getAvatarUrl(avatar) {
      if (!avatar) {
        return '/static/avatar.png'
      }
      if (avatar.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${avatar}`
      }
      return avatar
    },
    
    formatTime(timeStr) {
      if (!timeStr) return '未知'
      const date = new Date(timeStr)
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatAnswer(answer, answerType) {
      if (answer === null || answer === undefined || answer === '') {
        return '未回答'
      }
      
      // 根据答案类型格式化答案
      switch (answerType) {
        case 0: // 符合度打分 (-5~5)
          return `评分: ${answer}`
        case 1: // 是否题 (1/0)
          return answer === '1' ? '是' : '否'
        case 2: // 单选题 (不超过10个选项，每个选项对应一个得分)
          return answer
        case 3: // 多选题 (不超过10个选项，每个选项对应一个得分)
          try {
            const answers = JSON.parse(answer)
            return Array.isArray(answers) ? answers.join(', ') : answer
          } catch {
            return answer
          }
        case 4: // 文字输入 (不超过100字符)
          return answer
        default:
          return answer
      }
    },



    getAllTextInputAnswers() {
      if (!this.allSurveyAnswers || !Array.isArray(this.allSurveyAnswers)) {
        return []
      }
      
      // 过滤出所有测评中的文字输入答案，按测评分组
      const textInputSurveys = this.allSurveyAnswers.map(survey => {
        const textInputAnswers = survey.answers.filter(answer => answer.answerType === 4)
        if (textInputAnswers.length > 0) {
          return {
            sid: survey.sid,
            surveyName: survey.surveyName,
            answers: textInputAnswers
          }
        }
        return null
      }).filter(survey => survey !== null)
      
      return textInputSurveys
    },
    
    getScoreClass(value) {
      if (value >= 4) return 'score-high'
      if (value >= 2) return 'score-medium'
      return 'score-low'
    },
    
    // 处理时间容差，合并同一用户在同一分钟内完成的同一测评
    processSurveyResultsWithTimeTolerance(results) {
      if (!results || results.length === 0) return []
      
      // 按用户和测评分组
      const groupedResults = {}
      
      results.forEach(result => {
        const uid = result.uid || this.currentUser.uid
        const sid = result.sid
        const doneTime = new Date(result.doneTime)
        
        // 将时间精确到分钟，忽略秒数
        const timeKey = new Date(doneTime.getFullYear(), doneTime.getMonth(), doneTime.getDate(), 
                                doneTime.getHours(), doneTime.getMinutes())
        
        const groupKey = `${uid}_${sid}_${timeKey.getTime()}`
        
        if (!groupedResults[groupKey]) {
          groupedResults[groupKey] = {
            uid: uid,
            userName: result.userName,
            sid: sid,
            surveyName: result.surveyName,
            doneTime: result.doneTime,
            timeKey: timeKey,
            scores: [],
            textInputs: result.textInputs
          }
        }
        
        // 合并得分
        if (result.scores && result.scores.length > 0) {
          result.scores.forEach(score => {
            // 检查是否已存在相同的得分项
            const existingScore = groupedResults[groupKey].scores.find(s => s.name === score.name)
            if (existingScore) {
              // 如果已存在，取平均值或最新值（这里取最新值）
              existingScore.value = score.value
            } else {
              groupedResults[groupKey].scores.push(score)
            }
          })
          
          // 对得分项进行排序
          groupedResults[groupKey].scores = this.sortScores(groupedResults[groupKey].scores)
        }
        
        // 合并文字输入（如果有多个，用分号连接）
        if (result.textInputs && result.textInputs.trim()) {
          if (groupedResults[groupKey].textInputs && groupedResults[groupKey].textInputs.trim()) {
            groupedResults[groupKey].textInputs += '; ' + result.textInputs
          } else {
            groupedResults[groupKey].textInputs = result.textInputs
          }
        }
      })
      
      // 转换为数组并按时间排序
      const processedResults = Object.values(groupedResults)
        .sort((a, b) => new Date(b.doneTime) - new Date(a.doneTime))
      
      return processedResults
    },
    
    // 对得分项进行排序
    sortScores(scores) {
      if (!scores || scores.length === 0) return scores
      
      // 定义得分项的优先级顺序
      const scoreOrder = [
        '总分', '总体得分', '综合得分',
        '焦虑指数', '焦虑', '焦虑程度',
        '抑郁指数', '抑郁', '抑郁程度', 
        '压力指数', '压力', '压力程度',
        '学习效率', '学习状态', '学习能力',
        '专注度', '注意力', '专注力',
        '情绪状态', '情绪', '心理状态',
        '社交能力', '人际关系', '社交',
        '自我认知', '自我评价', '自信',
        '适应能力', '适应性', '适应',
        '创造力', '创新', '创造性',
        '记忆力', '记忆', '记忆能力'
      ]
      
      return scores.sort((a, b) => {
        const aIndex = scoreOrder.findIndex(item => a.name.includes(item))
        const bIndex = scoreOrder.findIndex(item => b.name.includes(item))
        
        // 如果都在预定义顺序中，按预定义顺序排序
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex
        }
        
        // 如果只有一个在预定义顺序中，优先显示
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        
        // 如果都不在预定义顺序中，按名称字母顺序排序
        return a.name.localeCompare(b.name, 'zh-CN')
      })
    },
    
    // 管理员：按测评sid分组统计
    processSurveyResultsBySurvey(results) {
      if (!results || results.length === 0) return []
      
      // 按测评sid分组
      const surveyGroups = {}
      
      results.forEach(result => {
        const sid = result.sid
        const surveyName = result.surveyName
        
        if (!surveyGroups[sid]) {
          surveyGroups[sid] = {
            sid: sid,
            surveyName: surveyName,
            totalCount: 0,
            scoreStats: {},
            allScores: []
          }
        }
        
        surveyGroups[sid].totalCount++
        
        // 收集所有得分数据
        if (result.scores && result.scores.length > 0) {
          result.scores.forEach(score => {
            if (!surveyGroups[sid].scoreStats[score.name]) {
              surveyGroups[sid].scoreStats[score.name] = []
            }
            // 确保score.value是有效数值
            const value = score.value
            if (value !== null && value !== undefined && value !== '') {
              surveyGroups[sid].scoreStats[score.name].push(value)
            }
          })
        }
      })
      
      // 计算每个测评的统计信息
      const surveyStats = Object.values(surveyGroups).map(survey => {
        const avgScores = []
        
        // 计算各项得分的平均值
        Object.keys(survey.scoreStats).forEach(scoreName => {
          const values = survey.scoreStats[scoreName]
          
          // 过滤并转换数值，确保所有值都是有效数字
          const validValues = values
            .map(val => {
              // 尝试转换为数字
              const num = parseFloat(val)
              return isNaN(num) ? 0 : num
            })
            .filter(val => !isNaN(val) && isFinite(val))
          
          if (validValues.length > 0) {
            const sum = validValues.reduce((sum, val) => sum + val, 0)
            const average = sum / validValues.length
            avgScores.push({
              name: scoreName,
              value: Math.round(average * 100) / 100, // 保留两位小数
              count: validValues.length
            })
          } else {
            // 如果没有有效数值，显示0
            avgScores.push({
              name: scoreName,
              value: 0,
              count: 0
            })
          }
        })
        
        return {
          sid: survey.sid,
          surveyName: survey.surveyName,
          totalCount: survey.totalCount,
          avgScores: this.sortScores(avgScores)
        }
      })
      
      // 按测评名称排序
      return surveyStats.sort((a, b) => a.surveyName.localeCompare(b.surveyName, 'zh-CN'))
    },
    
    // 导出测评结果统计
    async exportSurveyResults() {
      try {
        if (!this.allSurveyResults || this.allSurveyResults.length === 0) {
          uni.showToast({
            title: '暂无数据可导出',
            icon: 'none'
          })
          return
        }

        // 创建工作簿
        const workbook = XLSX.utils.book_new()
        
        // 为每个测评创建sheet
        for (const survey of this.allSurveyResults) {
          const sheetData = []
          
          // 添加表头
          const headers = ['uid', '时间']
          // 添加该测评的所有eid对应名称
          const eidNames = survey.avgScores ? survey.avgScores.map(score => score.name) : []
          headers.push(...eidNames)
          sheetData.push(headers)
          
          // 获取该测评的所有结果数据
          const surveyResults = await this.getSurveyResultsForExport(survey.sid)
          
          // 按uid和done_time分组，获取每个用户每次测试的结果
          const userResults = {}
          for (const result of surveyResults) {
            const key = `${result.uid}_${result.doneTime}`
            if (!userResults[key]) {
              userResults[key] = {
                uid: result.uid,
                doneTime: result.doneTime,
                scores: {}
              }
            }
            userResults[key].scores[result.name] = result.value
          }
          
          // 添加数据行
          for (const key in userResults) {
            const userResult = userResults[key]
            const row = [userResult.uid, this.formatTime(userResult.doneTime)]
            
            // 添加每个eid的得分
            for (const eidName of eidNames) {
              row.push(userResult.scores[eidName] || 0)
            }
            
            sheetData.push(row)
          }
          
          // 创建工作表
          const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
          XLSX.utils.book_append_sheet(workbook, worksheet, survey.surveyName)
        }
        
        // 生成文件名
        const now = new Date()
        const timestamp = now.getFullYear() + 
          String(now.getMonth() + 1).padStart(2, '0') + 
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') + 
          String(now.getMinutes()).padStart(2, '0')
        const fileName = `测评结果${timestamp}.xlsx`
        
        // 导出文件
        XLSX.writeFile(workbook, fileName)
        
        uni.showToast({
          title: '导出成功',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('导出测评结果失败:', error)
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    },
    
    // 显示导出选项弹窗
    async showExportOptions() {
      try {
        // 获取所有测评信息
        const surveysRes = await Database.getSurveys()
        if (surveysRes.success && surveysRes.surveys) {
          // 为每个测评计算答案数量
          this.availableSurveys = await Promise.all(
            surveysRes.surveys.map(async (survey) => {
              const answerCount = this.allSurveyAnswers
                .find(s => s.sid === survey.sid)?.answers?.length || 0
              return {
                sid: survey.sid,
                name: survey.name,
                answerCount: answerCount
              }
            })
          )
          
          // 默认选择所有有答案的测评
          this.selectedSurveys = this.availableSurveys
            .filter(survey => survey.answerCount > 0)
            .map(survey => survey.sid)
          
          this.showExportDialog = true
        } else {
          uni.showToast({
            title: '获取测评列表失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取测评列表失败:', error)
        uni.showToast({
          title: '获取测评列表失败',
          icon: 'none'
        })
      }
    },
    
    // 隐藏导出选项弹窗
    hideExportOptions() {
      this.showExportDialog = false
    },
    
    // 切换测评选择
    toggleSurvey(sid) {
      const index = this.selectedSurveys.indexOf(sid)
      if (index > -1) {
        this.selectedSurveys.splice(index, 1)
      } else {
        this.selectedSurveys.push(sid)
      }
    },
    
    // 设置答案类型过滤
    setAnswerTypeFilter(type) {
      this.answerTypeFilter = type
    },
    
    // 确认导出
    async confirmExport() {
      if (this.selectedSurveys.length === 0) {
        uni.showToast({
          title: '请选择至少一个测评',
          icon: 'none'
        })
        return
      }
      
      this.hideExportOptions()
      await this.exportSurveyAnswers()
    },
    
    // 导出测评答案详情
    async exportSurveyAnswers() {
      try {
        if (!this.allSurveyAnswers || this.allSurveyAnswers.length === 0) {
          uni.showToast({
            title: '暂无数据可导出',
            icon: 'none'
          })
          return
        }

        // 创建工作簿
        const workbook = XLSX.utils.book_new()
        
        // 过滤选中的测评
        const selectedSurveyData = this.allSurveyAnswers.filter(survey => 
          this.selectedSurveys.includes(survey.sid)
        )
        
        // 为每个选中的测评创建sheet
        for (const survey of selectedSurveyData) {
          // 过滤答案类型
          let filteredAnswers = survey.answers
          if (this.answerTypeFilter === 'text') {
            filteredAnswers = survey.answers.filter(answer => answer.answerType === 4)
          }
          
          if (filteredAnswers.length === 0) {
            continue // 跳过没有符合条件答案的测评
          }
          
          // 按问题分组创建多个sheet
          const questionGroups = {}
          filteredAnswers.forEach(answer => {
            const orderNum = answer.orderNum || answer.order_num
            const questionKey = `${orderNum}_${answer.answerType}`
            if (!questionGroups[questionKey]) {
              questionGroups[questionKey] = {
                questionContent: answer.questionContent,
                answerType: answer.answerType,
                orderNum: orderNum,
                answers: []
              }
            }
            questionGroups[questionKey].answers.push(answer)
          })
          
          // 为每个问题创建sheet
          Object.values(questionGroups).forEach((questionGroup, index) => {
            const sheetData = []
            
            // 添加表头
            const headers = ['uid', '时间', '答案']
            sheetData.push(headers)
            
            // 添加数据行
            questionGroup.answers.forEach(answer => {
              const row = [
                answer.uid || '',
                this.formatTime(answer.doneTime),
                this.formatAnswer(answer.answer, answer.answerType)
              ]
              sheetData.push(row)
            })
            
            // 创建工作表
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
            
            // 生成sheet名称：Q+order_num+类型
            const typeName = this.getAnswerTypeName(questionGroup.answerType)
            let sheetName = `Q${questionGroup.orderNum}_${typeName}`
            
            // 限制sheet名称长度（Excel限制31个字符）
            if (sheetName.length > 31) {
              sheetName = sheetName.substring(0, 28) + '...'
            }
            
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
          })
        }
        
        // 生成文件名（使用测评名称）
        const surveyNames = this.availableSurveys
          .filter(survey => this.selectedSurveys.includes(survey.sid))
          .map(survey => survey.name)
          .join('_')
        
        const now = new Date()
        const timestamp = now.getFullYear() + 
          String(now.getMonth() + 1).padStart(2, '0') + 
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') + 
          String(now.getMinutes()).padStart(2, '0')
        
        const fileName = `${surveyNames}_${timestamp}.xlsx`
        
        // 导出文件
        XLSX.writeFile(workbook, fileName)
        
        uni.showToast({
          title: '导出成功',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('导出测评答案失败:', error)
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    },
    
    // 获取测评结果数据用于导出
    async getSurveyResultsForExport(sid) {
      try {
        const result = await Database.getAllSurveyResults()
        if (result.success) {
          // 过滤出指定sid的结果，并展开scores数组
          const surveyResults = []
          for (const item of result.results) {
            if (item.sid === sid) {
              // 为每个score创建一条记录
              for (const score of item.scores) {
                surveyResults.push({
                  uid: item.uid,
                  doneTime: item.doneTime,
                  name: score.name,
                  value: score.value
                })
              }
            }
          }
          return surveyResults
        }
        return []
      } catch (error) {
        console.error('获取测评结果数据失败:', error)
        return []
      }
    },
    
    // 获取答案类型名称
    getAnswerTypeName(type) {
      const typeMap = {
        0: '符合度打分',
        1: '是否题',
        2: '单选题',
        3: '多选题',
        4: '文字输入'
      }
      return typeMap[type] || '未知类型'
    },
    
    // 导出动态发布统计
    async exportPosts() {
      try {
        if (!this.allPosts || this.allPosts.length === 0) {
          uni.showToast({
            title: '暂无数据可导出',
            icon: 'none'
          })
          return
        }

        // 创建工作簿
        const workbook = XLSX.utils.book_new()
        
        // 创建工作表数据
        const sheetData = []
        
        // 添加表头
        const headers = ['uid', '时间', '内容', '点赞数', '评论数', '图片', '文件']
        sheetData.push(headers)
        
        // 添加数据行
        for (const post of this.allPosts) {
          const row = [
            post.uid || post.author_uid || '',
            this.formatTime(post.created_time || post.createdTime),
            post.text_content || post.textContent || '',
            post.likes || 0,
            post.comments || 0,
            this.formatUrls(post.image_urls || post.imageUrls),
            this.formatUrls(post.file_urls || post.fileUrls)
          ]
          sheetData.push(row)
        }
        
        // 创建工作表
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
        XLSX.utils.book_append_sheet(workbook, worksheet, '动态发布统计')
        
        // 生成文件名
        const now = new Date()
        const timestamp = now.getFullYear() + 
          String(now.getMonth() + 1).padStart(2, '0') + 
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') + 
          String(now.getMinutes()).padStart(2, '0')
        const fileName = `动态发布${timestamp}.xlsx`
        
        // 导出文件
        XLSX.writeFile(workbook, fileName)
        
        uni.showToast({
          title: '导出成功',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('导出动态发布统计失败:', error)
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    },
    
    // 显示群会话导出选项弹窗
    async showGroupExportOptions() {
      try {
        // 获取所有群组信息
        const groupsRes = await Database.getUserGroups()
        if (groupsRes.success && groupsRes.groups) {
          // 为每个群组计算消息数量
          this.availableGroups = await Promise.all(
            groupsRes.groups.map(async (group) => {
              const messages = await Database.getGroupMessages(group.gid, 1000, 0)
              return {
                gid: group.gid,
                name: group.name,
                messageCount: messages.success ? messages.messages.length : 0
              }
            })
          )
          
          // 默认选择所有有消息的群组
          this.selectedGroups = this.availableGroups
            .filter(group => group.messageCount > 0)
            .map(group => group.gid)
          
          this.showGroupExportDialog = true
        } else {
          uni.showToast({
            title: '获取群组列表失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('获取群组列表失败:', error)
        uni.showToast({
          title: '获取群组列表失败',
          icon: 'none'
        })
      }
    },
    
    // 隐藏群会话导出选项弹窗
    hideGroupExportOptions() {
      this.showGroupExportDialog = false
    },
    
    // 切换群组选择
    toggleGroup(gid) {
      const index = this.selectedGroups.indexOf(gid)
      if (index > -1) {
        this.selectedGroups.splice(index, 1)
      } else {
        this.selectedGroups.push(gid)
      }
    },
    
    // 设置时间范围过滤
    setTimeRangeFilter(range) {
      this.timeRangeFilter = range
    },
    
    // 确认群会话导出
    async confirmGroupExport() {
      if (this.selectedGroups.length === 0) {
        uni.showToast({
          title: '请选择至少一个群组',
          icon: 'none'
        })
        return
      }
      
      this.hideGroupExportOptions()
      await this.exportGroupMessages()
    },
    
    // 导出群会话统计
    async exportGroupMessages() {
      try {
        if (!this.groupStats || this.groupStats.length === 0) {
          uni.showToast({
            title: '暂无数据可导出',
            icon: 'none'
          })
          return
        }

        // 创建工作簿
        const workbook = XLSX.utils.book_new()
        
        // 过滤选中的群组
        const selectedGroupData = this.groupStats.filter(group => 
          this.selectedGroups.includes(group.gid)
        )
        
        // 为每个选中的群组创建sheet
        for (const group of selectedGroupData) {
          const sheetData = []
          
          // 添加表头
          const headers = ['uid', '用户名', '时间', '内容', '类型']
          sheetData.push(headers)
          
          // 获取该群组的消息数据
          const messages = await this.getGroupMessagesForExport(group.gid)
          
          // 过滤时间范围
          let filteredMessages = messages
          if (this.timeRangeFilter !== 'all') {
            const days = parseInt(this.timeRangeFilter)
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - days)
            
            filteredMessages = messages.filter(message => {
              const messageDate = new Date(message.sent_time)
              return messageDate >= cutoffDate
            })
          }
          
          // 添加数据行
          for (const message of filteredMessages) {
            const row = [
              message.sender_uid || '',
              message.userName || '未知用户',
              this.formatTime(message.sent_time),
              message.content || '',
              this.getMessageTypeName(message.msg_type)
            ]
            sheetData.push(row)
          }
          
          // 创建工作表
          const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
          const sheetName = `${group.gid}-${group.name}`
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        }
        
        // 生成文件名
        const groupNames = this.availableGroups
          .filter(group => this.selectedGroups.includes(group.gid))
          .map(group => group.name)
          .join('_')
        
        const now = new Date()
        const timestamp = now.getFullYear() + 
          String(now.getMonth() + 1).padStart(2, '0') + 
          String(now.getDate()).padStart(2, '0') + '_' +
          String(now.getHours()).padStart(2, '0') + 
          String(now.getMinutes()).padStart(2, '0')
        
        const timeRangeText = this.timeRangeFilter === 'all' ? '全部' : `最近${this.timeRangeFilter}天`
        const fileName = `群组聊天记录_${groupNames}_${timeRangeText}_${timestamp}.xlsx`
        
        // 导出文件
        XLSX.writeFile(workbook, fileName)
        
        uni.showToast({
          title: '导出成功',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('导出群会话统计失败:', error)
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    },
    
    // 获取群组消息数据用于导出
    async getGroupMessagesForExport(gid) {
      try {
        if (!gid) {
          console.warn('群组ID为空，跳过获取消息')
          return []
        }
        
        const result = await Database.getGroupMessages(gid, 1000, 0)
        if (result.success && result.messages) {
          // 为每个消息添加用户名信息
          const messagesWithUserNames = await Promise.all(
            result.messages.map(async (message) => {
              try {
                const userRes = await Database.getUserById(message.sender_uid)
                return {
                  ...message,
                  userName: userRes.success && userRes.user ? userRes.user.name : '未知用户'
                }
              } catch (error) {
                console.warn(`获取用户${message.sender_uid}信息失败:`, error)
                return {
                  ...message,
                  userName: '未知用户'
                }
              }
            })
          )
          return messagesWithUserNames
        }
        return []
      } catch (error) {
        console.error('获取群组消息数据失败:', error)
        return []
      }
    },
    
    // 格式化URLs
    formatUrls(urls) {
      if (!urls) return ''
      if (typeof urls === 'string') {
        try {
          const parsed = JSON.parse(urls)
          return Array.isArray(parsed) ? parsed.join('; ') : parsed
        } catch {
          return urls
        }
      }
      if (Array.isArray(urls)) {
        return urls.join('; ')
      }
      return String(urls)
    },
    
    // 获取消息类型名称
    getMessageTypeName(type) {
      const typeMap = {
        0: '文本',
        1: '图片',
        2: '文件',
        3: '语音',
        4: '视频'
      }
      return typeMap[type] || '未知类型'
    }
    
  }
}
</script>

<style scoped>
.survey-stats-container {
  min-height: 100vh;
  padding: 40rpx;
  background: #f8f9fa;
  background-image: url('/static/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  box-sizing: border-box;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.page-title {
  display: block;
  font-size: 48rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #7f8c8d;
}

.content {
  height: calc(100vh - 140rpx);
  margin: 0 auto;
}

/* 用户信息卡片 */
.user-info-card {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #e0e0e0;
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.user-role {
  display: block;
  font-size: 24rpx;
  color: #9b59b6;
}

.stats-summary {
  display: flex;
  justify-content: space-around;
}

.summary-item {
  text-align: center;
}

.summary-number {
  display: block;
  font-size: 36rpx;
  color: #55B99E;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.summary-label {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
}

/* 统计区块 */
.stats-section {
  background: white;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
  background: white;
  border-radius: 16rpx 16rpx 0 0;
}

.section-title {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.export-btn {
  padding: 12rpx 20rpx;
  background: #55B99E;
  border-radius: 8rpx;
  cursor: pointer;
  transition: background-color 0.3s;
}

.export-btn:hover {
  background: #0056CC;
}

.export-text {
  color: white;
  font-size: 24rpx;
  font-weight: bold;
}

.view-toggle {
  display: flex;
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 4rpx;
  overflow-x: scroll;
}

.toggle-btn {
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  color: #7f8c8d;
  border-radius: 6rpx;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: #55B99E;
  color: white;
}

/* 预览内容 */
.preview-content {
  padding: 32rpx;
  flex: 1;
  overflow-y: auto;
}

.preview-title {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 24rpx;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.result-item {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 24rpx;
  background: #f8f9fa;
}

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.survey-name {
  font-size: 26rpx;
  color: #2c3e50;
  font-weight: bold;
}

.result-time {
  font-size: 22rpx;
  color: #7f8c8d;
}

.result-scores {
  display: flex;
  gap: 24rpx;
}

.score-item {
  text-align: center;
}

.score-name {
  display: block;
  font-size: 22rpx;
  color: #7f8c8d;
  margin-bottom: 4rpx;
}

.score-value {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
}

.score-high {
  color: #27ae60;
}

.score-medium {
  color: #f39c12;
}

.score-low {
  color: #e74c3c;
}

.score-count {
  font-size: 20rpx;
  color: #7f8c8d;
  font-weight: normal;
}

/* 详细内容 */
.detail-content {
  padding: 32rpx;
  flex: 1;
  overflow-y: auto;
}

.detail-title {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 24rpx;
}

.results-table, .posts-table, .groups-table, .survey-stats-table {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  overflow: hidden;
}

.table-header {
  display: flex;
  background: #f8f9fa;
  padding: 16rpx;
  border-bottom: 1rpx solid #e0e0e0;
}

.table-row {
  display: flex;
  padding: 14rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.table-row:last-child {
  border-bottom: none;
}

.col-user, .col-survey, .col-time, .col-scores, .col-input, .col-content, .col-stats, .col-group, .col-messages, .col-last, .col-count {
  font-size: 24rpx;
  color: #2c3e50;
}

.col-user {
  flex: 1.5;
  text-align: center;
}

.col-survey, .col-content, .col-group {
  flex: 2;
}

.col-content {
  flex: 2.5;
}

/* 管理员测评统计表格的列宽调整 */
.survey-stats-table .col-survey {
  flex: 1.5;
}

.survey-stats-table .col-scores {
  flex: 2.5;
}

.col-time, .col-messages, .col-last {
  flex: 2;
  text-align: center;
}

.col-scores, .col-input, .col-stats {
  flex: 2;
}

.col-count {
  flex: 1;
  text-align: center;
}

.score-detail {
  margin-bottom: 8rpx;
}

.score-detail:last-child {
  margin-bottom: 0;
}

.input-content {
  font-size: 22rpx;
  color: #7f8c8d;
  line-height: 1.4;
}

.post-text {
  font-size: 24rpx;
  color: #2c3e50;
  line-height: 1.4;
}

.stats-text {
  font-size: 22rpx;
  color: #7f8c8d;
}

/* 动态统计卡片 */
.summary-cards {
  display: flex;
  gap: 24rpx;
}

.summary-card {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 1rpx solid #e0e0e0;
}

.card-number {
  display: block;
  font-size: 32rpx;
  color: #55B99E;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.card-label {
  display: block;
  font-size: 22rpx;
  color: #7f8c8d;
}

/* 群组统计 */
.group-stats {
  display: flex;
  gap: 24rpx;
}

.group-item {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 1rpx solid #e0e0e0;
}

.group-name {
  display: block;
  font-size: 24rpx;
  color: #2c3e50;
  margin-bottom: 8rpx;
}

.group-count {
  display: block;
  font-size: 28rpx;
  color: #55B99E;
  font-weight: bold;
}

/* 管理员统计 */
.admin-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.admin-section .section-title {
  color: white;
}

.admin-stats {
  padding: 32rpx;
}

.admin-cards {
  display: flex;
  gap: 24rpx;
}

.admin-card {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.admin-number {
  display: block;
  font-size: 32rpx;
  color: white;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.admin-label {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 加载状态 */
.loading-overlay {
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

.loading-text {
  color: white;
  font-size: 28rpx;
}

/* SurveyAnswers统计样式 */
.latest-answers, .all-text-answers {
  padding: 24rpx 0;
}

.answers-list {
  margin-top: 16rpx;
}

.survey-info {
  background: #f8f9fa;
  padding: 16rpx 20rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
  border-left: 4rpx solid #55B99E;
}

.survey-name {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.survey-time {
  display: block;
  font-size: 22rpx;
  color: #7f8c8d;
}

.answers-details {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.answer-item {
  background: white;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.answer-user {
  font-size: 24rpx;
  color: #55B99E;
  font-weight: bold;
  background: #f0f8ff;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  border: 1rpx solid #55B99E;
}

.question-content {
  display: block;
  font-size: 26rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.answer-content {
  display: block;
  font-size: 24rpx;
  color: #55B99E;
  background: #f0f8ff;
  padding: 8rpx 12rpx;
  border-radius: 6rpx;
  border-left: 3rpx solid #55B99E;
}

.answer-time {
  display: block;
  font-size: 20rpx;
  color: #95a5a6;
  margin-top: 8rpx;
}

.answers-by-survey {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.survey-answers-group {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  border: 1rpx solid #e0e0e0;
}

.survey-header {
  background: #55B99E;
  color: white;
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.survey-header .survey-name {
  color: white;
  margin-bottom: 0;
}

.no-data {
  text-align: center;
  padding: 60rpx 20rpx;
  color: #95a5a6;
}

.no-data-text {
  font-size: 28rpx;
  color: #95a5a6;
}

/* 导出选项弹窗样式 */
.export-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.export-dialog {
  background: white;
  border-radius: 16rpx;
  width: 90%;
  max-width: 600rpx;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: #f8f9fa;
}

.dialog-title {
  font-size: 32rpx;
  color: #2c3e50;
  font-weight: bold;
}

.close-btn {
  font-size: 40rpx;
  color: #7f8c8d;
  cursor: pointer;
  padding: 8rpx;
  line-height: 1;
}

.dialog-content {
  padding: 32rpx;
  max-height: 50vh;
  overflow-y: auto;
}

.option-group {
  margin-bottom: 32rpx;
}

.option-group:last-child {
  margin-bottom: 0;
}

.option-label {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.survey-list {
  max-height: 200rpx;
  overflow-y: auto;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
}

.survey-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.survey-option:last-child {
  border-bottom: none;
}

.survey-option:hover {
  background: #f8f9fa;
}

.survey-option.selected {
  background: #e3f2fd;
  border-left: 4rpx solid #55B99E;
}

.survey-name {
  font-size: 26rpx;
  color: #2c3e50;
  font-weight: bold;
}

.survey-count {
  font-size: 22rpx;
  color: #7f8c8d;
}

.type-options {
  display: flex;
  gap: 16rpx;
}

.type-option {
  flex: 1;
  padding: 16rpx 20rpx;
  text-align: center;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option:hover {
  background: #f8f9fa;
}

.type-option.selected {
  background: #55B99E;
  border-color: #55B99E;
}

.type-option.selected .type-text {
  color: white;
}

.type-text {
  font-size: 26rpx;
  color: #2c3e50;
  font-weight: bold;
}

.dialog-actions {
  display: flex;
  gap: 16rpx;
  padding: 32rpx;
  border-top: 1rpx solid #f0f0f0;
  background: #f8f9fa;
}

.action-btn {
  flex: 1;
  padding: 20rpx;
  text-align: center;
  border-radius: 8rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f8f9fa;
  border: 1rpx solid #e0e0e0;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.confirm-btn {
  background: #55B99E;
  border: 1rpx solid #55B99E;
}

.confirm-btn:hover {
  background: #0056CC;
}

.btn-text {
  font-size: 28rpx;
  font-weight: bold;
}

.cancel-btn .btn-text {
  color: #2c3e50;
}

.confirm-btn .btn-text {
  color: white;
}

/* 群会话导出选项样式 */
.group-list {
  max-height: 200rpx;
  overflow-y: auto;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
}

.group-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-option:last-child {
  border-bottom: none;
}

.group-option:hover {
  background: #f8f9fa;
}

.group-option.selected {
  background: #e3f2fd;
  border-left: 4rpx solid #55B99E;
}

.group-name {
  font-size: 26rpx;
  color: #2c3e50;
  font-weight: bold;
}

.group-count {
  font-size: 22rpx;
  color: #7f8c8d;
}

.time-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.time-option {
  padding: 16rpx 20rpx;
  text-align: center;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.time-option:hover {
  background: #f8f9fa;
}

.time-option.selected {
  background: #55B99E;
  border-color: #55B99E;
}

.time-option.selected .time-text {
  color: white;
}

.time-text {
  font-size: 24rpx;
  color: #2c3e50;
  font-weight: bold;
}
</style>
