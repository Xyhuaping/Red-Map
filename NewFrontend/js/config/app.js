const APP_CONFIG = {
  APP_NAME: '红色文化AR游览',
  VERSION: '1.0.0',
  ENVIRONMENT: 'development',
  
  ROUTES: {
    INDEX: '/',
    LOGIN: '/login',
    MAP: '/map',
    FIGURES: '/figures',
    CHAT: '/chat',
    STATS: '/stats',
    PROFILE: '/profile'
  },

  FIGURE_CATEGORIES: [
    { value: '', label: '全部' },
    { value: 'revolutionary', label: '革命先烈' },
    { value: 'martyr', label: '英雄模范' },
    { value: 'leader', label: '革命领袖' },
    { value: 'scientist', label: '科学家' },
    { value: 'artist', label: '艺术家' }
  ],

  FENCE_TYPES: {
    CIRCLE: 'circle',
    POLYGON: 'polygon'
  },

  CHAT_LIMITS: {
    MAX_MESSAGE_LENGTH: 500,
    TYPING_DELAY: 30,
    REFRESH_INTERVAL: 1000
  },

  VALIDATION: {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 6
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
  }
}

export default APP_CONFIG