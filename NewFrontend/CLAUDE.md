# CLAUDE.md — 红色文化AR游览前端重构

> **IMPORTANT**: 本项目是前端重构项目，从 UniApp 迁移至纯 HTML/CSS/JS。每次生成代码前，必须先查看 `frontend/` 目录下的原始文件，严格保留所有现有 API 接口的功能定义、参数结构和返回格式。

## 项目背景

将红色文化AR游览应用从 UniApp 框架重构为标准 HTML5 + CSS3 + JavaScript (ES6+) 网页应用，运行于 Android/iOS WebView。目标：技术栈纯化、架构清晰、功能完整迁移、可维护性提升。

## 技术栈

- **语言**: 原生 JavaScript (ES6+), HTML5, CSS3
- **CSS**: CSS Variables（无预处理器）
- **模块化**: ES6 Modules
- **构建**: Vite
- **路由**: 原生 Hash 路由
- **HTTP**: Fetch API（禁止使用 uni.request）
- **地图**: 高德地图 JS API 2.0
- **状态**: 自定义 Store 模式
- **坐标系**: GCJ-02

## 重构范围与职责边界

### 前端负责

| 功能 | 说明 |
|------|------|
| 地图展示 | 高德 JS API 渲染 |
| 定位服务 | AMap.Geolocation |
| 逆地理编码 | AMap.Geocoder |
| 围栏前端预检 | Haversine 公式计算距离 |
| 统计前端展示 | 调用后端 /api/tracks/stats 获取统计数据并展示 |
| 路由与状态 | Hash 路由 + 自定义 Store |

### 后端负责（前端仅调用，不实现）

用户认证(JWT)、人物/围栏 CRUD、AI 对话(GLM)、轨迹持久化、文件上传

### 页面清单

| 页面 | 路由 | 文件 |
|------|------|------|
| 首页/地图 | `/` | index.html |
| 登录 | `/login` | login.html |
| 围栏地图 | `/map` | map.html |
| 人物列表 | `/figures` | figures.html |
| AI对话 | `/chat?id={id}` | chat.html |
| 统计 | `/stats` | stats.html |
| 个人中心 | `/profile` | profile.html |

## 文件结构

```
NewFrontend/
├── index.html / login.html / map.html / figures.html / chat.html / stats.html / profile.html
├── css/
│   ├── variables.css      # CSS 变量（颜色/间距/圆角/阴影）
│   ├── base.css           # 重置样式
│   ├── components.css     # 通用组件样式
│   ├── layout.css         # 布局样式
│   ├── pages/*.css        # 页面样式
│   └── responsive.css     # 响应式
├── js/
│   ├── config/            # api.js, amap.js, app.js
│   ├── utils/             # request.js, storage.js, location.js, fence.js, router.js, helpers.js
│   ├── services/          # auth.js, figures.js, fences.js, chat.js, tracks.js
│   ├── store/             # index.js
│   ├── components/        # Header.js, Footer.js, MapView.js, FigureCard.js, ChatBubble.js, StatCard.js
│   ├── pages/             # IndexPage.js, LoginPage.js, MapPage.js, FiguresPage.js, ChatPage.js, StatsPage.js, ProfilePage.js
│   └── app.js             # 主入口
├── assets/                # images/, icons/
└── vite.config.js
```

## API 接口规范

> **YOU MUST**: 严格按以下接口定义调用后端，不得修改接口路径、参数或返回格式。完整文档见 `Docs/design/API-接口文档.md`。

### 认证

| 方法 | 路径 | 认证 | 请求体 | 返回 |
|------|------|------|--------|------|
| POST | `/api/auth/register` | 公开 | `{username, password, nickname?}` | `{code:201, data:{access_token, refresh_token, token_type:"bearer", user:{id,username,nickname,avatar_url,role,is_active,last_login_at,created_at}}}` |
| POST | `/api/auth/login` | 公开 | `{username, password}` | 同注册返回 |
| GET | `/api/auth/me` | Bearer | - | `{code:200, data:{id,username,nickname,avatar_url,role,is_active,last_login_at,created_at}}` |
| PUT | `/api/auth/password` | Bearer | `{old_password, new_password}` | `{code:200, message:"密码修改成功"}` |
| POST | `/api/auth/refresh` | 公开 | `{refresh_token}` | `{code:200, data:{access_token, refresh_token, token_type:"bearer", user:{...}}}` |
| POST | `/api/auth/logout` | Bearer | - | `{code:200, message:"退出登录成功"}` |

