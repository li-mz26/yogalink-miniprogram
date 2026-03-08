// pages/login/login.js
const { api } = require('../../utils/api')
const { isValidPhone, isValidPassword } = require('../../utils/util')

Page({
  data: {
    role: 'student', // 默认学员
    phone: '',
    password: '',
    showPassword: false,
    loading: false,
    canSubmit: false
  },

  // 选择角色
  selectRole(e) {
    const { role } = e.currentTarget.dataset
    this.setData({ role })
  },

  onPhoneInput(e) {
    const phone = e.detail.value
    this.setData({ phone })
    this.checkCanSubmit()
  },

  onPasswordInput(e) {
    const password = e.detail.value
    this.setData({ password })
    this.checkCanSubmit()
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  checkCanSubmit() {
    const { phone, password } = this.data
    const canSubmit = isValidPhone(phone) && isValidPassword(password)
    this.setData({ canSubmit })
  },

  async login() {
    if (!this.data.canSubmit || this.data.loading) return

    this.setData({ loading: true })

    try {
      const res = await api.auth.login({
        phone: this.data.phone,
        password: this.data.password
      })

      const app = getApp()
      app.setToken(res.token)
      app.setUserInfo(res.user)

      wx.showToast({ title: '登录成功', icon: 'success' })

      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (error) {
      console.error('登录失败:', error)
      this.setData({ loading: false })
    }
  },

  async register() {
    if (!this.data.canSubmit || this.data.loading) return

    wx.showModal({
      title: '注册账号',
      content: `确定要注册为${this.data.role === 'teacher' ? '瑜伽老师' : '学员'}吗？`,
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true })

          try {
            const result = await api.auth.register({
              phone: this.data.phone,
              password: this.data.password,
              nickname: `${this.data.role === 'teacher' ? '老师' : '学员'}${this.data.phone.slice(-4)}`,
              role: this.data.role
            })

            const app = getApp()
            app.setToken(result.token)
            app.setUserInfo(result.user)

            wx.showToast({ title: '注册成功', icon: 'success' })

            setTimeout(() => {
              wx.switchTab({ url: '/pages/index/index' })
            }, 1500)
          } catch (error) {
            console.error('注册失败:', error)
            this.setData({ loading: false })
          }
        }
      }
    })
  }
})
