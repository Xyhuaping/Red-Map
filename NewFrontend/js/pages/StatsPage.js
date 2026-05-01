import request from '../utils/request.js'

const MOCK_DATA = {
  stats: {
    total_visits: 128,
    unique_figures: 18,
    total_duration: 8475,
    total_rounds: 256,
    today_visits: 12,
    week_visits: 45
  },
  tracks: [
    {
      id: 'track-001',
      figure_name: '毛泽东故居',
      triggered_at: '2026-04-24T10:30:00',
      interaction_duration: 15,
      conversation_rounds: 8
    },
    {
      id: 'track-002',
      figure_name: '周恩来纪念馆',
      triggered_at: '2026-04-23T14:20:00',
      interaction_duration: 22,
      conversation_rounds: 12
    },
    {
      id: 'track-003',
      figure_name: '刘少奇同志纪念馆',
      triggered_at: '2026-04-22T09:15:00',
      interaction_duration: 18,
      conversation_rounds: 9
    },
    {
      id: 'track-004',
      figure_name: '朱德总司令旧居',
      triggered_at: '2026-04-21T16:45:00',
      interaction_duration: 25,
      conversation_rounds: 15
    },
    {
      id: 'track-005',
      figure_name: '邓小平生平展览馆',
      triggered_at: '2026-04-20T11:00:00',
      interaction_duration: 30,
      conversation_rounds: 18
    },
    {
      id: 'track-006',
      figure_name: '陈云纪念馆',
      triggered_at: '2026-04-19T13:30:00',
      interaction_duration: 20,
      conversation_rounds: 11
    },
    {
      id: 'track-007',
      figure_name: '胡耀邦同志纪念馆',
      triggered_at: '2026-04-18T15:10:00',
      interaction_duration: 17,
      conversation_rounds: 10
    },
    {
      id: 'track-008',
      figure_name: '李先念纪念园',
      triggered_at: '2026-04-17T10:45:00',
      interaction_duration: 28,
      conversation_rounds: 14
    }
  ]
}

export default class StatsPage {
  constructor(container) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.stats = null
    this.tracks = []
    this.animationFrame = null

