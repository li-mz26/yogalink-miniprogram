// pages/face-verification/face-verification.js
const { api } = require('../../utils/api')

Page({
  data: {
    bookingId: null,
    userRole: '',
    bookingInfo: null,
    capturedImage: '',
    verified: false,
    verifying: false
  },

  onLoad(options) {
    const { bookingId } = options
    if (!bookingId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      wx.navigateBack()
      return
    }

    const app = getApp()
    const userInfo = app.getUserInfo()

    this.setData({
      bookingId,
      userRole: userInfo.role
    })

    this.loadBookingInfo()
    this.checkVerificationStatus()
  },

  async loadBookingInfo() {
    // 加载预约详情
    // 这里需要调用API获取预约详情
    // 简化处理，模拟数据
    this.setData({
      bookingInfo: {
        partnerName: '张老师',
        date: '2026-03-10',
        startTime: '14:00',
        location: '国贸地铁站附近'
      }
    })
  },

  async checkVerificationStatus() {
    try {
      const res = await api.auth.checkFaceVerificationStatus(this.data.bookingId)
      if (res.is_verified) {
        this.setData({ verified: true })
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
    }
  },

  captureFace() {
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          capturedImage: res.tempImagePath
        })
      },
      fail: () => {
        wx.showToast({ title: '拍摄失败', icon: 'none' })
      }
    })
  },

  retake() {
    this.setData({ capturedImage: '' })
  },

  async verifyFace() {
    if (!this.data.capturedImage || this.data.verifying) return

    this.setData({ verifying: true })
    wx.showLoading({ title: '验证中...' })

    try {
      // 先上传人脸照片
      const faceImageUrl = await this.uploadFaceImage(this.data.capturedImage)

      // 调用人脸识别API
      const res = await api.auth.faceVerification(this.data.bookingId, faceImageUrl)

      wx.hideLoading()

      if (res.is_matched) {
        this.setData({ verified: true })
        wx.showToast({ title: '验证通过', icon: 'success' })
      } else {
        wx.showModal({
          title: '验证失败',
          content: res.message || '人脸识别未通过，请重试',
          showCancel: false
        })
        this.setData({ capturedImage: '' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('验证失败:', error)
      wx.showToast({ title: '验证失败', icon: 'none' })
    } finally {
      this.setData({ verifying: false })
    }
  },

  uploadFaceImage(filePath) {
    return new Promise((resolve, reject) => {
      // 实际应该上传到云存储
      // 这里模拟返回URL
      setTimeout(() => {
        resolve(filePath)
      }, 500)
    })
  },

  complete() {
    wx.navigateBack()
  }
})
