import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../components/AdminLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' },
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('../views/UserList.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'figures',
        name: 'FigureList',
        component: () => import('../views/FigureList.vue'),
        meta: { title: '人物管理', icon: 'Avatar' },
      },
      {
        path: 'figures/create',
        name: 'FigureCreate',
        component: () => import('../views/FigureEdit.vue'),
        meta: { title: '新建人物', hidden: true },
      },
      {
        path: 'figures/:id',
        name: 'FigureEdit',
        component: () => import('../views/FigureEdit.vue'),
        meta: { title: '编辑人物', hidden: true },
      },
      {
        path: 'fences',
        name: 'FenceList',
        component: () => import('../views/FenceList.vue'),
        meta: { title: '围栏管理', icon: 'Location' },
      },
      {
        path: 'fences/create',
        name: 'FenceCreate',
        component: () => import('../views/FenceEdit.vue'),
        meta: { title: '新建围栏', hidden: true },
      },
      {
        path: 'fences/:id',
        name: 'FenceEdit',
        component: () => import('../views/FenceEdit.vue'),
        meta: { title: '编辑围栏', hidden: true },
      },
      {
        path: 'fences/map',
        name: 'FenceMap',
        component: () => import('../views/FenceMap.vue'),
        meta: { title: '围栏地图', hidden: true },
      },
      {
        path: 'tracks',
        name: 'TrackList',
        component: () => import('../views/TrackList.vue'),
        meta: { title: '轨迹管理', icon: 'MapLocation' },
      },
      {
        path: 'conversations',
        name: 'ConversationList',
        component: () => import('../views/ConversationList.vue'),
        meta: { title: '对话记录', icon: 'ChatDotRound' },
      },
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('../views/SystemConfig.vue'),
        meta: { title: '系统配置', icon: 'Setting' },
      },
      {
        path: 'logs',
        name: 'AdminLogList',
        component: () => import('../views/AdminLogList.vue'),
        meta: { title: '操作日志', icon: 'Document' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
