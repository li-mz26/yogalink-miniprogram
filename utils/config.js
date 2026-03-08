// 配置信息
// 开发环境
const DEV_API_URL = 'http://localhost:8080'
// 生产环境（需要替换为你的服务器地址）
const PROD_API_URL = 'https://api.yogalink.com'

// 根据环境选择
export const API_BASE_URL = PROD_API_URL

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 30000
