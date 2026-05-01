class NotificationService {
  constructor() {
    this.initialized = false
    this.listenerSetup = false
  }

  async init() {
    if (this.initialized) return

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      if (!this.listenerSetup) {
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          this._handleNotificationClick(notification)
        })
        this.listenerSetup = true
      }

      this.initialized = true
      console.log('[Notification] 服务已初始化')
    } catch (e) {
      console.warn('[Notification] 初始化失败:', e)
    }
  }

  async requestPermission() {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const result = await LocalNotifications.requestPermissions()
      return result.display === 'granted'
    } catch (e) {
      console.warn('[Notification] 请求权限失败:', e)
      return false
    }
  }

  async checkPermission() {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const result = await LocalNotifications.checkPermissions()
      return result.display === 'granted'
    } catch (e) {
      console.warn('[Notification] 检查权限失败:', e)
      return false
    }
  }

  async scheduleNotification(options) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      if (!this.initialized) {
        await this.init()
      }

      const hasPermission = await this.checkPermission()
      if (!hasPermission) {
        console.warn('[Notification] 无通知权限')
        return false
      }

      await LocalNotifications.schedule({
        notifications: [{
          title: options.title || '红色文化AR游览',
          body: options.body || '',
          id: options.id || Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: options.extra || {}
        }]
      })

      return true
    } catch (e) {
      console.warn('[Notification] 发送通知失败:', e)
      return false
    }
  }

  _handleNotificationClick(notification) {
    const extra = notification.notification?.extra
    if (!extra) return

    if (extra.type === 'fence_trigger') {
      if (extra.figureId) {
        window.location.hash = `#/chat?figureId=${extra.figureId}`
      } else if (extra.fenceId) {
        window.location.hash = '#/map'
      }
    }
  }

  async cancelAll() {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.cancelAll()
    } catch (e) {
      console.warn('[Notification] 取消通知失败:', e)
    }
  }

  async isAvailable() {
    try {
      await import('@capacitor/local-notifications')
      return true
    } catch {
      return false
    }
  }
}

const notificationService = new NotificationService()
export default notificationService
export { NotificationService }
