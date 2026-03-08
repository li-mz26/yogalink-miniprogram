// app.js
const { API_BASE_URL } = require('./utils/config')

App({
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: API_BASE_URL
  },

  onLaunch() {
    // 检查本地存储的登录态
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
    
    console.log('YogaLink MiniProgram Launched')
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  // 设置token
  setToken(token) {
    this.globalData.token = token
    wx.setStorageSync('token', token)
  },

  // 清除登录态
  clearAuth() {
    this.globalData.token = null
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
  }
})
