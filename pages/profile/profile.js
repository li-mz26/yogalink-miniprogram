// pages/profile/profile.js
const { api } = require('../../utils/api')

Page({
  data: {
    isLogin: false,
    userInfo: null,
    stats: {
      total: 0,
      completed: 0,
      upcoming: 0
    },
    verificationStatus: 'unverified',
    verifyStatusText: {
      unverified: '未认证 - 点击进行认证',
      pending: '审核中 - 请耐心等待',
      verified: '已认证',
      rejected: '认证失败 - 点击重新认证'
    }
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
    if (this.data.isLogin) {
      this.loadUserInfo()
      this.loadStats()
      this.loadVerificationStatus()
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    const isLogin = !!app.globalData.token
    const userInfo = app.getUserInfo()
    
    this.setData({
      isLogin,
      userInfo
    })
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const res = await api.auth.getProfile()
      const app = getApp()
      app.setUserInfo(res)
      this.setData({ userInfo: res })
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      const res = await api.bookings.getList({
        page: 1,
        page_size: 100
      })
      
      const bookings = res.list || []
      const upcoming = bookings.filter(b => b.status === 2).length
      const completed = bookings.filter(b => b.status === 3 || b.status === 4).length
      
      this.setData({
        'stats.upcoming': upcoming,
        'stats.completed': completed,
        'stats.total': bookings.length
      })
    } catch (error) {
      console.error('加载统计失败:', error)
    }
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 跳转到预约列表
  goToBookings() {
    wx.switchTab({
      url: '/pages/bookings/bookings'
    })
  },

  // 跳转到课程列表
  goToCourses() {
    wx.switchTab({
      url: '/pages/courses/courses'
    })
  },

  // 加载实名认证状态
  async loadVerificationStatus() {
    try {
      const res = await api.auth.getVerificationStatus()
      this.setData({
        verificationStatus: res.status || 'unverified'
      })
    } catch (error) {
      console.error('加载认证状态失败:', error)
    }
  },

  // 跳转到实名认证
  goToVerification() {
    wx.navigateTo({
      url: '/pages/verification/verification'
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.clearAuth()
          
          this.setData({
            isLogin: false,
            userInfo: null,
            stats: { total: 0, completed: 0, upcoming: 0 },
            verificationStatus: 'unverified'
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  }
})
