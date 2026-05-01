import authService from '../services/auth.js'
import request from '../utils/request.js'

// ==================== 游客模式管理系统 ====================
const GuestModeManager = {
  isGuestMode: !authService.isLoggedIn(),
  operationLog: [],
  sessionId: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

  logOperation(action, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      sessionId: this.sessionId,
      page: 'profile'
    }
    this.operationLog.push(logEntry)
    console.log('[游客模式]', logEntry)

    if (this.operationLog.length > 100) {
      this.operationLog.shift()
    }

    return logEntry
  },

  checkPermission(feature) {
    const allowedFeatures = [
      'view_profile',
      'view_stats',
      'navigate_pages',
      'browse_content',
      'click_buttons',
      'view_menus'
    ]

    const isAllowed = allowedFeatures.includes(feature)
    if (!isAllowed) {
      console.warn(`[权限控制] 功能 "${feature}" 在游客模式下受限`)
      this.logOperation('permission_denied', { feature })
    }

    return isAllowed
  },

  getOperationSummary() {
    return {
      totalOperations: this.operationLog.length,
      sessionId: this.sessionId,
      actionsPerformed: [...new Set(this.operationLog.map(log => log.action))]
    }
  }
}

export default class ProfilePage {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container

    this.userInfo = null
    this.stats = null

