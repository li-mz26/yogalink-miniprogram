import { API_BASE_URL, REQUEST_TIMEOUT } from './config'

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
            // 登录过期，清除登录态并跳转登录页
            app.clearAuth()
            wx.showToast({
              title: '登录已过期',
              icon: 'none'
            })
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/login/login'
              })
            }, 1500)
            reject(new Error('登录已过期'))
          } else {
            wx.showToast({
              title: data.message || '请求失败',
              icon: 'none'
            })
            reject(new Error(data.message))
          }
        } else if (res.statusCode === 401) {
          app.clearAuth()
          wx.showToast({
            title: '登录已过期',
            icon: 'none'
          })
          reject(new Error('登录已过期'))
        } else {
          wx.showToast({
            title: `请求失败 (${res.statusCode})`,
            icon: 'none'
          })
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// API 封装
export const api = {
  // 用户认证
  auth: {
    // 登录
    login: (data) => request({
      url: '/v1/auth/login',
      method: 'POST',
      data
    }),
    
    // 注册
    register: (data) => request({
      url: '/v1/auth/register',
      method: 'POST',
      data
    }),
    
    // 获取用户信息
    getProfile: () => request({
      url: '/v1/users/me',
      method: 'GET'
    })
  },

  // 课程相关
  courses: {
    // 获取课程列表
    getList: (params = {}) => request({
      url: '/v1/courses',
      method: 'GET',
      data: params
    }),
    
    // 获取课程详情
    getDetail: (id) => request({
      url: `/v1/courses/${id}`,
      method: 'GET'
    })
  },

  // 预约相关
  bookings: {
    // 创建预约
    create: (data) => request({
      url: '/v1/bookings',
      method: 'POST',
      data
    }),
    
    // 获取我的预约列表
    getList: (params = {}) => request({
      url: '/v1/bookings',
      method: 'GET',
      data: params
    }),
    
    // 取消预约
    cancel: (id) => request({
      url: `/v1/bookings/${id}/cancel`,
      method: 'POST'
    }),
    
    // 获取预约详情
    getDetail: (id) => request({
      url: `/v1/bookings/${id}`,
      method: 'GET'
    })
  },

  // 场馆相关
  studios: {
    // 获取场馆列表
    getList: (params = {}) => request({
      url: '/v1/studios',
      method: 'GET',
      data: params
    }),
    
    // 获取场馆详情
    getDetail: (id) => request({
      url: `/v1/studios/${id}`,
      method: 'GET'
    })
  }
}

export default api