### 人物

| 方法 | 路径 | 认证 | 参数 | 返回 |
|------|------|------|------|------|
| GET | `/api/figures` | 公开 | `?skip=0&limit=100` | `{code:200, data:[{id,name,title,category,birth_year,death_year,location,brief_intro,full_bio,avatar_url,vr_model_url,prompt_template,is_active,sort_order,created_at}]}` |
| GET | `/api/figures/search` | 公开 | `?keyword=&category=&page=1&page_size=20` | `{code:200, data:{items:[...],total,page,page_size,total_pages}}` |
| GET | `/api/figures/{id}` | 公开 | - | `{code:200, data:{id,name,...,created_at}}` |
| POST | `/api/figures` | Admin | `{name,title?,category?,birth_year?,death_year?,location?,brief_intro?,full_bio?,avatar_url?,vr_model_url?,prompt_template?,is_active?,sort_order?}` | `{code:201, data:{id,name,...,created_at}}` |
| PUT | `/api/figures/{id}` | Admin | `{name?,title?,...}` | `{code:200, data:{id,name,...,created_at}}` |
| DELETE | `/api/figures/{id}` | Admin | - | `{code:200, message:"删除成功"}` |

### 围栏

| 方法 | 路径 | 认证 | 参数 | 返回 |
|------|------|------|------|------|
| GET | `/api/fences` | 公开 | `?is_active=&skip=0&limit=100` | `{code:200, data:[{id,name,shape_type,figure_id,center_lng,center_lat,radius,polygon_coords,audio_url,trigger_prompt,description,color,is_active,created_at,updated_at,figure:{id,name,title,avatar_url}|null}]}` |
| GET | `/api/fences/{id}` | 公开 | - | `{code:200, data:{id,name,...,figure:{...}}}` |
| POST | `/api/fences` | Admin | `{name,shape_type?,figure_id?,center_lng?,center_lat?,radius?,polygon_coords?,audio_url?,trigger_prompt?,description?,color?,is_active?}` | `{code:201, data:{id,name,...,created_at,updated_at}}` |
| PUT | `/api/fences/{id}` | Admin | `{name?,shape_type?,...}` | `{code:200, data:{id,name,...,updated_at}}` |
| DELETE | `/api/fences/{id}` | Admin | - | `{code:200, message:"删除成功"}` |
| POST | `/api/fences/check` | 公开 | `{longitude,latitude}` | 触发:`{code:200, data:{triggered:true,fence:{...},figure:{id,name,title,avatar_url}}}` 未触发:`{code:200, data:{triggered:false}}` |
| PATCH | `/api/v1/fences/{id}/status` | Admin | - | `{code:200, data:{id,name,...,is_active:!原值}, message:"状态切换成功"}` |

> **围栏形状说明**：`shape_type` 可选 `circle`（圆形）或 `polygon`（多边形）。圆形围栏需提供 `center_lng`/`center_lat`/`radius`；多边形围栏需提供 `polygon_coords: [{lng,lat},...]`（至少3个顶点）。

### 对话

| 方法 | 路径 | 认证 | 参数 | 返回 |
|------|------|------|------|------|
| POST | `/api/chat/start?figure_id={id}` | Bearer | - | `{code:200, data:{figure_id,figure_name,initial_message,audio_url}}` |
| POST | `/api/chat/send` | Bearer | `{figure_id,message,history?}` | `{code:200, data:{message,audio_url}}` |
| GET | `/api/chat/history/{figure_id}` | Bearer | - | `{code:200, data:[{role,content,created_at}]}` |
| WS | `/ws/chat?token={access_token}` | Bearer | 发送:`{figure_id,message}` | 接收 chunk:`{type:"chunk",text}` / done:`{type:"done",full_text}` / error:`{type:"error",message}` |

> **对话限流**：`/api/chat/send` 限制 30次/分钟。WebSocket 连接需通过 query 参数 `token` 传入 access_token 进行认证。

### 轨迹

| 方法 | 路径 | 认证 | 参数 | 返回 |
|------|------|------|------|------|
| GET | `/api/tracks/my` | Bearer | `?page=1&page_size=20` | `{code:200, data:{items:[{id,fence_id,figure_id,triggered_at,interaction_duration,conversation_rounds}],total,page,page_size,total_pages}}` |
| GET | `/api/tracks/stats` | Bearer | - | `{code:200, data:{total_visits,unique_figures,total_duration,total_rounds,today_visits,week_visits}}` |
| POST | `/api/tracks/record` | Bearer | `{fence_id,figure_id?,interaction_duration?,conversation_rounds?}` | `{code:201, data:{id,fence_id,figure_id,triggered_at,interaction_duration,conversation_rounds}}` |

