# YogaLink 瑜伽约课小程序

YogaLink 微信小程序版本，与现有后端 API 无缝对接。

## 功能特性

- 📅 **课程浏览** - 查看今日及未来 14 天的课程安排
- 🔍 **课程筛选** - 按日期筛选课程
- 📖 **课程详情** - 查看课程介绍、教练信息、预约状态
- 📝 **在线预约** - 一键预约心仪课程
- 📋 **预约管理** - 查看预约记录、取消预约
- 👤 **个人中心** - 用户信息、预约统计

## 项目结构

```
yogalink-miniprogram/
├── app.js                  # 小程序入口
├── app.json                # 全局配置
├── app.wxss                # 全局样式
├── project.config.json     # 项目配置
├── sitemap.json            # 站点地图
├── utils/                  # 工具函数
│   ├── api.js             # API 封装
│   ├── config.js          # 配置文件
│   └── util.js            # 工具函数
├── pages/                  # 页面
│   ├── index/             # 首页
│   ├── courses/           # 课程列表
│   ├── course-detail/     # 课程详情
│   ├── bookings/          # 我的预约
│   ├── profile/           # 个人中心
│   └── login/             # 登录页
└── images/                 # 图片资源
```

## 快速开始

### 1. 配置后端 API 地址

修改 `utils/config.js` 中的 `API_BASE_URL`：

```javascript
// 开发环境
const DEV_API_URL = 'http://localhost:8080'
// 生产环境
const PROD_API_URL = 'https://your-api-domain.com'

export const API_BASE_URL = PROD_API_URL
```

### 2. 配置小程序 AppID

修改 `project.config.json` 中的 `appid`：

```json
{
  "appid": "wxYOURAPPID"
}
```

### 3. 导入微信开发者工具

1. 打开微信开发者工具
2. 选择「导入项目」
3. 选择本项目目录
4. 填写你的 AppID
5. 点击「导入」

### 4. 添加图片资源

需要准备以下图片（放在 `images/` 目录）：

- `icon_home.png` / `icon_home_active.png` - 首页图标
- `icon_course.png` / `icon_course_active.png` - 课程图标
- `icon_booking.png` / `icon_booking_active.png` - 预约图标
- `icon_profile.png` / `icon_profile_active.png` - 我的图标
- `avatar_default.png` - 默认头像
- `course_default.png` - 默认课程封面
- `studio_default.png` - 默认场馆封面

## API 接口

小程序与现有后端 API 对接，接口文档参见主项目。

### 主要接口

| 接口 | 说明 |
|------|------|
| POST /v1/auth/login | 用户登录 |
| POST /v1/auth/register | 用户注册 |
| GET /v1/users/me | 获取用户信息 |
| GET /v1/courses | 课程列表 |
| GET /v1/courses/:id | 课程详情 |
| POST /v1/bookings | 创建预约 |
| GET /v1/bookings | 预约列表 |
| POST /v1/bookings/:id/cancel | 取消预约 |

## 开发注意事项

1. **JWT 认证** - 登录后自动在请求头添加 `Authorization: Bearer {token}`
2. **登录态管理** - 使用 `wx.getStorageSync` 持久化存储 token
3. **错误处理** - API 封装中统一处理 401 等错误状态

## 发布流程

1. 在微信开发者工具中点击「上传」
2. 登录微信公众平台小程序后台
3. 进入「版本管理」提交审核
4. 审核通过后发布上线

## 技术栈

- 微信小程序原生开发
- ES6+
- Promise / async-await

## 许可证

MIT
