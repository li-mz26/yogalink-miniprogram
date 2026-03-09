// pages/bookings/bookings.js
const { api } = require('../../utils/api')

Page({
  data: {
    isLogin: false,
    userInfo: null,
    isTeacher: false,
    currentYear: 0,
    currentMonth: 0,
    weeks: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    selectedDate: '',
    timeSlots: [],
    dayBookings: [],
    showTimeModal: false,
    newTimeSlot: { start_time: '09:00', end_time: '10:00' },
    // 一键配置
    showQuickSetModal: false,
    repeatOptions: [
      { name: '仅当天', value: 'once' },
      { name: '每周', value: 'weekly' },
      { name: '每月', value: 'monthly' },
      { name: '每天', value: 'daily' }
    ],
    repeatIndex: 0,
    weekDays: [
      { name: '日', value: 0, selected: false },
      { name: '一', value: 1, selected: false },
      { name: '二', value: 2, selected: false },
      { name: '三', value: 3, selected: false },
      { name: '四', value: 4, selected: false },
      { name: '五', value: 5, selected: false },
      { name: '六', value: 6, selected: false }
    ],
    dayOptions: Array.from({ length: 28 }, (_, i) => i + 1),
    dayIndex: 0,
    quickTimeSlot: {
      start_time: '09:00',
      end_time: '10:00',
      start_date: '',
      end_date: ''
    },
    statusText: {
      pending: '待确认',
      accepted: '已接受',
      rejected: '已拒绝',
      cancelled: '已取消',
      completed: '已完成'
    }
  },

  onLoad() {
    const now = new Date()
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`

    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      'quickTimeSlot.start_date': startDate,
      'quickTimeSlot.end_date': endDate
    })
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const app = getApp()
    const userInfo = app.getUserInfo()
    const isLogin = !!app.globalData.token

    this.setData({
      isLogin,
      userInfo: userInfo || null,
      isTeacher: userInfo && userInfo.role === 'teacher'
    })

    if (this.data.isTeacher) {
      wx.setNavigationBarTitle({ title: '预约管理' })
      this.generateCalendar()
      this.loadAllData()
    } else {
      wx.setNavigationBarTitle({ title: '我的预约' })
    }
  },

  // 生成日历
  generateCalendar() {
    const { currentYear, currentMonth } = this.data
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', empty: true })
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({
        day: i,
        date: dateStr,
        today: this.isToday(currentYear, currentMonth, i)
      })
    }

    this.setData({ days })

    // 默认选择今天
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    if (!this.data.selectedDate) {
      this.setData({ selectedDate: todayStr })
      this.loadDayDetail(todayStr)
    }

    this.loadMonthAvailability()
  },

  isToday(year, month, day) {
    const today = new Date()
    return today.getFullYear() === year &&
           today.getMonth() + 1 === month &&
           today.getDate() === day
  },

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

  async loadAllData() {
    await this.loadMonthAvailability()
    if (this.data.selectedDate) {
      await this.loadDayDetail(this.data.selectedDate)
    }
  },

  // 加载当月可用时间统计
  async loadMonthAvailability() {
    try {
      const { currentYear, currentMonth } = this.data
      const res = await api.teacher.getAvailability()
      const availabilities = res.list || []

      // 获取当月所有日期的可用时间
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

      const days = this.data.days.map(item => {
        if (item.empty) return item
        const hasAvailability = availabilities.some(a => a.date === item.date)
        return { ...item, hasAvailability }
      })

      this.setData({ days })
    } catch (error) {
      console.error('加载可用时间失败:', error)
    }
  },

  // 选择日期
  selectDate(e) {
    const { date } = e.currentTarget.dataset
    if (!date) return

    this.setData({ selectedDate: date })
    this.loadDayDetail(date)
  },

  // 加载日期详情
  async loadDayDetail(date) {
    try {
      // 获取可用时间
      const res = await api.teacher.getAvailability(date)
      const availabilities = res.list || []

      // 生成24小时时间块
      const timeSlots = []
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = String(hour).padStart(2, '0')
        const slot = availabilities.find(a => {
          const startHour = parseInt(a.start_time.split(':')[0])
          return startHour === hour
        })

        timeSlots.push({
          hour: hourStr,
          available: !!slot,
          hasBooking: false,
          slotId: slot ? slot.id : null
        })
      }

      // 获取当天预约
      const requestsRes = await api.teacher.getBookingRequests()
      const dayRequests = (requestsRes.list || []).filter(r => r.date === date)

      // 标记已预约的时间段
      dayRequests.forEach(req => {
        const startHour = parseInt(req.start_time.split(':')[0])
        const idx = timeSlots.findIndex(t => parseInt(t.hour) === startHour)
        if (idx >= 0) {
          timeSlots[idx].hasBooking = true
        }
      })

      this.setData({
        timeSlots,
        dayBookings: dayRequests
      })
    } catch (error) {
      console.error('加载日期详情失败:', error)
    }
  },

  // 点击时间块切换可用状态
  toggleTimeSlot(e) {
    const { hour } = e.currentTarget.dataset
    const slot = this.data.timeSlots.find(t => t.hour === hour)

    if (slot.hasBooking) {
      wx.showToast({ title: '该时段已有预约', icon: 'none' })
      return
    }

    if (slot.available) {
      // 删除可用时间
      wx.showModal({
        title: '确认删除',
        content: `确定要删除 ${hour}:00 的可用时间吗？`,
        success: (res) => {
          if (res.confirm) {
            this.deleteTimeSlot(slot.slotId)
          }
        }
      })
    } else {
      // 显示添加弹窗
      this.setData({
        showTimeModal: true,
        newTimeSlot: {
          start_time: `${hour}:00`,
          end_time: `${String(parseInt(hour) + 1).padStart(2, '0')}:00`
        }
      })
    }
  },

  // 关闭弹窗
  closeModal() {
    this.setData({ showTimeModal: false })
  },

  // 阻止弹窗关闭
  stopModal() {},

  // 选择开始时间
  onStartTimeChange(e) {
    this.setData({ 'newTimeSlot.start_time': e.detail.value })
  },

  // 选择结束时间
  onEndTimeChange(e) {
    this.setData({ 'newTimeSlot.end_time': e.detail.value })
  },

  // 保存可用时间
  async saveTimeSlot() {
    const { selectedDate, newTimeSlot } = this.data

    wx.showLoading({ title: '保存中...' })

    try {
      await api.teacher.setAvailability({
        slots: [{
          date: selectedDate,
          start_time: newTimeSlot.start_time,
          end_time: newTimeSlot.end_time
        }]
      })

      wx.hideLoading()
      wx.showToast({ title: '设置成功', icon: 'success' })
      this.closeModal()
      this.loadDayDetail(selectedDate)
      this.loadMonthAvailability()
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  // 删除可用时间
  async deleteTimeSlot(id) {
    try {
      await api.teacher.setAvailability({
        slots: [{
          id: id,
          is_deleted: true
        }]
      })
      wx.showToast({ title: '删除成功', icon: 'success' })
      this.loadDayDetail(this.data.selectedDate)
      this.loadMonthAvailability()
    } catch (error) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  // ===== 一键配置 =====
  showQuickSetModal() {
    const now = new Date()
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-28`

    this.setData({
      showQuickSetModal: true,
      repeatIndex: 0,
      weekDays: [
        { name: '日', value: 0, selected: false },
        { name: '一', value: 1, selected: false },
        { name: '二', value: 2, selected: false },
        { name: '三', value: 3, selected: false },
        { name: '四', value: 4, selected: false },
        { name: '五', value: 5, selected: false },
        { name: '六', value: 6, selected: false }
      ],
      dayIndex: 0,
      quickTimeSlot: {
        start_time: '09:00',
        end_time: '10:00',
        start_date: startDate,
        end_date: endDate
      }
    })
  },

  closeQuickSetModal() {
    this.setData({ showQuickSetModal: false })
  },

  onRepeatChange(e) {
    this.setData({ repeatIndex: e.detail.value })
  },

  toggleWeekDay(e) {
    const { index } = e.currentTarget.dataset
    const weekDays = this.data.weekDays
    weekDays[index].selected = !weekDays[index].selected
    this.setData({ weekDays })
  },

  onQuickStartTimeChange(e) {
    this.setData({ 'quickTimeSlot.start_time': e.detail.value })
  },

  onQuickEndTimeChange(e) {
    this.setData({ 'quickTimeSlot.end_time': e.detail.value })
  },

  onQuickStartDateChange(e) {
    this.setData({ 'quickTimeSlot.start_date': e.detail.value })
  },

  onQuickEndDateChange(e) {
    this.setData({ 'quickTimeSlot.end_date': e.detail.value })
  },

  onDayChange(e) {
    this.setData({ dayIndex: e.detail.value })
  },

  // 保存一键配置
  async saveQuickSet() {
    const { repeatIndex, weekDays, dayIndex, quickTimeSlot, currentYear, currentMonth } = this.data
    const { start_time, end_time, start_date, end_date } = quickTimeSlot

    const slots = []
    const repeatType = ['once', 'weekly', 'monthly', 'daily'][repeatIndex]

    // 解析日期
    const start = new Date(start_date)
    const end = new Date(end_date)

    // 生成日期列表
    const dates = []
    const current = new Date(start)

    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`

      let shouldAdd = false

      if (repeatType === 'once') {
        shouldAdd = true
      } else if (repeatType === 'daily') {
        shouldAdd = true
      } else if (repeatType === 'weekly') {
        const dayOfWeek = current.getDay()
        const selectedDays = weekDays.filter(d => d.selected).map(d => d.value)
        if (selectedDays.includes(dayOfWeek)) {
          shouldAdd = true
        }
      } else if (repeatType === 'monthly') {
        if (current.getDate() === dayIndex + 1) {
          shouldAdd = true
        }
      }

      if (shouldAdd) {
        dates.push(dateStr)
      }

      current.setDate(current.getDate() + 1)
    }

    // 生成slots
    dates.forEach(date => {
      slots.push({
        date,
        start_time,
        end_time
      })
    })

    if (slots.length === 0) {
      wx.showToast({ title: '请选择有效的日期范围', icon: 'none' })
      return
    }

    wx.showLoading({ title: '配置中...' })

    try {
      await api.teacher.setAvailability({ slots })

      wx.hideLoading()
      wx.showToast({ title: `已配置 ${slots.length} 个时段`, icon: 'success' })
      this.closeQuickSetModal()
      this.loadAllData()
    } catch (error) {
      wx.hideLoading()
      console.error('配置失败:', error)
      wx.showToast({ title: '配置失败', icon: 'none' })
    }
  },

  // 接受预约
  async acceptRequest(e) {
    const { id } = e.currentTarget.dataset

    wx.showLoading({ title: '处理中...' })
    try {
      await api.teacher.acceptRequest(id, {})
      wx.hideLoading()
      wx.showToast({ title: '已接受', icon: 'success' })
      this.loadAllData()
    } catch (error) {
      wx.hideLoading()
      console.error('接受失败:', error)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 拒绝预约
  async rejectRequest(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝这个预约请求吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          try {
            await api.teacher.rejectRequest(id, {})
            wx.hideLoading()
            wx.showToast({ title: '已拒绝', icon: 'success' })
            this.loadAllData()
          } catch (error) {
            wx.hideLoading()
            console.error('拒绝失败:', error)
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  }
})
