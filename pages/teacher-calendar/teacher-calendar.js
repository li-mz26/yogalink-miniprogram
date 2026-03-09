// pages/teacher-calendar/teacher-calendar.js
const { api } = require('../../utils/api')

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    weeks: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    selectedDate: '',
    selectedDayInfo: null,
    loading: false,
    // 约课详情
    dayBookings: [],
    // 状态文字映射
    statusText: {
      pending: '待确认',
      accepted: '已接受',
      rejected: '已拒绝',
      cancelled: '已取消',
      completed: '已完成'
    },
    // 可用时间设置
    showTimeModal: false,
    timeSlots: [],
    newTimeSlot: { start_time: '09:00', end_time: '10:00' }
  },

  onLoad() {
    const now = new Date()
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    })
    this.generateCalendar()
    this.loadAvailability()
  },

  // 生成日历（列视图）
  generateCalendar() {
    const { currentYear, currentMonth } = this.data
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

    const days = []
    // 填充空白（月初的空白天）
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', empty: true, weekDay: i })
    }
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const date = new Date(currentYear, currentMonth - 1, i)
      days.push({
        day: i,
        date: dateStr,
        weekDay: date.getDay(),
        today: this.isToday(currentYear, currentMonth, i),
        bookingCount: 0
      })
    }

    this.setData({ days })
    this.loadMonthBookings()
  },

  isToday(year, month, day) {
    const today = new Date()
    return today.getFullYear() === year &&
           today.getMonth() + 1 === month &&
           today.getDate() === day
  },

  // 上个月
  prevMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentMonth = 12
      currentYear--
    } else {
      currentMonth--
    }
    this.setData({ currentYear, currentMonth })
    this.generateCalendar()
  },

  // 下个月
  nextMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentMonth = 1
      currentYear++
    } else {
      currentMonth++
    }
    this.setData({ currentYear, currentMonth })
    this.generateCalendar()
  },

  // 选择日期
  selectDate(e) {
    const { date } = e.currentTarget.dataset
    if (!date) return

    this.setData({ selectedDate: date })
    this.loadDayDetail(date)
  },

  // 加载当月约课
  async loadMonthBookings() {
    try {
      const { currentYear, currentMonth } = this.data
      const firstDay = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
      const lastDay = new Date(currentYear, currentMonth, 0).getDate()
      const lastDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDay}`

      const res = await api.teacher.getBookingRequests()

      // 统计每天的约课数量
      const bookings = res.list || []
      const days = this.data.days.map(item => {
        if (item.empty) return item
        const dayBookings = bookings.filter(b => b.date === item.date)
        return {
          ...item,
          hasBooking: dayBookings.length > 0,
          bookingCount: dayBookings.length
        }
      })

      this.setData({ days })
    } catch (error) {
      console.error('加载约课失败:', error)
    }
  },

  // 加载可用时间
  async loadAvailability() {
    try {
      const res = await api.teacher.getAvailability()
      this.setData({ timeSlots: res.list || [] })
    } catch (error) {
      console.error('加载可用时间失败:', error)
    }
  },

  // 加载日期详情
  async loadDayDetail(date) {
    this.setData({ loading: true })
    try {
      const res = await api.teacher.getAvailability(date)
      const slots = res.list || []

      // 获取该日期的预约请求
      const requestsRes = await api.teacher.getBookingRequests()
      const dayRequests = (requestsRes.list || []).filter(r => r.date === date)

      this.setData({
        dayBookings: dayRequests,
        selectedDayInfo: {
          date,
          availableSlots: slots,
          bookingCount: dayRequests.length
        },
        loading: false
      })
    } catch (error) {
      console.error('加载日期详情失败:', error)
      this.setData({ loading: false })
    }
  },

  // 显示添加时间弹窗
  showAddTimeModal() {
    this.setData({
      showTimeModal: true,
      newTimeSlot: { start_time: '09:00', end_time: '10:00' }
    })
  },

  // 关闭弹窗
  closeModal() {
    this.setData({ showTimeModal: false })
  },

  // 阻止弹窗关闭（点击弹窗内容时不关闭）
  stopModal() {
    // 不做任何操作，阻止事件冒泡
  },

  // 选择开始时间
  onStartTimeChange(e) {
    this.setData({
      'newTimeSlot.start_time': e.detail.value
    })
  },

  // 选择结束时间
  onEndTimeChange(e) {
    this.setData({
      'newTimeSlot.end_time': e.detail.value
    })
  },

  // 保存可用时间
  async saveTimeSlot() {
    const { selectedDate, newTimeSlot } = this.data

    if (!selectedDate) {
      wx.showToast({ title: '请先选择日期', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      await api.teacher.setAvailability({
        date: selectedDate,
        start_time: newTimeSlot.start_time,
        end_time: newTimeSlot.end_time
      })

      wx.hideLoading()
      wx.showToast({ title: '设置成功', icon: 'success' })
      this.closeModal()
      this.loadDayDetail(selectedDate)
      this.loadAvailability()
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  // 删除可用时间
  async deleteTimeSlot(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个时间段吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.teacher.setAvailability({
              id,
              is_deleted: true
            })
            wx.showToast({ title: '删除成功', icon: 'success' })
            this.loadDayDetail(this.data.selectedDate)
            this.loadAvailability()
          } catch (error) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})