    this.init()
  }

  async init() {
    try {
      await this.render()
      await this.fetchData()
      this.bindEvents()
      this.animatePageEntry()
    } catch (error) {
      console.error('Failed to initialize stats page:', error)
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="stats-page-wrapper">
        <!-- Page Transition Overlay -->
        <div class="page-transition-overlay" id="page-transition"></div>
        
        <!-- TopAppBar -->
        <header class="top-app-bar">
          <div class="top-app-bar-left">
            <span class="material-symbols-outlined top-app-bar-icon">location_on</span>
            <h1 class="top-app-bar-title">北京市</h1>
          </div>
          <div class="top-app-bar-right">
            <button class="icon-button" id="notify-btn" aria-label="通知">
              <span class="material-symbols-outlined">notifications</span>
            </button>
            <div class="avatar-container">
              <img class="avatar-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYK1bKPoMj5ByW9Fyv43vQC8m3W-8ZZe9o7U8T15sIxSOUSJj85Zy_dOE9HX2nS733DTyC6qk3eB3f3gfpcFgfQSB-hgDRQiLz5ipeUvztCoM38agffuilRoJjebmqj1JOwW-1MTa7huptjEMFhSw0EshtZREb7tJ4J4ZBbyzew1iWYsBQkekPRuwkG18NRwIcx2XspBhlLyIC5zmzeavPhteyLfVk_HV6fLDD3b3PDR-YefJ6k55Buk7xDCgaK_UdxW0Ym_KRKQ" alt="用户头像" />
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="stats-main-content">
          <!-- Header Section -->
          <section class="stats-header-section">
            <h2 class="stats-title">活动统计</h2>
            <p class="stats-subtitle">查看您在红色文化AR游览中的探索历程</p>
          </section>

          <!-- High-level Stats Bento Grid -->
          <section class="stats-grid" id="stats-cards"></section>

          <!-- Recent Tracks Section -->
          <section class="tracks-section">
            <div class="tracks-header">
              <h3 class="tracks-title">最近轨迹</h3>
              <button class="view-all-button">全部</button>
            </div>
            <div class="tracks-list" id="tracks-list"></div>
          </section>
        </main>

        <!-- Bottom Navigation Bar -->
        <nav class="bottom-nav">
          <a class="bottom-nav-item" href="#/" data-route="/">
            <span class="material-symbols-outlined bottom-nav-icon">home</span>
            <span class="bottom-nav-label">首页</span>
          </a>
          <a class="bottom-nav-item bottom-nav-item--active" href="#/stats" data-route="/stats">
            <span class="material-symbols-outlined bottom-nav-icon bottom-nav-icon--active" style="font-variation-settings: 'FILL' 1;">bar_chart</span>
            <span class="bottom-nav-label">统计</span>
          </a>
          <a class="bottom-nav-item" href="#/profile" data-route="/profile">
            <span class="material-symbols-outlined bottom-nav-icon">person</span>
            <span class="bottom-nav-label">我的</span>
          </a>
        </nav>

        <!-- FAB for quick action -->
        <button class="fab-button" id="fab-add" aria-label="添加">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    `
    
    this.injectStyles()
  }

  injectStyles() {
    if (document.getElementById('stats-page-styles')) return
    
    const styleSheet = document.createElement('style')
    styleSheet.id = 'stats-page-styles'
    styleSheet.textContent = `
      .stats-page-wrapper {
        min-height: 100vh;
        background: #f9f9fe;
        font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
        position: relative;
        overflow-x: hidden;
      }

      /* Page Transition */
      .page-transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0070eb 0%, #60cdff 100%);
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .page-transition-overlay.active {
        opacity: 1;
      }

      .page-transition-overlay.exit {
        animation: fadeOutSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      @keyframes fadeOutSlide {
        0% {
          opacity: 1;
          transform: translateY(0);
        }
        100% {
          opacity: 0;
          transform: translateY(-20px);
        }
      }

      /* Staggered Animation for Content */
      .animate-in {
        animation: slideUpFade 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        opacity: 0;
      }

      @keyframes slideUpFade {
        0% {
          opacity: 0;
          transform: translateY(30px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .delay-1 { animation-delay: 0.1s; }
      .delay-2 { animation-delay: 0.2s; }
      .delay-3 { animation-delay: 0.3s; }
      .delay-4 { animation-delay: 0.4s; }
      .delay-5 { animation-delay: 0.5s; }
      .delay-6 { animation-delay: 0.6s; }

      /* TopAppBar */
      .top-app-bar {
        position: fixed;
        top: 16px;
        left: 20px;
        right: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        z-index: 50;
        animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      @keyframes slideDown {
        0% {
          opacity: 0;
          transform: translateY(-20px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .top-app-bar-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .top-app-bar-icon {
        color: #0058bc;
        font-size: 20px;
      }

      .top-app-bar-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 700;
        font-size: 16px;
        color: #1a1c1f;
        letter-spacing: -0.02em;
      }

      .top-app-bar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .icon-button {
        padding: 8px;
        border-radius: 50%;
        border: none;
        background: transparent;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-button:hover {
        background: rgba(255, 255, 255, 0.4);
      }

      .icon-button:active {
        transform: scale(0.95);
      }

      .icon-button .material-symbols-outlined {
        color: #717786;
        font-size: 20px;
      }

      .avatar-container {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid #0070eb;
      }

      .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* Main Content */
      .stats-main-content {
        padding: 112px 20px 140px;
        max-width: 480px;
        margin: 0 auto;
      }

      /* Header Section */
      .stats-header-section {
        margin-bottom: 24px;
        animation: slideUpFade 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        animation-delay: 0.05s;
        opacity: 0;
      }

      .stats-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 34px;
        font-weight: 700;
        line-height: 41px;
        letter-spacing: -0.02em;
        color: #1a1c1f;
        margin: 0 0 8px 0;
      }

      .stats-subtitle {
        font-size: 14px;
        line-height: 20px;
        color: #414755;
        margin: 0;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }

      /* Glass Card */
      .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(0, 88, 188, 0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .glass-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--card-accent-start, #0058bc), var(--card-accent-end, #60cdff));
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .glass-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 88, 188, 0.25);
      }

      .glass-card:hover::before {
        opacity: 1;
      }

      .glass-card-primary { --card-accent-start: #0058bc; --card-accent-end: #60cdff; }
      .glass-card-info { --card-accent-start: #006687; --card-accent-end: #60cdff; }
      .glass-card-success { --card-accent-start: #52c41a; --card-accent-end: #95de64; }
      .glass-card-warning { --card-accent-start: #faad14; --card-accent-end: #ffc53d; }

      .stat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .stat-card-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .stat-card-icon-primary {
        background: #d8e2ff;
        color: #0058bc;
      }

      .stat-card-icon-info {
        background: #c1e8ff;
        color: #006687;
      }

      .stat-card-icon-success {
        background: #f6ffed;
        color: #52c41a;
      }

      .stat-card-icon-warning {
        background: #fffbe6;
        color: #faad14;
      }

      .stat-card-badge {
        font-family: 'Be Vietnam Pro', sans-serif;
        font-size: 12px;
        font-weight: 600;
        line-height: 16px;
        letter-spacing: 0.05em;
        padding: 2px 8px;
        border-radius: 9999px;
      }

      .stat-card-badge-primary {
        color: #0058bc;
        background: #d8e2ff;
      }

      .stat-card-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-card-label {
        font-family: 'Be Vietnam Pro', sans-serif;
        font-size: 12px;
        font-weight: 600;
        line-height: 16px;
        letter-spacing: 0.05em;
        color: #414755;
      }

      .stat-card-value {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 24px;
        font-weight: 600;
        line-height: 30px;
        letter-spacing: -0.01em;
        color: #1a1c1f;
      }

      /* Tracks Section */
      .tracks-section {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 20px rgba(0, 88, 188, 0.15);
        animation: slideUpFade 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        animation-delay: 0.7s;
        opacity: 0;
      }

      .tracks-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .tracks-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 24px;
        font-weight: 600;
        line-height: 30px;
        letter-spacing: -0.01em;
        color: #1a1c1f;
        margin: 0;
      }

      .view-all-button {
        font-family: 'Be Vietnam Pro', sans-serif;
        font-size: 12px;
        font-weight: 600;
        line-height: 16px;
        letter-spacing: 0.05em;
        color: #0058bc;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .view-all-button:hover {
        background: #d8e2ff;
      }

      .tracks-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .track-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        border: 1px solid #ededf2;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .track-item:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 88, 188, 0.1);
        border-color: #d8e2ff;
      }

      .track-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;
      }

      .track-figure {
        font-size: 17px;
        font-weight: 600;
        line-height: 24px;
        color: #1a1c1f;
      }

      .track-time {
        font-size: 14px;
        line-height: 20px;
        color: #414755;
      }

      .track-stats {
        display: flex;
        gap: 12px;
        font-size: 14px;
        color: #414755;
        white-space: nowrap;
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: #717786;
      }

      .empty-state-text {
        font-size: 14px;
        line-height: 20px;
      }

      /* Bottom Navigation */
      .bottom-nav {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 48px);
        max-width: 448px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        border-radius: 28px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 20px 50px rgba(0, 122, 255, 0.15);
        z-index: 50;
        animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        animation-delay: 0.3s;
        opacity: 0;
      }

      @keyframes slideUp {
        0% {
          opacity: 0;
          transform: translateX(-50%) translateY(20px);
        }
        100% {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      .bottom-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        text-decoration: none;
        color: #94a3b8;
        opacity: 0.8;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 4px 12px;
        border-radius: 12px;
      }

      .bottom-nav-item:hover {
        opacity: 1;
      }

      .bottom-nav-item--active {
        color: #0058bc;
        opacity: 1;
        transform: scale(1.1);
      }

      .bottom-nav-item--active .bottom-nav-icon {
        animation: bounceSubtle 2s infinite;
      }

      @keyframes bounceSubtle {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }

      .bottom-nav-icon {
        font-size: 22px;
        transition: all 0.3s ease;
      }

      .bottom-nav-icon--active {
        font-size: 24px;
      }

      .bottom-nav-label {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 500;
        font-size: 11px;
      }

      /* FAB Button */
      .fab-button {
        position: fixed;
        right: 24px;
        bottom: 128px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0070eb 0%, #60cdff 100%);
        border: none;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 8px 25px rgba(0, 112, 235, 0.4);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 45;
        animation: scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        animation-delay: 0.5s;
        opacity: 0;
      }

      @keyframes scaleIn {
        0% {
          opacity: 0;
          transform: scale(0.5);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .fab-button:hover {
        transform: scale(1.1);
        box-shadow: 0 12px 35px rgba(0, 112, 235, 0.5);
      }

      .fab-button:active {
        transform: scale(0.9);
      }

      .fab-button .material-symbols-outlined {
        font-size: 24px;
      }

      /* Responsive Adjustments */
      @media (max-width: 380px) {
        .stats-main-content {
          padding-left: 16px;
          padding-right: 16px;
        }

        .stats-title {
          font-size: 28px;
          line-height: 36px;
        }

        .stats-grid {
          gap: 8px;
        }

        .glass-card {
          padding: 12px;
        }

        .stat-card-value {
          font-size: 20px;
        }
      }

      /* Loading Skeleton */
      .skeleton {
        background: linear-gradient(90deg, #ededf2 25%, #f3f3f8 50%, #ededf2 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .skeleton-text {
        height: 16px;
        margin-bottom: 8px;
      }

      .skeleton-value {
        height: 28px;
        width: 80px;
      }
    `
    
    document.head.appendChild(styleSheet)
  }

  async fetchData() {
    let useMockData = false
    
    try {
      const stats = await request.get('/api/tracks/stats')
      this.stats = stats
      this.renderStatsCards()

      const tracks = await request.get('/api/tracks/my', { page: 1, page_size: 10 })
      this.tracks = tracks?.items || []
      this.renderTracksList()
    } catch (error) {
      console.warn('[StatsPage] API request failed, using mock data:', error.message)
      useMockData = true
    }

    if (useMockData || !this.stats) {
      console.log('[StatsPage] Loading mock data for development/testing')
      this.stats = MOCK_DATA.stats
      this.tracks = MOCK_DATA.tracks
      this.renderStatsCards()
      this.renderTracksList()
    }
  }

  renderStatsCards() {
    const cardsContainer = document.getElementById('stats-cards')
    
    if (!cardsContainer || !this.stats) return

    const cardsData = [
      { 
        icon: '<span class="material-symbols-outlined">route</span>', 
        label: '总访问次数', 
        value: this.stats.total_visits || 0, 
        color: 'primary',
        badge: '+12%',
        badgeType: 'primary'
      },
      { 
        icon: '<span class="material-symbols-outlined">group</span>', 
        label: '访问景点数', 
        value: this.stats.unique_figures || 0, 
        color: 'info',
        badge: 'New',
        badgeType: 'tertiary'
      },
      { 
        icon: '<span class="material-symbols-outlined">schedule</span>', 
        label: '总交互时长(分钟)', 
        value: Math.round((this.stats.total_duration || 0) / 60), 
        color: 'success',
        badge: null,
        badgeType: null
      },
      { 
        icon: '<span class="material-symbols-outlined">forum</span>', 
        label: '对话轮次', 
        value: this.stats.total_rounds || 0, 
        color: 'warning',
        badge: '+8%',
        badgeType: 'primary'
      },
      { 
        icon: '<span class="material-symbols-outlined">today</span>', 
        label: '今日访问', 
        value: this.stats.today_visits || 0, 
        color: 'primary',
        badge: null,
        badgeType: null
      },
      { 
        icon: '<span class="material-symbols-outlined">date_range</span>', 
        label: '本周访问', 
        value: this.stats.week_visits || 0, 
        color: 'info',
        badge: null,
        badgeType: null
      }
    ]

    cardsContainer.innerHTML = ''
    
    cardsData.forEach((data, index) => {
      const cardElement = document.createElement('div')
      cardElement.className = `glass-card glass-card-${data.color} animate-in delay-${index + 1}`
      cardElement.innerHTML = `
        <div class="stat-card-header">
          <div class="stat-card-icon stat-card-icon-${data.color}">
            ${data.icon}
          </div>
          ${data.badge ? `
            <span class="stat-card-badge stat-card-badge-${data.badgeType || data.color}">${data.badge}</span>
          ` : ''}
        </div>
        <div class="stat-card-body">
          <span class="stat-card-label">${this.escapeHtml(data.label)}</span>
          <span class="stat-card-value">${this.formatValue(data.value)}</span>
        </div>
      `
      cardsContainer.appendChild(cardElement)
    })
  }

  renderTracksList() {
    const tracksContainer = document.getElementById('tracks-list')
    
    if (!tracksContainer) return

    if (!this.tracks || this.tracks.length === 0) {
      tracksContainer.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">暂无轨迹记录</p>
        </div>
      `
      return
    }

    tracksContainer.innerHTML = this.tracks.map((track, index) => `
      <div class="track-item animate-in delay-${Math.min(index + 4, 6)}" data-track-id="${track.id}">
        <div class="track-info">
          <span class="track-figure">${this.escapeHtml(track.figure_name || '未知')}</span>
          <span class="track-time">${this.formatDate(track.triggered_at)}</span>
        </div>
        <div class="track-stats">
          <span>⏱️ ${track.interaction_duration || 0}分钟</span>
          <span>💬 ${track.conversation_rounds || 0}轮</span>
        </div>
      </div>
    `).join('')
  }

  bindEvents() {
    // Bottom Navigation
    const navItems = this.container.querySelectorAll('.bottom-nav-item')
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        const route = item.dataset.route
        if (route) {
          this.animatePageExit(() => {
            window.location.hash = `#${route}`
          })
        }
      })
    })

    // Track Items
    const trackItems = this.container.querySelectorAll('.track-item')
    trackItems.forEach(item => {
      item.addEventListener('click', () => {
        const trackId = item.dataset.trackId
        console.log('Track clicked:', trackId)
        // Can navigate to detail view in future
      })
    })

    // Notification Button
    const notifyBtn = document.getElementById('notify-btn')
    if (notifyBtn) {
      notifyBtn.addEventListener('click', () => {
        this.showToast('通知中心开发中...', 'info')
      })
    }

    // FAB Button
    const fabBtn = document.getElementById('fab-add')
    if (fabBtn) {
      fabBtn.addEventListener('click', () => {
        this.showToast('快速操作开发中...', 'info')
      })
    }

    // View All Button
    const viewAllBtn = this.container.querySelector('.view-all-button')
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.showToast('查看全部轨迹功能开发中...', 'info')
      })
    }
  }

  animatePageEntry() {
    const overlay = document.getElementById('page-transition')
    if (overlay) {
      overlay.classList.add('active')
      
      setTimeout(() => {
        overlay.classList.remove('active')
      }, 300)
    }
  }

  animatePageExit(callback) {
    const overlay = document.getElementById('page-transition')
    if (overlay) {
      overlay.classList.add('exit')
      
      setTimeout(() => {
        if (callback) callback()
      }, 400)
    } else {
      if (callback) callback()
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return ''
    
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return dateStr
    }
  }

  formatValue(value) {
    if (typeof value === 'number') {
      return value.toLocaleString('zh-CN')
    }
    
    return String(value || 0)
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    const bgColor = type === 'success' ? '#52c41a' : type === 'error' ? '#ba1a1a' : '#0058bc'
    
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(-10px);
      padding: 12px 24px;
      background: ${bgColor};
      color: white;
      border-radius: 12px;
      font-family: 'Be Vietnam Pro', sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      opacity: 0;
      animation: toastIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    `
    toast.textContent = message

    // Add toast animation styles
    if (!document.getElementById('toast-animations')) {
      const toastStyle = document.createElement('style')
      toastStyle.id = 'toast-animations'
      toastStyle.textContent = `
        @keyframes toastIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes toastOut {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
        }
      `
      document.head.appendChild(toastStyle)
    }

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast)
        }
      }, 300)
    }, 2500)
  }

  showError() {
    const cardsContainer = document.getElementById('stats-cards')
    
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="glass-card" style="grid-column: span 2;">
          <p style="color: #ba1a1a; text-align: center; font-size: 14px;">加载失败，请稍后重试</p>
        </div>
      `
    }
  }

  escapeHtml(str) {
    if (!str) return ''
    
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }

    return str.replace(/[&<>"']/g, char => escapeMap[char])
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    
    this.stats = null
    this.tracks = []
    
    // Remove injected styles when page is destroyed
    const styles = document.getElementById('stats-page-styles')
    if (styles) {
      styles.remove()
    }
    
    const toastStyles = document.getElementById('toast-animations')
    if (toastStyles) {
      toastStyles.remove()
    }
  }
}
