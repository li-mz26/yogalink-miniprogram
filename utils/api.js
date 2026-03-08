// utils/api.js
const { API_BASE_URL, REQUEST_TIMEOUT } = require('./config')

// 请求拦截
const request = (options) => {
  const app = getApp()
  const token = app.globalData.token

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.header || {})
      },
      timeout: REQUEST_TIMEOUT,
      success: (res) => {
        if (res.statusCode === 200) {
          const data = res.data
          if (data.code === 0) {
            resolve(data.data)
          } else if (data.code === 401) {
            app.clearAuth()
            wx.showToast({ title: '登录已过期', icon: 'none' })
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/login/login' })
            }, 1500)
            reject(new Error('登录已过期'))
          } else {
            wx.showToast({ title: data.message || '请求失败', icon: 'none' })
            reject(new Error(data.message))
          }
        } else {
          wx.showToast({ title: `请求失败 (${res.statusCode})`, icon: 'none' })
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

// API 封装
const api = {
  // 用户认证
  auth: {
    login: (data) => request({ url: '/v1/auth/login', method: 'POST', data }),
    register: (data) => request({ url: '/v1/auth/register', method: 'POST', data }),
    getProfile: () => request({ url: '/v1/user/profile', method: 'GET' })
  },

  // 老师端 API
  teacher: {
    // 资料管理
    getProfile: () => request({ url: '/v1/teacher/profile', method: 'GET' }),
    updateProfile: (data) => request({ url: '/v1/teacher/profile', method: 'POST', data }),
    
    // 可用时间
    getAvailability: (date) => request({ 
      url: '/v1/teacher/availability', 
      method: 'GET',
      data: date ? { date } : {}
    }),
    setAvailability: (data) => request({ url: '/v1/teacher/availability', method: 'POST', data }),
    
    // 授课地点
    getLocations: () => request({ url: '/v1/teacher/locations', method: 'GET' }),
    setLocations: (data) => request({ url: '/v1/teacher/locations', method: 'POST', data }),
    
    // 预约请求
    getBookingRequests: (status) => request({ 
      url: '/v1/teacher/booking-requests', 
      method: 'GET',
      data: status ? { status } : {}
    }),
    acceptRequest: (id, data) => request({ 
      url: `/v1/teacher/booking-requests/${id}/accept`, 
      method: 'POST',
      data
    }),
    rejectRequest: (id, data) => request({ 
      url: `/v1/teacher/booking-requests/${id}/reject`, 
      method: 'POST',
      data
    })
  },

  // 学生端 API
  student: {
    // 搜索附近老师
    findNearbyTeachers: (params) => request({ 
      url: '/v1/teachers/nearby', 
      method: 'GET',
      data: params
    }),
    
    // 预约请求
    createBookingRequest: (data) => request({ 
      url: '/v1/student/booking-request', 
      method: 'POST',
      data
    }),
    getMyBookingRequests: () => request({ 
      url: '/v1/student/booking-requests', 
      method: 'GET'
    })
  }
}

module.exports = { api }
