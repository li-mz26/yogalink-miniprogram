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
    // 老师订单统计
    stats: {
      purchased: 0,   // 已购买
      scheduled: 0,   // 已约课
      reviews: 0      // 课程评价
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
    this.loadTeacherStats()
  },

  // 加载老师订单统计
  async loadTeacherStats() {
    try {
      // 获取老师收到的预约请求
      const res = await api.teacher.getBookingRequests()
      const requests = res.list || []

      // 统计各状态数量
      const accepted = requests.filter(r => r.status === 'accepted').length  // 已约课
      const pending = requests.filter(r => r.status === 'pending').length     // 待确认

      this.setData({
        'stats.purchased': accepted + pending,  // 已购买约课
        'stats.scheduled': accepted,           // 已约课
        'stats.reviews': 0                    // 评价数量（待开发）
      })
    } catch (error) {
      console.error('加载统计失败:', error)
    }
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
    wx.navigateTo({ url: '/pages/teacher-calendar/teacher-calendar' })
  },

  goToLocations() {
    wx.navigateTo({ url: '/pages/teacher/locations/locations' })
  },

  goToBookingRequests() {
    wx.navigateTo({ url: '/pages/teacher/requests/requests' })
  },

  // 跳转已购买
  goToPurchased() {
    wx.showToast({ title: '已购买课程', icon: 'none' })
  },

  // 跳转已约课
  goToScheduled() {
    wx.navigateTo({ url: '/pages/teacher/requests/requests' })
  },

  // 跳转课程评价
  goToReviews() {
    wx.showToast({ title: '课程评价功能开发中', icon: 'none' })
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
    // 先尝试获取当前位置
    wx.showModal({
      title: '获取位置',
      content: '是否允许获取您的当前位置？',
      confirmText: '允许',
      cancelText: '手动选择',
      success: (res) => {
        if (res.confirm) {
          // 用户同意获取位置
          this.getCurrentLocation()
        } else {
          // 用户选择手动选择
          this.openLocationPicker()
        }
      }
    })
  },

  // 获取当前位置
  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        console.log('获取位置成功:', res)
        // 逆地址解析需要腾讯地图API，这里先显示坐标位置
        this.setData({
          searchLocation: '当前位置',
          searchLat: res.latitude,
          searchLng: res.longitude
        })
        this.searchTeachers()
        wx.showToast({
          title: '定位成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.log('获取位置失败:', err)
        let errMsg = '无法获取您的位置'
        if (err.errMsg) {
          if (err.errMsg.includes('auth deny')) {
            errMsg = '您拒绝了位置权限授权'
          } else if (err.errMsg.includes('permission')) {
            errMsg = '需要您的位置权限'
          }
        }
        // 获取位置失败，提示用户手动选择
        wx.showModal({
          title: '定位失败',
          content: errMsg + '，请手动选择上课地点',
          confirmText: '手动选择',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.openLocationPicker()
            }
          }
        })
      }
    })
  },

  // 手动选择位置
  openLocationPicker() {
    wx.chooseLocation({
      success: (res) => {
        console.log('选择的位置:', res)
        if (res.name && res.latitude) {
          this.setData({
            searchLocation: res.name,
            searchLat: res.latitude,
            searchLng: res.longitude
          })
          this.searchTeachers()
        } else {
          wx.showToast({
            title: '请选择有效的位置',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.log('选择位置失败:', err)
        // 用户取消选择
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
    wx.navigateTo({ url: `/pages/teacher-detail/teacher-detail?id=${id}` })
  },

  goToCategory(e) {
    const { category } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/teacher-category/teacher-category?category=${category}`
    })
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