### 文件管理

| 方法 | 路径 | 认证 | 参数 | 返回 |
|------|------|------|------|------|
| POST | `/api/v1/media/upload` | Bearer | `file` (multipart/form-data) | `{code:201, data:{id,original_name,stored_name,file_path,file_type,file_size,mime_type,url,created_at}}` |
| GET | `/api/v1/media` | Admin | `?file_type=&page=1&page_size=20` | `{code:200, data:{items:[...],total,page,page_size,total_pages}}` |
| DELETE | `/api/v1/media/{file_id}` | Admin | - | `{code:200, message:"删除成功"}` |

> **文件类型限制**：图片(jpg/jpeg/png/webp, ≤5MB)、音频(mp3/wav/ogg, ≤20MB)、3D模型(glb/gltf/vrm, ≤50MB)。返回的 `url` 为相对路径如 `/media/images/img_xxx.jpg`。

### 错误响应格式

```json
{"code": 400, "message": "参数验证失败"}
```

HTTP 状态码：200/201/400/401/403/404/409/422/429/500

> **统一响应包装**：所有接口均返回 `{code, message, data?}` 格式。分页接口 `data` 为 `{items, total, page, page_size, total_pages}`。401 表示 Token 无效/过期，403 表示权限不足（如普通用户访问 Admin 接口）。

## 代码风格

### 命名

- 文件：kebab-case（`figure-card.js`）
- JS 变量/函数：camelCase
- JS 类/构造函数：PascalCase
- CSS 类名：BEM（`.card__title--active`）
- CSS 变量：`--color-primary`

### 组件模式

```javascript
export default class ComponentName {
  constructor(container, props = {}) { /* ... */ }
  render() { /* 返回 HTML 字符串 */ }
  bindEvents() { /* 事件绑定 */ }
  destroy() { /* 清理 */ }
}
```

### 禁止

- 禁止使用 `uni.*` API（用 Fetch/localStorage/标准 DOM 替代）
- 禁止使用 SCSS/LESS（用 CSS Variables）
- 禁止使用 CommonJS `require`（用 ES6 `import/export`）
- 禁止在代码中硬编码 API Key 或密钥
- 禁止添加注释（除非用户要求）
- 禁止修改后端 API 接口定义

### 设计规范

- 主色：`#D93025` 辅色：`#1A1A1A` 背景：`#F5F7FA`
- 圆角：8px(小) / 12px(中) / 16px(大)
- 阴影：`0 2px 8px rgba(0,0,0,0.08)`
- 移动优先，断点：768px / 1024px

## 高德地图配置

```html
<script>
  window._AMapSecurityConfig = { securityJsCode: '94d4378db1ad21baeed37a958a324f6a' }
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=4e90b4242ed26bcf402a0bb7f46197de&callback=initAMap"></script>
```

API 基础路径：开发 `http://localhost:8000`

## 代码生成后必做检查

> **YOU MUST**: 每次代码生成完成后，按顺序执行以下验证：

### 1. 功能完整性验证

- [ ] 所有 API 调用路径、参数、返回格式与上方规范一致
- [ ] 所有页面路由可正常访问
- [ ] Token 存储于 localStorage，401 响应自动跳转登录页
- [ ] 围栏检测逻辑（Haversine 公式）正确实现
- [ ] 统计计算逻辑（tracks 聚合）正确实现
- [ ] 高德地图初始化、定位、围栏渲染正常

### 2. 代码质量审核

- [ ] 无 `uni.*` API 残留
- [ ] 无 SCSS/LESS 语法
- [ ] 无 CommonJS 语法
- [ ] 无硬编码密钥
- [ ] CSS 变量使用一致
- [ ] 组件遵循统一模式（constructor/render/bindEvents/destroy）
- [ ] 响应式样式覆盖所有断点

### 3. 构建验证

```bash
npm run build    # 构建无错误
npm run dev      # 开发服务器正常启动
```

## 参考文档

- 前端改造规划：`NewFrontend/前端改造规划文档.md`
- 后端重构计划：`NewFrontend/后端重构改造计划文档.md`
- API 接口文档：`Docs/design/API-接口文档.md`
- 原始前端代码：`frontend/src/`（生成代码前必须查看）
- 设计风格参考：`NewFrontend/前端设计风格参考.png`
