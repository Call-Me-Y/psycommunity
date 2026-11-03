<template>
  <view class="survey-create-container">
    <view class="header">
      <view class="header-left" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="page-title">创建测评</text>
      <view class="header-right" @click="saveSurvey">
        <text class="save-btn">保存</text>
      </view>
    </view>

    <scroll-view class="content" scroll-y>
      <!-- 基本信息 -->
      <view class="section">
        <text class="section-title">基本信息</text>
        
        <view class="form-group">
          <text class="label">测评名称 *</text>
          <textarea 
            class="textarea" 
            v-model="surveyData.name" 
            placeholder="请输入测评名称"
            maxlength="20"
          />
        </view>

        <view class="form-group">
          <text class="label">简介</text>
          <textarea 
            class="textarea" 
            v-model="surveyData.intro" 
            placeholder="请输入测评简介"
            maxlength="100"
          />
        </view>

        <view class="form-group">
          <text class="label">填写说明</text>
          <textarea 
            class="textarea" 
            v-model="surveyData.info" 
            placeholder="请输入填写说明"
            maxlength="100"
          />
        </view>

        <view class="form-group">
          <text class="label">封面图片</text>
          <view class="cover-upload" @click="uploadCover">
            <image 
              class="cover-image" 
              :src="getCoverUrl(surveyData.cover)"
              mode="aspectFill"
            />
            <text class="cover-change">点击更换封面</text>
          </view>
        </view>
      </view>

      <!-- 问题列表 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">问题列表</text>
          <view class="add-question-btn" @click="showQuestionTypeDialog">
            <text class="add-icon">+</text>
          </view>
        </view>

        <view class="question-list">
          <view 
            v-for="(question, index) in surveyData.questions" 
            :key="question.tempId"
            class="question-item"
          >
            <view class="question-header">
              <text class="question-number">Q{{ index + 1 }}</text>
              <view class="question-actions">
                <text class="action-btn" @click="editQuestion(index)">编辑</text>
                <text class="action-btn delete" @click="deleteQuestion(index)">删除</text>
              </view>
            </view>
            
            <view class="question-content">
              <text class="question-text">{{ question.content }}</text>
              <text class="question-type">{{ getQuestionTypeName(question.type) }}</text>
            </view>

            <!-- 选项列表（仅单选和多选显示） -->
            <view v-if="question.type === 2 || question.type === 3" class="options-list">
              <view 
                v-for="(option, optIndex) in question.options" 
                :key="optIndex"
                class="option-item"
              >
                <text class="option-order">{{ optIndex + 1 }}</text>
                <view class="option-content-wrapper">
                  <text class="option-content">{{ option.content }}</text>
                  <image 
                    v-if="option.image" 
                    class="option-preview-image" 
                    :src="getImageUrl(option.image)" 
                    mode="aspectFill"
                  />
                </view>
                <text class="option-value">值: {{ option.value }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 结果计算公式 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">结果计算公式</text>
          <view class="add-result-btn" @click="showResultDialog">
            <text class="add-icon">+</text>
          </view>
        </view>

        <view class="results-list">
          <view 
            v-for="(result, index) in surveyData.results" 
            :key="result.tempId"
            class="result-item"
          >
            <view class="result-header">
              <text class="result-number">结果{{ index + 1 }}</text>
              <view class="result-actions">
                <text class="action-btn" @click="editResult(index)">编辑</text>
                <text class="action-btn delete" @click="deleteResult(index)">删除</text>
              </view>
            </view>
            
            <view class="result-content">
              <text class="result-name">{{ result.name }}</text>
              <text class="result-expression">{{ result.expression }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 问题类型选择弹窗 -->
    <view class="dialog-overlay" v-if="showQuestionDialog" @click="hideQuestionTypeDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">选择问题类型</text>
          <text class="dialog-close" @click="hideQuestionTypeDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="question-types">
            <view 
              v-for="type in questionTypes" 
              :key="type.value"
              class="type-item"
              @click="selectQuestionType(type.value)"
            >
              <text class="type-name">{{ type.name }}</text>
              <text class="type-desc">{{ type.description }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 问题编辑弹窗 -->
    <view class="dialog-overlay" v-if="showEditDialog" @click="hideEditDialog">
      <view class="dialog large" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">{{ editingQuestionIndex >= 0 ? '编辑问题' : '添加问题' }}</text>
          <text class="dialog-close" @click="hideEditDialog">×</text>
        </view>
        <scroll-view class="dialog-content" scroll-y>
          <view class="form-group">
            <text class="label">问题内容 *</text>
            <textarea 
              class="textarea" 
              v-model="editingQuestion.content" 
              placeholder="请输入问题内容"
              maxlength="100"
            />
          </view>

          <view class="form-group">
            <text class="label">问题图片（可选）</text>
            <view class="image-upload" @click="uploadQuestionImage">
              <image 
                v-if="editingQuestion.image" 
                class="question-image" 
                :src="getImageUrl(editingQuestion.image)" 
                mode="aspectFill"
              />
              <view v-else class="image-placeholder">
                <text class="upload-text">点击上传图片</text>
              </view>
            </view>
          </view>

          <!-- 选项管理（单选和多选） -->
          <view v-if="editingQuestion.type === 2 || editingQuestion.type === 3" class="options-section">
            <view class="options-header">
              <text class="label">选项设置</text>
              <view class="add-option-btn" @click="addOption">
                <text class="add-icon">+</text>
              </view>
            </view>
            
            <view class="options-list">
              <view 
                v-for="(option, index) in editingQuestion.options" 
                :key="index"
                class="option-edit-item"
              >
                <input 
                  class="option-order-input" 
                  v-model.number="option.order_num" 
                  placeholder="顺序"
                  type="number"
                />
                <input 
                  class="option-content-input" 
                  v-model="option.content" 
                  placeholder="选项内容"
                  maxlength="20"
                />
                <input 
                  class="option-value-input" 
                  v-model.number="option.value" 
                  placeholder="对应值"
                  type="number"
                />
                <view class="option-image-upload" @click="uploadOptionImage(index)">
                  <image 
                    v-if="option.image" 
                    class="option-image" 
                    :src="getImageUrl(option.image)" 
                    mode="aspectFill"
                  />
                  <view v-else class="option-image-placeholder">
                    <text class="upload-text">图片</text>
                  </view>
                </view>
                <text class="delete-option-btn" @click="deleteOption(index)">×</text>
              </view>
            </view>
          </view>

          <view class="dialog-actions">
            <button class="btn cancel" @click="hideEditDialog">取消</button>
            <button class="btn confirm" @click="saveQuestion">保存</button>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 结果编辑弹窗 -->
    <view class="dialog-overlay" v-if="showResultEditDialog" @click="hideResultDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-header">
          <text class="dialog-title">{{ editingResultIndex >= 0 ? '编辑结果' : '添加结果' }}</text>
          <text class="dialog-close" @click="hideResultDialog">×</text>
        </view>
        <view class="dialog-content">
          <view class="form-group">
            <text class="label">结果名称 *</text>
            <textarea 
              class="input" 
              v-model="editingResult.name" 
              placeholder="请输入结果名称和说明"
              maxlength="20"
            />
          </view>

          <view class="form-group">
            <text class="label">计算表达式 *</text>
            <textarea 
              class="textarea" 
              v-model="editingResult.expression" 
              placeholder="例如: Q1*2+Q3/(4-Q4)*Q5"
              @input="onExpressionInput"
            />
            <text class="formula-help">使用Q1, Q2, Q3...表示问题，支持+、-、*、/、(、)运算，只能用英文括号，不要有大写字母Q和以上运算符以外的字符，不要除以可能为0的值</text>
            
            <!-- 验证结果显示区域 -->
            <view class="validation-result" v-if="validationResult.show">
              <view class="validation-status" :class="{ 'success': validationResult.isValid, 'error': !validationResult.isValid }">
                <text class="status-icon">{{ validationResult.isValid ? '✓' : '✗' }}</text>
                <text class="status-text">{{ validationResult.isValid ? '算式验证通过' : '算式验证失败' }}</text>
              </view>
              <text v-if="!validationResult.isValid" class="error-message">{{ validationResult.error }}</text>
              <text v-if="validationResult.isValid && validationResult.warning" class="warning-message">{{ validationResult.warning }}</text>
            </view>
          </view>

          <view class="dialog-actions">
            <button class="btn cancel" @click="hideResultDialog">取消</button>
            <button class="btn confirm" @click="handleSaveOrTest">{{ getSaveButtonText() }}</button>
          </view>
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
      surveyData: {
        name: '',
        intro: '',
        info: '',
        cover: '/static/cover.jpg',
        questions: [],
        results: []
      },
      showQuestionDialog: false,
      showEditDialog: false,
      showResultEditDialog: false,
      editingQuestionIndex: -1,
      editingResultIndex: -1,
      editingQuestion: {
        content: '',
        image: '',
        type: 0,
        options: []
      },
      editingResult: {
        name: '',
        expression: ''
      },
      validationResult: {
        show: false,
        isValid: false,
        error: '',
        warning: ''
      },
      isExpressionTested: false,
      questionTypes: [
        { value: 0, name: '符合度打分', description: '5分制评分，范围-5到5' },
        { value: 1, name: '是否题', description: '是/否选择，对应1/0' },
        { value: 2, name: '单选题', description: '从多个选项中选择一个' },
        { value: 3, name: '多选题', description: '从多个选项中选择多个' },
        { value: 4, name: '文字输入', description: '输入不超过100字符的文字' }
      ]
    }
  },
  onLoad() {
    this.checkAdminStatus()
  },
  methods: {
    async checkAdminStatus() {
      try {
        const userRes = await Database.verifyToken()
        if (!userRes.success || userRes.user.type !== 0) {
          uni.showToast({
            title: '权限不足',
            icon: 'none'
          })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
      } catch (error) {
        console.error('检查管理员状态失败:', error)
        uni.navigateBack()
      }
    },
    
    goBack() {
      uni.navigateBack()
    },

    getCoverUrl(imagePath) {
      const path = String(imagePath || '').trim()
      if (!path || path.toLowerCase() === 'null' || path === 'static/cover.jpg') return '/static/cover.jpg'
      return this.getImageUrl(path)
    },
    getImageUrl(imagePath) {
      if (!imagePath) return ''
      if (imagePath.startsWith('http')) return imagePath
      if (imagePath.startsWith('/uploads/')) {
        return `${config.STATIC_BASE_URL}${imagePath}`
      }
      return imagePath
    },

    uploadCover() {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          const filePath = res.tempFilePaths[0]
          try {
            uni.showLoading({ title: '上传中...' })
            const uploadRes = await Database.uploadSurveyImage(filePath, 'survey')
            uni.hideLoading()
            
            if (uploadRes.success) {
              this.surveyData.cover = uploadRes.url
              uni.showToast({ title: '封面上传成功', icon: 'success' })
            } else {
              uni.showToast({ title: uploadRes.message || '上传失败', icon: 'none' })
            }
          } catch (error) {
            uni.hideLoading()
            console.error('上传封面失败:', error)
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        }
      })
    },

    uploadQuestionImage() {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          const filePath = res.tempFilePaths[0]
          try {
            uni.showLoading({ title: '上传中...' })
            const uploadRes = await Database.uploadSurveyImage(filePath, 'question')
            uni.hideLoading()
            
            if (uploadRes.success) {
              this.editingQuestion.image = uploadRes.url
              uni.showToast({ title: '图片上传成功', icon: 'success' })
            } else {
              uni.showToast({ title: uploadRes.message || '上传失败', icon: 'none' })
            }
          } catch (error) {
            uni.hideLoading()
            console.error('上传图片失败:', error)
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        }
      })
    },

    showQuestionTypeDialog() {
      this.showQuestionDialog = true
    },

    hideQuestionTypeDialog() {
      this.showQuestionDialog = false
    },

    selectQuestionType(type) {
      this.hideQuestionTypeDialog()
      this.editingQuestion = {
        content: '',
        image: '',
        type: type,
        options: []
      }
      this.editingQuestionIndex = -1
      this.showEditDialog = true
    },

    hideEditDialog() {
      this.showEditDialog = false
      this.editingQuestionIndex = -1
    },

    editQuestion(index) {
      this.editingQuestion = JSON.parse(JSON.stringify(this.surveyData.questions[index]))
      this.editingQuestionIndex = index
      this.showEditDialog = true
    },

    deleteQuestion(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个问题吗？',
        success: (res) => {
          if (res.confirm) {
            this.surveyData.questions.splice(index, 1)
          }
        }
      })
    },

    addOption() {
      this.editingQuestion.options.push({
        order_num: this.editingQuestion.options.length + 1,
        content: '',
        value: 0
      })
    },

    deleteOption(index) {
      this.editingQuestion.options.splice(index, 1)
    },

    uploadOptionImage(optionIndex) {
      uni.chooseImage({
        count: 1,
        success: async (res) => {
          const filePath = res.tempFilePaths[0]
          try {
            uni.showLoading({ title: '上传中...' })
            const uploadRes = await Database.uploadSurveyImage(filePath, 'option')
            uni.hideLoading()
            
            if (uploadRes.success) {
              this.editingQuestion.options[optionIndex].image = uploadRes.url
              uni.showToast({ title: '图片上传成功', icon: 'success' })
            } else {
              uni.showToast({ title: uploadRes.message || '上传失败', icon: 'none' })
            }
          } catch (error) {
            uni.hideLoading()
            console.error('上传选项图片失败:', error)
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        }
      })
    },

    saveQuestion() {
      if (!this.editingQuestion.content.trim()) {
        uni.showToast({ title: '请输入问题内容', icon: 'none' })
        return
      }

      // 验证选项（单选和多选）
      if ((this.editingQuestion.type === 2 || this.editingQuestion.type === 3)) {
        if (this.editingQuestion.options.length === 0) {
          uni.showToast({ title: '请至少添加一个选项', icon: 'none' })
          return
        }
        
        for (let option of this.editingQuestion.options) {
          if (!option.content.trim()) {
            uni.showToast({ title: '请填写所有选项内容', icon: 'none' })
            return
          }
        }
      }

      // 生成临时ID
      if (!this.editingQuestion.tempId) {
        this.editingQuestion.tempId = Date.now() + Math.random()
      }

      if (this.editingQuestionIndex >= 0) {
        // 编辑现有问题
        this.surveyData.questions[this.editingQuestionIndex] = this.editingQuestion
      } else {
        // 添加新问题
        this.surveyData.questions.push(this.editingQuestion)
      }

      this.hideEditDialog()
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

    // 验证算式表达式
    validateExpression(expression) {
      try {
        let warning = ''
        
        // 1. 基本语法检查
        if (!this.isValidExpressionSyntax(expression)) {
          return { isValid: false, error: '算式语法错误，请检查括号、运算符等字符', warning: '' }
        }

        // 2. 检查直接除零
        if (this.hasDirectDivisionByZero(expression)) {
          return { isValid: false, error: '算式包含直接除零操作', warning: '' }
        }

        // 3. 检查括号内可能为零的除法（改为警告）
        const zeroDivisionResult = this.checkParenthesesZeroDivision(expression)
        if (!zeroDivisionResult.isValid) {
          warning = '⚠️ ' + zeroDivisionResult.error + '，建议检查算式和选项的值以避免运行时错误'
        }

        return { isValid: true, error: '', warning: warning }
      } catch (error) {
        return { isValid: false, error: '算式验证失败：' + error.message, warning: '' }
      }
    },

    // 检查基本语法
    isValidExpressionSyntax(expression) {
      // 移除空格
      const expr = expression.replace(/\s/g, '')
      
      // 检查是否为空
      if (!expr) return false
      
      // 检查是否只包含允许的字符：Q1-Q9, 数字, +, -, *, /, (, ), .
      const validPattern = /^[Q1-9\d+\-*/().]+$/
      if (!validPattern.test(expr)) return false
      
      // 检查括号匹配
      let bracketCount = 0
      for (let char of expr) {
        if (char === '(') bracketCount++
        if (char === ')') bracketCount--
        if (bracketCount < 0) return false
      }
      if (bracketCount !== 0) return false
      
      // 检查运算符位置
      const operatorPattern = /[+\-*/]/
      if (operatorPattern.test(expr[0]) || operatorPattern.test(expr[expr.length - 1])) {
        return false
      }
      
      // 检查连续运算符
      if (/[+\-*/]{2,}/.test(expr)) return false
      
      // 检查括号内是否为空
      if (/\(\)/.test(expr)) return false
      
      // 检查Qi变量的格式（Q1-Q9）
      const qiMatches = expr.match(/Q\d+/g)
      if (qiMatches) {
        for (let qi of qiMatches) {
          const num = parseInt(qi.slice(1))
          if (num < 1 || num > 9) return false
        }
      }
      
      // 检查数字格式（不能有多个小数点）
      if (/\d+\.\d+\./.test(expr)) return false
      
      // 检查运算符后不能直接跟运算符（除了负号）
      if (/[+\-*/][+\-*/]/.test(expr)) return false
      
      return true
    },

    // 检查直接除零
    hasDirectDivisionByZero(expression) {
      const expr = expression.replace(/\s/g, '')
      
      // 检查 /0 模式
      if (/\/0(?!\d)/.test(expr)) return true
      
      // 检查 /(0) 模式
      if (/\/\(0\)/.test(expr)) return true
      
      return false
    },

    // 检查括号内可能为零的除法
    checkParenthesesZeroDivision(expression) {
      const expr = expression.replace(/\s/g, '')
      
      // 找到所有除法操作，包括 /(expression) 和 /expression 形式
      const divisionPatterns = [
        /\/\([^)]+\)/g,  // /(expression)
        /\/Q\d+/g,       // /Q1, /Q2, etc.
        /\/\d+/g         // /123, /456, etc.
      ]
      
      for (let pattern of divisionPatterns) {
        const matches = expr.match(pattern)
        if (matches) {
          for (let match of matches) {
            let innerExpr = ''
            if (match.startsWith('/(')) {
              innerExpr = match.slice(2, -1) // 去掉 /( 和 )
            } else if (match.startsWith('/Q')) {
              innerExpr = match.slice(1) // 去掉 /
            } else if (match.startsWith('/')) {
              innerExpr = match.slice(1) // 去掉 /
            }
            
            if (innerExpr) {
              // 检查表达式是否可能为零
              const zeroResult = this.checkExpressionCanBeZero(innerExpr)
              if (zeroResult) {
                return { 
                  isValid: false, 
                  error: `除法运算中的表达式 "${innerExpr}" 可能为零，这会导致除零错误` 
                }
              }
            }
          }
        }
      }
      
      return { isValid: true, error: '' }
    },

    // 检查表达式是否可能为零
    checkExpressionCanBeZero(expression) {
      // 检查是否包含Qi变量
      const qiMatches = expression.match(/Q\d+/g)
      if (qiMatches) {
        // 包含Qi变量，需要检查所有可能的值组合
        return this.checkQiExpressionCanBeZero(expression, qiMatches)
      } else {
        // 不包含Qi变量，直接计算
        try {
          const result = this.evaluateSimpleExpression(expression)
          return Math.abs(result) < 1e-10 // 考虑浮点数精度
        } catch (error) {
          // 如果计算失败，认为可能为零
          return true
        }
      }
    },

    // 检查包含Qi变量的表达式是否可能为零
    checkQiExpressionCanBeZero(expression, qiVariables) {
      // 获取所有Qi变量对应的可能值
      const possibleValues = {}
      
      for (let qi of qiVariables) {
        const questionIndex = parseInt(qi.slice(1)) - 1 // Q1 -> index 0
        if (questionIndex >= 0 && questionIndex < this.surveyData.questions.length) {
          const question = this.surveyData.questions[questionIndex]
          possibleValues[qi] = this.getQuestionPossibleValues(question)
        } else {
          return true // 如果问题不存在，认为可能为零
        }
      }
      
      // 生成所有可能的值组合
      const combinations = this.generateValueCombinations(possibleValues)
      
      // 检查每个组合是否可能为零
      for (let combination of combinations) {
        try {
          const result = this.evaluateExpressionWithValues(expression, combination)
          if (Math.abs(result) < 1e-10) { // 考虑浮点数精度
            return true
          }
        } catch (error) {
          // 如果计算失败，认为可能为零
          return true
        }
      }
      
      return false
    },

    // 获取问题的所有可能值
    getQuestionPossibleValues(question) {
      switch (question.type) {
        case 0: // 符合度打分
          return [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]
        case 1: // 是否题
          return [0, 1]
        case 2: // 单选题
          return question.options.map(opt => opt.value)
        case 3: // 多选题
          // 多选题的值是所有选项值的组合，这里简化处理
          const values = [0] // 至少包含0（未选择任何选项）
          for (let option of question.options) {
            values.push(option.value)
          }
          return values
        case 4: // 文字输入
          return [0] // 文字输入在计算中通常为0
        default:
          return [0]
      }
    },

    // 生成所有可能的值组合
    generateValueCombinations(possibleValues) {
      const variables = Object.keys(possibleValues)
      const combinations = []
      
      function generate(index, currentCombination) {
        if (index === variables.length) {
          combinations.push({ ...currentCombination })
          return
        }
        
        const variable = variables[index]
        const values = possibleValues[variable]
        
        for (let value of values) {
          currentCombination[variable] = value
          generate(index + 1, currentCombination)
        }
      }
      
      generate(0, {})
      return combinations
    },

    // 用具体值计算表达式
    evaluateExpressionWithValues(expression, values) {
      let expr = expression
      
      // 替换所有Qi变量为具体值
      for (let variable in values) {
        const regex = new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        expr = expr.replace(regex, values[variable].toString())
      }
      
      return this.evaluateSimpleExpression(expr)
    },

    // 计算简单表达式（不包含Qi变量）
    evaluateSimpleExpression(expression) {
      // 简单的表达式计算器，支持 +, -, *, /, (, )
      // 这里使用安全的计算方法
      try {
        // 验证表达式只包含数字和运算符
        if (!/^[\d+\-*/().\s]+$/.test(expression)) {
          throw new Error('表达式包含非法字符')
        }
        
        // 使用Function构造器进行计算（相对安全）
        const func = new Function('return ' + expression)
        const result = func()
        
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error('计算结果不是有效数字')
        }
        
        return result
      } catch (error) {
        throw new Error('表达式计算失败: ' + error.message)
      }
    },

    // 结果管理方法
    showResultDialog() {
      this.editingResult = {
        name: '',
        expression: ''
      }
      this.editingResultIndex = -1
      this.validationResult = {
        show: false,
        isValid: false,
        error: '',
        warning: ''
      }
      this.isExpressionTested = false
      this.showResultEditDialog = true
    },

    hideResultDialog() {
      this.showResultEditDialog = false
      this.editingResultIndex = -1
      this.validationResult = {
        show: false,
        isValid: false,
        error: '',
        warning: ''
      }
      this.isExpressionTested = false
    },

    editResult(index) {
      this.editingResult = JSON.parse(JSON.stringify(this.surveyData.results[index]))
      this.editingResultIndex = index
      this.validationResult = {
        show: false,
        isValid: false,
        error: '',
        warning: ''
      }
      this.isExpressionTested = false
      this.showResultEditDialog = true
    },

    deleteResult(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个结果吗？',
        success: (res) => {
          if (res.confirm) {
            this.surveyData.results.splice(index, 1)
          }
        }
      })
    },

    saveResult() {
      if (!this.editingResult.name.trim()) {
        uni.showToast({ title: '请输入结果名称', icon: 'none' })
        return
      }

      if (!this.editingResult.expression.trim()) {
        uni.showToast({ title: '请输入计算表达式', icon: 'none' })
        return
      }

      // 检查是否已经测试过且测试通过
      if (!this.isExpressionTested || !this.validationResult.isValid) {
        uni.showToast({ title: '请先测试算式并确保通过', icon: 'none' })
        return
      }

      this.doSaveResult()
    },

    // 执行保存结果的操作
    doSaveResult() {
      // 生成临时ID
      if (!this.editingResult.tempId) {
        this.editingResult.tempId = Date.now() + Math.random()
      }

      if (this.editingResultIndex >= 0) {
        // 编辑现有结果
        this.surveyData.results[this.editingResultIndex] = this.editingResult
      } else {
        // 添加新结果
        this.surveyData.results.push(this.editingResult)
      }

      this.hideResultDialog()
    },

    // 测试算式表达式
    testExpression() {
      if (!this.editingResult.expression.trim()) {
        this.validationResult = {
          show: true,
          isValid: false,
          error: '请输入算式表达式',
          warning: ''
        }
        this.isExpressionTested = false
        return
      }

      const result = this.validateExpression(this.editingResult.expression)
      this.validationResult = {
        show: true,
        isValid: result.isValid,
        error: result.error,
        warning: result.warning
      }
      
      // 设置测试状态
      this.isExpressionTested = true
    },

    // 表达式输入时的实时验证
    onExpressionInput() {
      // 清除之前的验证结果
      this.validationResult.show = false
      this.isExpressionTested = false
    },

    // 获取保存按钮文本
    getSaveButtonText() {
      if (!this.editingResult.expression.trim()) {
        return '测试'
      }
      return this.isExpressionTested && this.validationResult.isValid ? '保存' : '测试'
    },

    // 处理保存或测试按钮点击
    handleSaveOrTest() {
      if (!this.editingResult.expression.trim()) {
        uni.showToast({ title: '请输入计算表达式', icon: 'none' })
        return
      }

      // 如果还没测试或测试失败，执行测试
      if (!this.isExpressionTested || !this.validationResult.isValid) {
        this.testExpression()
        return
      }

      // 如果已测试且通过，执行保存
      this.saveResult()
    },

    async saveSurvey() {
      // 验证基本信息
      if (!this.surveyData.name.trim()) {
        uni.showToast({ title: '请输入测评名称', icon: 'none' })
        return
      }

      if (this.surveyData.questions.length === 0) {
        uni.showToast({ title: '请至少添加一个问题', icon: 'none' })
        return
      }

      if (this.surveyData.results.length === 0) {
        uni.showToast({ title: '请至少添加一个结果计算公式', icon: 'none' })
        return
      }

      try {
        uni.showLoading({ title: '保存中...' })
        
        const result = await Database.createSurvey(this.surveyData)
        
        uni.hideLoading()
        
        if (result.success) {
          uni.showToast({ title: '测评创建成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          uni.showToast({ title: result.message || '保存失败', icon: 'none' })
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('保存测评失败:', error)
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.survey-create-container {
    width: 100%;
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

.save-btn {
  font-size: 28rpx;
  color: #55B99E;
}

.content {
  height: calc(100vh - 100rpx);
  padding: 32rpx;
}

.section {
  width: 85%;
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
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.add-question-btn {
  width: 60rpx;
  height: 60rpx;
  background: #55B99E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 28rpx;
  color: white;
  font-weight: bold;
}

.form-group {
  margin-bottom: 32rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 16rpx;
}

 .textarea {
  width: 90%;
  padding: 24rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #2c3e50;
  box-sizing: border-box;
}

.textarea {
  height: 120rpx;
  resize: none;
}

.cover-upload, .image-upload {
  width: 200rpx;
  height: 150rpx;
  border: 2rpx dashed #e0e0e0;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-upload { position: relative; overflow: hidden; }
.cover-change { position:absolute; bottom:0; left:0; right:0; padding:6rpx; text-align:center; background:rgba(0,0,0,.5); color:white; font-size:22rpx; }

.cover-image, .question-image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.cover-placeholder, .image-placeholder {
  text-align: center;
}

.upload-text {
  font-size: 24rpx;
  color: #7f8c8d;
}

.formula-help {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
  margin-top: 8rpx;
}

.test-expression-btn {
  margin-top: 16rpx;
  padding: 16rpx 24rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  display: inline-block;
}

.test-btn-text {
  font-size: 24rpx;
  color: #55B99E;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.question-item {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 24rpx;
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

.question-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  font-size: 24rpx;
  color: #55B99E;
  padding: 8rpx 16rpx;
  border: 1rpx solid #55B99E;
  border-radius: 8rpx;
}

.action-btn.delete {
  color: #e74c3c;
  border-color: #e74c3c;
}

.question-content {
  margin-bottom: 16rpx;
}

.question-text {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  margin-bottom: 8rpx;
}

.question-type {
  font-size: 24rpx;
  color: #7f8c8d;
  background: #f0f0f0;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.options-list {
  margin-top: 16rpx;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx;
  background: #f8f9fa;
  border-radius: 8rpx;
  margin-bottom: 8rpx;
}

.option-order {
  font-size: 24rpx;
  color: #55B99E;
  font-weight: bold;
  min-width: 40rpx;
}

.option-content {
  flex: 1;
  font-size: 26rpx;
  color: #2c3e50;
}

.option-value {
  font-size: 24rpx;
  color: #7f8c8d;
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
  overflow-y: scroll;
}

.dialog {
  background: white;
  border-radius: 16rpx;
  width: 80%;
  max-height: 80%;
  overflow: scroll;
}

.dialog.large {
  width: 90%;
  max-height: 90%;
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
}

.question-types {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.type-item {
  padding: 24rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
}

.type-name {
  display: block;
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.type-desc {
  font-size: 24rpx;
  color: #7f8c8d;
}

.options-section {
    width: 90%;
  margin-top: 32rpx;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.add-option-btn {
  width: 50rpx;
  height: 50rpx;
  background: #55B99E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-edit-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.option-order-input, .option-content-input, .option-value-input {
  padding: 16rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.option-order-input {
  width: 50rpx;
}

.option-content-input {
  flex: 1;
}

.option-value-input {
  width: 50rpx;
}

.option-image-upload {
  width: 60rpx;
  height: 60rpx;
  border: 2rpx dashed #e0e0e0;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.option-image {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

.option-image-placeholder {
  text-align: center;
}

.option-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.option-preview-image {
  width: 60rpx;
  height: 60rpx;
  border-radius: 8rpx;
  background: #eee;
}

.delete-option-btn {
  font-size: 32rpx;
  color: #e74c3c;
  width: 50rpx;
  height: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-actions {
    width: 90%;
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
}

.btn.cancel {
  background: #f0f0f0;
  color: #7f8c8d;
}

.btn.confirm {
  background: #55B99E;
  color: white;
}

/* 结果管理样式 */
.add-result-btn {
  width: 60rpx;
  height: 60rpx;
  background: #55B99E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.result-number {
  font-size: 28rpx;
  color: #55B99E;
  font-weight: bold;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.result-name {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
}

.result-expression {
  font-size: 24rpx;
  color: #7f8c8d;
  background: #f0f0f0;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  font-family: monospace;
}

.input {
  width: 90%;
  padding: 24rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #2c3e50;
  box-sizing: border-box;
}

/* 验证结果样式 */
.validation-result {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 8rpx;
  background: #f8f9fa;
  border: 1rpx solid #e0e0e0;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.validation-status.success {
  color: #27ae60;
}

.validation-status.error {
  color: #e74c3c;
}

.status-icon {
  font-size: 24rpx;
  font-weight: bold;
}

.status-text {
  font-size: 26rpx;
  font-weight: bold;
}

.error-message {
  display: block;
  font-size: 24rpx;
  color: #e74c3c;
  line-height: 1.4;
  margin-top: 8rpx;
  padding: 8rpx 12rpx;
  background: #fdf2f2;
  border-radius: 6rpx;
  border-left: 3rpx solid #e74c3c;
}

.warning-message {
  display: block;
  font-size: 24rpx;
  color: #f39c12;
  line-height: 1.4;
  margin-top: 8rpx;
  padding: 8rpx 12rpx;
  background: #fef9e7;
  border-radius: 6rpx;
  border-left: 3rpx solid #f39c12;
}
</style>
