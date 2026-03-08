// pages/login/login.js
const { api } = require('../../utils/api')
const { isValidPhone, isValidPassword } = require('../../utils/util')

Page({
  data: {
    phone: '',
    password: '',
    showPassword: false,
    loading: false,
    canSubmit: false
  },

  // 手机号输入
  onPhoneInput(e) {
    const phone = e.detail.value
    this.setData({ phone })
    this.checkCanSubmit()
  },

  // 密码输入
  onPasswordInput(e) {
    const password = e.detail.value
    this.setData({ password })
    this.checkCanSubmit()
  },

  // 切换密码显示
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { phone, password } = this.data
    const canSubmit = isValidPhone(phone) && isValidPassword(password)
    this.setData({ canSubmit })
  },

  // 登录
  async login() {
    if (!this.data.canSubmit || this.data.loading) return

    this.setData({ loading: true })

    try {
      const res = await api.auth.login({
        phone: this.data.phone,
        password: this.data.password
      })

      // 保存登录态
      const app = getApp()
      app.setToken(res.token)
      app.setUserInfo(res.user)

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 返回上一页或跳转到首页
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          wx.navigateBack()
        } else {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      }, 1500)
    } catch (error) {
      console.error('登录失败:', error)
      this.setData({ loading: false })
    }
  },

  // 注册
  async register() {
    if (!this.data.canSubmit || this.data.loading) return

    wx.showModal({
      title: '注册账号',
      content: '确定要使用当前手机号和密码注册新账号吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ loading: true })

          try {
            const result = await api.auth.register({
              phone: this.data.phone,
              password: this.data.password,
              nickname: `用户${this.data.phone.slice(-4)}`
            })

            // 保存登录态
            const app = getApp()
            app.setToken(result.token)
            app.setUserInfo(result.user)

            wx.showToast({
              title: '注册成功',
              icon: 'success'
            })

            // 跳转到首页
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index'
              })
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
