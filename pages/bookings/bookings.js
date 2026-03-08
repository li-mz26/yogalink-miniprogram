// pages/bookings/bookings.js
import { api } from '../../utils/api'
import { bookingStatusMap } from '../../utils/util'

Page({
  data: {
    isLogin: false,
    bookings: [],
    filteredBookings: [],
    activeTab: 'all',
    loading: false,
    statusMap: bookingStatusMap
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
    if (this.data.isLogin) {
      this.loadBookings()
    }
  },

  onPullDownRefresh() {
    if (this.data.isLogin) {
      this.loadBookings().then(() => {
        wx.stopPullDownRefresh()
      })
    } else {
      wx.stopPullDownRefresh()
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    const isLogin = !!app.globalData.token
    this.setData({ isLogin })
  },

  // 加载预约列表
  async loadBookings() {
    this.setData({ loading: true })
    
    try {
      const res = await api.bookings.getList({
        page: 1,
        page_size: 100
      })
      
      const bookings = res.list || []
      this.setData({
        bookings,
        loading: false
      })
      this.filterBookings()
    } catch (error) {
      console.error('加载预约失败:', error)
      this.setData({ loading: false })
    }
  },

  // 切换筛选标签
  switchTab(e) {
    const { tab } = e.currentTarget.dataset
    this.setData({ activeTab: tab })
    this.filterBookings()
  },

  // 筛选预约
  filterBookings() {
    const { bookings, activeTab } = this.data
    let filtered = []
    
    switch (activeTab) {
      case 'upcoming':
        // 即将开始：已支付且未完成的
        filtered = bookings.filter(b => b.status === 2)
        break
      case 'completed':
        // 已完成：已完成或已评价的
        filtered = bookings.filter(b => b.status === 3 || b.status === 4)
        break
      default:
        filtered = bookings
    }
    
    this.setData({ filteredBookings: filtered })
  },

  // 取消预约
  async cancelBooking(e) {
    const { id } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？取消后名额将释放给其他用户。',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' })
          
          try {
            await api.bookings.cancel(id)
            
            wx.hideLoading()
            wx.showToast({
              title: '取消成功',
              icon: 'success'
            })
            
            // 刷新列表
            this.loadBookings()
          } catch (error) {
            wx.hideLoading()
            console.error('取消预约失败:', error)
          }
        }
      }
    })
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
  }
})
