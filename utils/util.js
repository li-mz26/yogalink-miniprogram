// 格式化日期
export const formatDate = (dateStr, format = 'YYYY-MM-DD') => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

// 格式化价格
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '¥0'
  return `¥${Number(price).toFixed(0)}`
}

// 获取星期几
export const getWeekDay = (dateStr) => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(dateStr)
  return days[date.getDay()]
}

// 计算倒计时
export const getCountdown = (targetTime) => {
  const now = new Date().getTime()
  const target = new Date(targetTime).getTime()
  const diff = target - now
  
  if (diff <= 0) return null
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { days, hours, minutes }
}

// 预约状态映射
export const bookingStatusMap = {
  0: { text: '已取消', color: '#999', class: 'cancelled' },
  1: { text: '待支付', color: '#faad14', class: 'pending' },
  2: { text: '已预约', color: '#52c41a', class: 'confirmed' },
  3: { text: '已完成', color: '#7B68EE', class: 'completed' },
  4: { text: '已评价', color: '#7B68EE', class: 'reviewed' }
}

// 课程难度映射
export const levelMap = {
  1: { text: '初级', color: '#52c41a' },
  2: { text: '中级', color: '#faad14' },
  3: { text: '高级', color: '#ff4d4f' }
}

// 防抖函数
export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 验证手机号
export const isValidPhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 验证密码
export const isValidPassword = (password) => {
  return password.length >= 6
}
