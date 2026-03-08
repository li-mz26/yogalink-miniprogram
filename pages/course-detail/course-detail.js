// pages/course-detail/course-detail.js
const { api } = require('../../utils/api')

Page({
  data: {
    courseId: null,
    course: {},
    loading: false,
    bookingLoading: false,
    isLogin: false
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({
        title: '课程ID无效',
        icon: 'none'
      })
      wx.navigateBack()
      return
    }
    
    this.setData({ 
      courseId: id,
      isLogin: !!getApp().globalData.token
    })
    this.loadCourseDetail()
  },

  onShow() {
    this.setData({
      isLogin: !!getApp().globalData.token
    })
  },

  // 加载课程详情
  async loadCourseDetail() {
    this.setData({ loading: true })
    
    try {
      const res = await api.courses.getDetail(this.data.courseId)
      this.setData({
        course: res,
        loading: false
      })
    } catch (error) {
      console.error('加载课程详情失败:', error)
      this.setData({ loading: false })
    }
  },

  // 预约课程
  async bookCourse() {
    if (!this.data.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再预约课程',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
        }
      })
      return
    }

    if (this.data.course.booked_count >= this.data.course.max_students) {
      wx.showToast({
        title: '该课程已满员',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认预约',
      content: `确定要预约「${this.data.course.template.name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          this.setData({ bookingLoading: true })
          
          try {
            await api.bookings.create({
              schedule_id: this.data.courseId
            })
            
            wx.showToast({
              title: '预约成功',
              icon: 'success'
            })
            
            // 刷新课程详情
            this.loadCourseDetail()
            
            // 延迟返回
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } catch (error) {
            console.error('预约失败:', error)
          } finally {
            this.setData({ bookingLoading: false })
          }
        }
      }
    })
  }
})
