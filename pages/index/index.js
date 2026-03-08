// pages/index/index.js
import { api } from '../../utils/api'
import { formatDate, getWeekDay } from '../../utils/util'

Page({
  data: {
    greeting: '',
    userInfo: null,
    isLogin: false,
    today: '',
    todayCourses: [],
    studios: [],
    stats: {
      upcoming: 0,
      completed: 0,
      total: 0
    },
    loading: false
  },

  onLoad() {
    this.setGreeting()
    this.setToday()
    this.checkLoginStatus()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.checkLoginStatus()
    this.loadTodayCourses()
    this.loadStudios()
    if (this.data.isLogin) {
      this.loadStats()
    }
  },

  // 设置问候语
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

  // 设置今日日期
  setToday() {
    const today = formatDate(new Date(), 'YYYY-MM-DD')
    this.setData({ today })
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    const userInfo = app.getUserInfo()
    const token = app.globalData.token
    
    this.setData({
      isLogin: !!token,
      userInfo: userInfo || {}
    })
  },

  // 加载今日课程
  async loadTodayCourses() {
    this.setData({ loading: true })
    
    try {
      const res = await api.courses.getList({
        date: this.data.today,
        page: 1,
        page_size: 5
      })
      
      this.setData({
        todayCourses: res.list || [],
        loading: false
      })
    } catch (error) {
      console.error('加载课程失败:', error)
      this.setData({ loading: false })
    }
  },

  // 加载场馆列表
  async loadStudios() {
    try {
      const res = await api.studios.getList({
        page: 1,
        page_size: 10
      })
      
      this.setData({
        studios: res.list || []
      })
    } catch (error) {
      console.error('加载场馆失败:', error)
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

  // 跳转到课程列表
  goToCourses() {
    wx.switchTab({
      url: '/pages/courses/courses'
    })
  },

  // 跳转到课程详情
  goToCourseDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${id}`
    })
  },

  // 预约课程
  async bookCourse(e) {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        this.goToLogin()
      }, 1500)
      return
    }

    const { id } = e.currentTarget.dataset
    
    wx.showLoading({ title: '预约中...' })
    
    try {
      await api.bookings.create({
        schedule_id: id
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '预约成功',
        icon: 'success'
      })
      
      // 刷新数据
      this.loadTodayCourses()
      this.loadStats()
    } catch (error) {
      wx.hideLoading()
      console.error('预约失败:', error)
    }
  },

  // 跳转到场馆详情
  goToStudio(e) {
    const { id } = e.currentTarget.dataset
    // TODO: 实现场馆详情页
    wx.showToast({
      title: '场馆详情开发中',
      icon: 'none'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    Promise.all([
      this.loadTodayCourses(),
      this.loadStudios(),
      this.data.isLogin ? this.loadStats() : Promise.resolve()
    ]).then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
