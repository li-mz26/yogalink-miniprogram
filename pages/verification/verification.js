// pages/verification/verification.js
const { api } = require('../../utils/api')

Page({
  data: {
    verificationStatus: 'unverified',
    realName: '',
    idCardNumber: '',
    idCardFront: '',
    idCardBack: '',
    rejectReason: '',
    verifiedAt: '',
    submitting: false,
    canSubmit: false,
    statusText: {
      unverified: '未认证',
      pending: '审核中',
      verified: '已认证',
      rejected: '认证失败'
    }
  },

  onLoad() {
    this.loadVerificationStatus()
  },

  onShow() {
    this.loadVerificationStatus()
  },

  async loadVerificationStatus() {
    try {
      const res = await api.auth.getVerificationStatus()
      this.setData({
        verificationStatus: res.status,
        realName: res.real_name || '',
        rejectReason: res.reject_reason || '',
        verifiedAt: res.verified_at ? this.formatDate(res.verified_at) : ''
      })
    } catch (error) {
      console.error('获取认证状态失败:', error)
    }
  },

  onRealNameInput(e) {
    this.setData({ realName: e.detail.value })
    this.checkCanSubmit()
  },

  onIdCardInput(e) {
    this.setData({ idCardNumber: e.detail.value })
    this.checkCanSubmit()
  },

  checkCanSubmit() {
    const { realName, idCardNumber, idCardFront, idCardBack } = this.data
    const canSubmit = realName && idCardNumber.length === 18 && idCardFront && idCardBack
    this.setData({ canSubmit })
  },

  uploadFrontImage() {
    this.chooseImage('front')
  },

  uploadBackImage() {
    this.chooseImage('back')
  },

  chooseImage(type) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        // 上传到服务器
        this.uploadToServer(tempFilePath, type)
      }
    })
  },

  uploadToServer(filePath, type) {
    wx.showLoading({ title: '上传中...' })
    
    // 实际应该上传到云存储服务
    // 这里模拟上传成功
    setTimeout(() => {
      wx.hideLoading()
      if (type === 'front') {
        this.setData({ idCardFront: filePath })
      } else {
        this.setData({ idCardBack: filePath })
      }
      this.checkCanSubmit()
    }, 1000)
  },

  async submitVerification() {
    if (!this.data.canSubmit || this.data.submitting) return

    // 验证身份证号格式
    if (!this.validateIdCard(this.data.idCardNumber)) {
      wx.showToast({ title: '身份证号格式不正确', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      await api.auth.submitVerification({
        real_name: this.data.realName,
        id_card_number: this.data.idCardNumber,
        id_card_front: this.data.idCardFront,
        id_card_back: this.data.idCardBack
      })

      wx.showToast({ title: '提交成功', icon: 'success' })
      this.setData({ verificationStatus: 'pending' })
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      this.setData({ submitting: false })
    }
  },

  validateIdCard(idCard) {
    // 简单的身份证号验证
    const reg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    return reg.test(idCard)
  },

  formatDate(dateStr) {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
})
