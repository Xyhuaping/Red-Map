import { HashRouter } from './utils/router.js'
import authService from './services/auth.js'
import IndexPage from './pages/IndexPage.js'
import LoginPage from './pages/LoginPage.js'
import MapPage from './pages/MapPage.js'
import FiguresPage from './pages/FiguresPage.js'
import ChatPage from './pages/ChatPage.js'
import StatsPage from './pages/StatsPage.js'
import ProfilePage from './pages/ProfilePage.js'

const appContainer = document.getElementById('app')

if (!appContainer) {
  console.error('App container not found')
}

const router = new HashRouter()

const publicRoutes = ['/', '/login', '/stats', '/profile']
const authRequiredRoutes = []

function checkAuth(route) {
  if (authRequiredRoutes.includes(route.path) && !authService.isLoggedIn()) {
    window.location.hash = '#/login'
    return false
  }
  
  return true
}

router.addRoute('/', async () => {
  const page = new IndexPage(appContainer)
})

router.addRoute('/login', async () => {
  const page = new LoginPage(appContainer)
})

router.addRoute('/map', async () => {
  const page = new MapPage(appContainer)
})

router.addRoute('/figures', async () => {
  const page = new FiguresPage(appContainer)
})

router.addRoute('/chat', async (params) => {
  const page = new ChatPage(appContainer, params || {})
})

router.addRoute('/stats', async () => {
  const page = new StatsPage(appContainer)
})

router.addRoute('/profile', async () => {
  const page = new ProfilePage(appContainer)
})

router.beforeEach((to, from) => {
  console.log('[Router] Navigation:', from?.path || '/', '→', to.path)
  
  return checkAuth(to)
})

router.afterEach((route) => {
  document.title = `红色文化AR游览${route.path !== '/' ? ' - ' + getPageTitle(route.path) : ''}`
})

function getPageTitle(path) {
  const titles = {
    '/login': '登录',
    '/map': '围栏地图',
    '/figures': '历史人物',
    '/chat': 'AI 对话',
    '/stats': '活动统计',
    '/profile': '个人中心'
  }
  
  return titles[path] || ''
}

window.addEventListener('DOMContentLoaded', () => {
  window._AMapSecurityConfig = {
    securityJsCode: '94d4378db1ad21baeed37a958a324f6a'
  }

  router.start('/')
})

export { router }
export default router