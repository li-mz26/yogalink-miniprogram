// pages/courses/courses.js
const { api } = require('../../utils/api')
const { formatDate, getWeekDay } = require('../../utils/util')

Page({
  data: {
    dateList: [],
    selectedDate: '',
    courses: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad() {
    this.generateDateList()
    this.loadCourses()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true })
    this.loadCourses().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 })
      this.loadCourses()
    }
  },

  // 生成未来14天的日期列表
  generateDateList() {
    const dateList = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const dateStr = formatDate(date, 'YYYY-MM-DD')
      const day = String(date.getDate()).padStart(2, '0')
      const week = i === 0 ? '今天' : getWeekDay(dateStr)
      
      dateList.push({
        date: dateStr,
        day: day,
        week: week
      })
    }
    
    this.setData({
      dateList,
      selectedDate: dateList[0].date
    })
  },

  // 选择日期
  selectDate(e) {
    const { date } = e.currentTarget.dataset
    this.setData({
      selectedDate: date,
      page: 1,
      hasMore: true
    })
    this.loadCourses()
  },

  // 加载课程列表
  async loadCourses() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const res = await api.courses.getList({
        date: this.data.selectedDate,
        page: this.data.page,
        page_size: this.data.pageSize
      })
      
      const newCourses = res.list || []
      
      this.setData({
        courses: this.data.page === 1 ? newCourses : [...this.data.courses, ...newCourses],
        loading: false,
        hasMore: newCourses.length >= this.data.pageSize
      })
    } catch (error) {
      console.error('加载课程失败:', error)
      this.setData({ loading: false })
    }
  },

  // 跳转到课程详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${id}`
    })
  }
})