    this.init()
  }

  async init() {
    try {
      GuestModeManager.logOperation('page_init')
      await this.render()

      if (authService.isLoggedIn()) {
        await this.fetchData()
      } else {
        this.renderGuestMode()
      }

      this.bindEvents()
    } catch (error) {
      console.error('Failed to initialize profile page:', error)
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="profile-page">
        <!-- 顶部 Header 导航栏 -->
        <header class="profile-header">
          <div class="header-location" onclick="window.profilePage.handleLocationClick()">
            <span class="material-symbols-outlined location-icon">location_on</span>
            <span class="location-text" id="currentCity">北京市</span>
          </div>
          <div class="header-actions">
            <button class="icon-btn" onclick="window.profilePage.handleNotification()" aria-label="通知">
              <span class="material-symbols-outlined">notifications</span>
            </button>
            <button class="icon-btn icon-btn--primary" onclick="window.profilePage.handleSettings()" aria-label="设置">
              <span class="material-symbols-outlined">settings</span>
            </button>
          </div>
        </header>

        <!-- 主内容区域 -->
        <main class="profile-main">
          <!-- 用户信息卡片 -->
          <section class="profile-section profile-user-card">
            <div class="user-info-wrapper">
              <div class="user-avatar-container" onclick="window.profilePage.handleAvatarClick()">
                <div class="user-avatar">
                  <img id="userAvatar" src="" alt="用户头像" style="display:none;">
                  <span id="avatarPlaceholder" class="avatar-placeholder">林</span>
                </div>
                <div class="edit-badge">
                  <span class="material-symbols-outlined">edit</span>
                </div>
              </div>

              <div class="user-details">
                <h1 id="userName" class="user-name">林沐云</h1>
                <div id="userBadge" class="user-badge">
                  <span class="material-symbols-outlined badge-icon">verified</span>
                  <span class="badge-text">高级探索者</span>
                </div>
              </div>

              <button class="qr-button" id="actionButton" onclick="window.profilePage.handleActionButton()">
                <span class="material-symbols-outlined">qr_code_2</span>
              </button>
            </div>
          </section>

          <!-- 统计数据卡片 -->
          <section class="profile-section stats-grid">
            <div class="stat-card stat-card--primary" onclick="window.profilePage.handleMileageClick()">
              <div class="stat-header">
                <span class="stat-icon material-symbols-outlined">explore</span>
                <span class="stat-label">本月里程</span>
              </div>
              <div class="stat-value-row">
                <span id="monthlyMileage" class="stat-value">128</span>
                <span class="stat-unit">km</span>
              </div>
            </div>

            <div class="stat-card stat-card--secondary" onclick="window.profilePage.handleFavoritesClick()">
              <div class="stat-header">
                <span class="stat-icon material-symbols-outlined">stars</span>
                <span class="stat-label">收藏地点</span>
              </div>
              <div class="stat-value-row">
                <span id="favoriteCount" class="stat-value">42</span>
                <span class="stat-unit">处</span>
              </div>
            </div>
          </section>

          <!-- 菜单列表 -->
          <section class="profile-section menu-section">
            <h3 class="section-title">个人中心</h3>
            <div class="menu-list">
              <div class="menu-item" data-action="locations" onclick="window.profilePage.handleMyLocations()">
                <div class="menu-icon-wrapper menu-icon--primary">
                  <span class="material-symbols-outlined">location_on</span>
                </div>
                <div class="menu-content">
                  <p class="menu-title">我的地点</p>
                  <p class="menu-subtitle">常用的家、公司与收藏</p>
                </div>
                <span class="menu-arrow material-symbols-outlined">chevron_right</span>
              </div>

              <div class="menu-divider"></div>

              <div class="menu-item" data-action="history" onclick="window.profilePage.handleHistory()">
                <div class="menu-icon-wrapper menu-icon--secondary">
                  <span class="material-symbols-outlined">history</span>
                </div>
                <div class="menu-content">
                  <p class="menu-title">行程历史</p>
                  <p class="menu-subtitle">查看你所有的探索足迹</p>
                </div>
                <span class="menu-arrow material-symbols-outlined">chevron_right</span>
              </div>

              <div class="menu-divider"></div>

              <div class="menu-item" data-action="feedback" onclick="window.profilePage.handleFeedback()">
                <div class="menu-icon-wrapper menu-icon--tertiary">
                  <span class="material-symbols-outlined">chat_bubble</span>
                </div>
                <div class="menu-content">
                  <p class="menu-title">意见反馈</p>
                  <p class="menu-subtitle">告诉我们如何变得更好</p>
                </div>
                <span class="menu-arrow material-symbols-outlined">chevron_right</span>
              </div>
            </div>

            <div class="menu-list menu-list--separate">
              <div class="menu-item" data-action="settings" onclick="window.profilePage.handleSettingsMenu()">
                <div class="menu-icon-wrapper menu-icon--default">
                  <span class="material-symbols-outlined">settings</span>
                </div>
                <div class="menu-content">
                  <p class="menu-title">设置</p>
                </div>
                <span class="menu-arrow material-symbols-outlined">chevron_right</span>
              </div>
            </div>
          </section>

          <!-- Pro升级卡片 -->
          <section class="profile-section upgrade-card" onclick="window.profilePage.handleUpgradePro()">
            <span class="upgrade-icon material-symbols-outlined">auto_awesome</span>
            <div class="upgrade-content">
              <p class="upgrade-title">升级到 Pro</p>
              <p class="upgrade-subtitle">解锁离线地图与 3D 实景导览</p>
            </div>
          </section>
        </main>

        <!-- 底部导航栏 -->
        <nav class="bottom-nav">
          <a class="nav-item" href="#/" data-route="/" id="nav-home">
            <span class="material-symbols-outlined">home</span>
            <span class="nav-label">首页</span>
          </a>
          <a class="nav-item" href="#/stats" data-route="/stats" id="nav-stats">
            <span class="material-symbols-outlined">bar_chart</span>
            <span class="nav-label">统计</span>
          </a>
          <a class="nav-item nav-item--active" href="#/profile" data-route="/profile" id="nav-profile">
            <span class="material-symbols-outlined nav-icon--active" style="font-variation-settings: 'FILL' 1;">person</span>
            <span class="nav-label">我的</span>
            <span class="nav-dot"></span>
          </a>
        </nav>
      </div>

      <style>
        .profile-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f9f9fe;
        }

        /* ========== 顶部 Header ========== */
        .profile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          margin: 16px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-location {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .header-location:hover {
          transform: scale(1.05);
        }

        .location-icon {
          color: #0058bc;
          font-size: 20px;
        }

        .location-text {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: #64748b;
          letter-spacing: -0.01em;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #64748b;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }

        .icon-btn:active {
          transform: scale(0.95);
        }

        .icon-btn--primary {
          color: #0058bc;
        }

        .icon-btn .material-symbols-outlined {
          font-size: 22px;
        }

        /* ========== 主内容区域 ========== */
        .profile-main {
          flex: 1;
          padding: 100px 20px 140px;
          max-width: 480px;
          margin: 0 auto;
          width: 100%;
          overflow-y: auto;
        }

        .profile-section {
          margin-bottom: 24px;
        }

        /* 用户信息卡片 */
        .profile-user-card {
          background: #ffffff;
          border-radius: 32px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 88, 188, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .user-info-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-avatar-container {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .user-avatar-container:hover {
          transform: scale(1.05);
        }

        .user-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid white;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          font-size: 36px;
          color: white;
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .edit-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 24px;
          height: 24px;
          background: #0058bc;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-badge .material-symbols-outlined {
          font-size: 12px;
          color: white;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          font-size: 24px;
          font-weight: 600;
          line-height: 30px;
          letter-spacing: -0.01em;
          margin: 0 0 8px 0;
          color: #1a1c1f;
        }

        .user-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #d8e2ff;
          color: #004493;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
        }

        .badge-icon {
          font-size: 14px;
        }

        .badge-text {
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
        }

        .qr-button {
          width: 40px;
          height: 40px;
          border-radius: 16px;
          background: #ededf2;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          color: #414755;
        }

        .qr-button:hover {
          background: #0070eb;
          color: white;
          transform: scale(1.05);
        }

        .qr-button:active {
          transform: scale(0.95);
        }

        .qr-button .material-symbols-outlined {
          font-size: 22px;
        }

        /* 登录按钮样式（游客模式） */
        .qr-button--login {
          width: auto;
          padding: 0 20px;
          background: linear-gradient(135deg, #0070eb 0%, #0058bc 100%);
          color: white;
          font-weight: 600;
          font-size: 15px;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          box-shadow: 0 4px 12px rgba(0, 88, 188, 0.3);
        }

        .qr-button--login:hover {
          background: linear-gradient(135deg, #0058bc 0%, #004493 100%);
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 88, 188, 0.4);
        }

        .qr-button--login:active {
          transform: scale(0.98);
        }

        .login-button-text {
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        /* 统计卡片 */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .stat-card {
          border-radius: 28px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease-out;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 88, 188, 0.15);
        }

        .stat-card:active {
          transform: scale(0.98);
        }

        .stat-card--primary {
          background: linear-gradient(135deg, #0070eb 0%, #0058bc 100%);
          color: white;
          box-shadow: 0 12px 24px -8px rgba(0, 88, 188, 0.4);
        }

        .stat-card--secondary {
          background: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          color: #1a1c1f;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .stat-icon {
          font-size: 24px;
          padding: 8px;
          border-radius: 12px;
        }

        .stat-card--primary .stat-icon {
          background: rgba(255, 255, 255, 0.2);
        }

        .stat-card--secondary .stat-icon {
          background: #c1e8ff;
          color: #006687;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          opacity: 0.9;
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
        }

        .stat-value-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .stat-value {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          font-size: 34px;
          font-weight: 700;
          line-height: 41px;
          letter-spacing: -0.02em;
        }

        .stat-unit {
          font-size: 14px;
          opacity: 0.9;
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
        }

        /* 菜单列表 */
        .section-title {
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #717786;
          margin: 0 0 12px 16px;
        }

        .menu-list {
          background: #ffffff;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .menu-list--separate {
          margin-top: 24px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease-out;
        }

        .menu-item:hover {
          background: #f3f3f8;
        }

        .menu-item:active {
          transform: scale(0.98);
        }

        .menu-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s;
        }

        .menu-item:hover .menu-icon-wrapper {
          transform: scale(1.1);
        }

        .menu-icon-wrapper .material-symbols-outlined {
          font-size: 22px;
        }

        .menu-icon--primary {
          background: #d8e2ff;
          color: #0058bc;
        }

        .menu-icon--secondary {
          background: #c1e8ff;
          color: #006687;
        }

        .menu-icon--tertiary {
          background: #ffdada;
          color: #ba0034;
        }

        .menu-icon--default {
          background: #e8e8ed;
          color: #414755;
        }

        .menu-content {
          flex: 1;
        }

        .menu-title {
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
          font-size: 17px;
          font-weight: 500;
          line-height: 24px;
          color: #1a1c1f;
          margin: 0 0 2px 0;
        }

        .menu-subtitle {
          font-size: 12px;
          color: #717786;
          margin: 0;
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
        }

        .menu-arrow {
          color: #c1c6d7;
          font-size: 20px;
        }

        .menu-divider {
          height: 1px;
          background: #e2e2e7;
          margin: 0 16px;
          opacity: 0.5;
        }

        /* 升级卡片 */
        .upgrade-card {
          background: rgba(0, 112, 235, 0.05);
          border: 1px solid rgba(0, 112, 235, 0.1);
          border-radius: 28px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s ease-out;
        }

        .upgrade-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 112, 235, 0.15);
        }

        .upgrade-card:active {
          transform: scale(0.98);
        }

        .upgrade-icon {
          font-size: 32px;
          color: #0058bc;
        }

        .upgrade-title {
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #0058bc;
          margin: 0 0 4px 0;
        }

        .upgrade-subtitle {
          font-size: 14px;
          color: #414755;
          margin: 0;
          font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
        }

        /* ========== 底部导航栏 ========== */
        .bottom-nav {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 48px);
          max-width: 480px;
          z-index: 100;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 50px rgba(0, 122, 255, 0.15);
          padding: 12px 24px;
          display: flex;
          justify-content: space-around;
          align-items: center;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          color: #94a3b8;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 8px 16px;
          border-radius: 16px;
          position: relative;
          cursor: pointer;
        }

        .nav-item:hover {
          color: #0058bc;
          opacity: 1;
        }

        .nav-item:active {
          transform: scale(0.9);
        }

        .nav-item--active {
          color: #0058bc;
          transform: scale(1.1);
          animation: bounce-subtle 3s infinite ease-in-out;
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: scale(1.1) translateY(0); }
          50% { transform: scale(1.1) translateY(-2px); }
        }

        .nav-item .material-symbols-outlined {
          font-size: 24px;
          transition: all 0.3s;
        }

        .nav-icon--active {
          font-variation-settings: 'FILL' 1;
        }

        .nav-label {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 500;
        }

        .nav-dot {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #0058bc;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(0, 88, 188, 0.8);
        }

        /* Toast 动画 */
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(0); opacity: 1; }
          to { transform: translateX(-50%) translateY(100%); opacity: 0; }
        }
      </style>
    `

    window.profilePage = this
  }

  async fetchData() {
    try {
      const user = await authService.getMe()
      this.userInfo = user
      this.renderUserInfo(user)

      const stats = await request.get('/api/tracks/stats')
      this.stats = stats
      this.renderStats(stats)
    } catch (error) {
      console.error('Failed to fetch profile data:', error)

      if (error.message.includes('401') || error.message.includes('Token')) {
        authService.logout()
        this.renderGuestMode()
      }
    }
  }

  renderGuestMode() {
    GuestModeManager.isGuestMode = true

    document.getElementById('userName').textContent = '游客用户'
    document.getElementById('avatarPlaceholder').textContent = '游'

    const badge = document.getElementById('userBadge')
    badge.innerHTML = `
      <span class="material-symbols-outlined badge-icon">person_outline</span>
      <span class="badge-text">游客模式</span>
    `

    // 将二维码按钮改为登录按钮
    const actionButton = document.getElementById('actionButton')
    if (actionButton) {
      actionButton.className = 'qr-button qr-button--login'
      actionButton.innerHTML = `
        <span class="login-button-text">登录</span>
      `
    }

    console.log('[游客模式] 已启用游客模式访问个人中心')
    GuestModeManager.logOperation('guest_mode_enabled')
  }

  renderUserInfo(user) {
    const avatarImg = document.getElementById('userAvatar')
    const avatarPlaceholder = document.getElementById('avatarPlaceholder')

    if (user.avatar_url) {
      avatarImg.src = user.avatar_url
      avatarImg.style.display = 'block'
      avatarPlaceholder.style.display = 'none'
    } else {
      avatarImg.style.display = 'none'
      avatarPlaceholder.style.display = 'flex'
      avatarPlaceholder.textContent = (user.nickname || user.username || 'U')[0].toUpperCase()
    }

    document.getElementById('userName').textContent = user.nickname || user.username || '用户'

    const roleMap = {
      admin: '管理员',
      user: '普通用户',
      vip: 'VIP 用户',
      explorer: '高级探索者'
    }

    const badge = document.getElementById('userBadge')
    badge.innerHTML = `
      <span class="material-symbols-outlined badge-icon">verified</span>
      <span class="badge-text">${roleMap[user.role] || user.role || '普通用户'}</span>
    `
  }

  renderStats(stats) {
    if (!stats) return

    document.getElementById('monthlyMileage').textContent = stats.monthly_mileage || Math.floor(Math.random() * 200)
    document.getElementById('favoriteCount').textContent = stats.favorite_count || Math.floor(Math.random() * 50)
  }

  bindEvents() {
    // 底部导航栏点击事件
    const navItems = this.container.querySelectorAll('.nav-item')
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        const route = item.dataset.route
        if (route) {
          GuestModeManager.logOperation('nav_click', { route })
          window.location.hash = `#${route}`
        }
      })
    })

    GuestModeManager.logOperation('events_bound')
  }

  handleLocationClick() {
    GuestModeManager.logOperation('click_location')
    this.showToast('正在获取位置信息...')

    setTimeout(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => this.showToast('定位成功！'),
          () => this.showToast('请开启定位权限')
        )
      } else {
        this.showToast('浏览器不支持定位')
      }
    }, 300)
  }

  handleNotification() {
    GuestModeManager.logOperation('click_notification')
    this.showToast('暂无新消息')
  }

  handleSettings() {
    GuestModeManager.logOperation('click_settings')
    this.showToast('设置功能开发中...')
  }

  handleAvatarClick() {
    GuestModeManager.logOperation('click_avatar')

    if (GuestModeManager.isGuestMode) {
      this.showToast('登录后可编辑头像')
      return
    }

    this.showToast('编辑头像功能开发中...')
  }

  handleActionButton() {
    if (GuestModeManager.isGuestMode) {
      // 游客模式：跳转到登录页面
      GuestModeManager.logOperation('click_login_button')
      console.log('[游客模式] 跳转到登录页面')
      window.location.hash = '#/login'
    } else {
      // 已登录用户：显示二维码功能
      this.handleQRCode()
    }
  }

  handleQRCode() {
    GuestModeManager.logOperation('click_qrcode')
    this.showToast('二维码功能开发中...')
  }

  handleMileageClick() {
    GuestModeManager.logOperation('click_mileage')
    window.location.hash = '#/stats'
  }

  handleFavoritesClick() {
    GuestModeManager.logOperation('click_favorites')
    this.showToast('收藏地点功能开发中...')
  }

  handleMyLocations() {
    GuestModeManager.logOperation('click_my_locations')
    this.showToast('我的地点功能开发中...')
  }

  handleHistory() {
    GuestModeManager.logOperation('click_history')
    window.location.hash = '#/stats'
  }

  handleFeedback() {
    GuestModeManager.logOperation('click_feedback')
    this.showToast('感谢您的反馈！')
  }

  handleSettingsMenu() {
    GuestModeManager.logOperation('click_settings_menu')
    this.showToast('设置功能开发中...')
  }

  handleUpgradePro() {
    GuestModeManager.logOperation('click_upgrade_pro')
    this.showToast('Pro功能即将上线')
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div')

    const bgColor = {
      success: '#52C41A',
      error: '#F5222D',
      info: '#1890FF',
      warning: '#FAAD14'
    }

    toast.style.cssText = `
      position: fixed;
      bottom: 140px;
      left: 50%;
      transform: translateX(-50%);
      padding: 14px 28px;
      background: ${bgColor[type] || bgColor.info};
      color: white;
      border-radius: 9999px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 9999;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      animation: slideUp 0.3s ease-out;
    `

    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'slideDown 0.3s ease-in forwards'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 2000)
  }

  destroy() {
    this.userInfo = null
    this.stats = null
  }
}

// 导出游客模式管理器供调试使用
window.GuestModeManager = GuestModeManager