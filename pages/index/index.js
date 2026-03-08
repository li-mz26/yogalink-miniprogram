// pages/index/index.js
const { api } = require('../../utils/api')
const { formatDate } = require('../../utils/util')

Page({
  data: {
    greeting: '',
    userInfo: null,
    isLogin: false,
    
    // 老师端数据
    bookingRequests: [],
    locations: [],
    statusText: {
      pending: '待确认',
      accepted: '已接受',
      rejected: '已拒绝',
      cancelled: '已取消',
      completed: '已完成'
    },
    
    // 学生端数据
    searchLocation: '',
    searchLat: null,
    searchLng: null,
    radiusIndex: 2,
    radiusOptions: ['1公里', '3公里', '5公里', '10公里', '20公里'],
    radiusValues: [1, 3, 5, 10, 20],
    teachers: [],
    myBookings: [],
    bookingStatusMap: {
      pending: { text: '待确认', color: '#faad14' },
      accepted: { text: '已接受', color: '#52c41a' },
      rejected: { text: '已拒绝', color: '#999' },
      cancelled: { text: '已取消', color: '#999' },
      completed: { text: '已完成', color: '#7B68EE' }
    }
  },

  onLoad() {
    this.setGreeting()
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
    if (this.data.isLogin) {
      if (this.data.userInfo.role === 'teacher') {
        this.loadTeacherData()
      } else {
        this.loadStudentData()
      }
    }
  },

  setGreeting() {
    const hour = new Date().getHours()
    let greeting = ''
    if (hour < 6) greeting = '夜深了'
    else if (hour < 9) greeting = '早上好'
    else if (hour < 12) greeting = '上午好'
    else if (hour < 14) greeting = '中午好'
    else if (hour < 18) greeting = '下午好'
    else greeting = '晚上好'
    this.setData({ greeting })
  },

  checkLoginStatus() {
    const app = getApp()
    const userInfo = app.getUserInfo()
    const token = app.globalData.token
    this.setData({
      isLogin: !!token,
      userInfo: userInfo || {}
    })
  },

  // ===== 老师端方法 =====
  async loadTeacherData() {
    this.loadBookingRequests()
    this.loadLocations()
  },

  async loadBookingRequests() {
    try {
      const res = await api.teacher.getBookingRequests('pending')
      this.setData({ bookingRequests: res.list || [] })
    } catch (error) {
      console.error('加载预约请求失败:', error)
    }
  },

  async loadLocations() {
    try {
      const res = await api.teacher.getLocations()
      this.setData({ locations: res.list || [] })
    } catch (error) {
      console.error('加载授课地点失败:', error)
    }
  },

  async acceptRequest(e) {
    const { id } = e.currentTarget.dataset
    try {
      await api.teacher.acceptRequest(id, {})
      wx.showToast({ title: '已接受', icon: 'success' })
      this.loadBookingRequests()
    } catch (error) {
      console.error('接受失败:', error)
    }
  },

  async rejectRequest(e) {
    const { id } = e.currentTarget.dataset
    try {
      await api.teacher.rejectRequest(id, {})
      wx.showToast({ title: '已拒绝', icon: 'success' })
      this.loadBookingRequests()
    } catch (error) {
      console.error('拒绝失败:', error)
    }
  },

  goToAvailability() {
    wx.navigateTo({ url: '/pages/teacher/availability/availability' })
  },

  goToLocations() {
    wx.navigateTo({ url: '/pages/teacher/locations/locations' })
  },

  goToBookingRequests() {
    wx.navigateTo({ url: '/pages/teacher/requests/requests' })
  },

  goToProfile() {
    wx.navigateTo({ url: '/pages/teacher/profile/profile' })
  },

  // ===== 学生端方法 =====
  async loadStudentData() {
    this.loadMyBookings()
  },

  async loadMyBookings() {
    try {
      const res = await api.student.getMyBookingRequests()
      this.setData({ myBookings: res.list || [] })
    } catch (error) {
      console.error('加载预约失败:', error)
    }
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          searchLocation: res.name,
          searchLat: res.latitude,
          searchLng: res.longitude
        })
        this.searchTeachers()
      }
    })
  },

  onRadiusChange(e) {
    this.setData({ radiusIndex: e.detail.value })
  },

  async searchTeachers() {
    if (!this.data.searchLat || !this.data.searchLng) {
      wx.showToast({ title: '请先选择地点', icon: 'none' })
      return
    }

    wx.showLoading({ title: '搜索中...' })

    try {
      const res = await api.student.findNearbyTeachers({
        lat: this.data.searchLat,
        lng: this.data.searchLng,
        radius: this.data.radiusValues[this.data.radiusIndex]
      })
      
      // 处理距离显示格式
      const teachers = (res.list || []).map(item => {
        const distance = item.distance || 0
        let distance_text
        if (distance < 1) {
          distance_text = Math.round(distance * 1000) + 'm'
        } else {
          distance_text = distance.toFixed(1) + 'km'
        }
        return { ...item, distance_text }
      })
      
      this.setData({ teachers })
      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      console.error('搜索失败:', error)
    }
  },

  goToTeacherDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/student/teacher-detail/teacher-detail?id=${id}` })
  },

  goToBookings() {
    wx.switchTab({ url: '/pages/bookings/bookings' })
  },

  quickSearch() {
    this.chooseLocation()
  },

  // ===== 公共方法 =====
  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  onPullDownRefresh() {
    if (this.data.isLogin) {
      if (this.data.userInfo.role === 'teacher') {
        this.loadTeacherData()
      } else {
        this.loadStudentData()
      }
    }
    wx.stopPullDownRefresh()
  }
})
