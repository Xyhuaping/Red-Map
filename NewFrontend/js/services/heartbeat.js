import locationService from '../utils/location.js'
import fenceService from '../utils/fence.js'
import fencesService from './fences.js'
import notificationService from './notification.js'
import { mapStore, userStore } from '../store/index.js'
import storage from '../utils/storage.js'

class HeartbeatService {
  constructor() {
    this.isRunning = false
    this.timerId = null
    this.intervalMs = 15000
    this.cooldownMs = 5 * 60 * 1000
    this.syncIntervalMs = 30 * 60 * 1000
    this.syncTimerId = null
    this.cachedFences = []
    this.triggerHistory = new Map()
    this.popup = null
    this._loadTriggerHistory()
    this._bindVisibilityChange()
  }

  async start() {
    if (this.isRunning) return

    this.isRunning = true
    mapStore.setHeartbeatRunning(true)

    await this.syncFences()

    this._heartbeatTick()

    this.syncTimerId = setInterval(() => {
      this.syncFences()
    }, this.syncIntervalMs)

    console.log('[Heartbeat] 服务已启动')
  }

  stop() {
    this.isRunning = false
    mapStore.setHeartbeatRunning(false)

    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }

    if (this.syncTimerId) {
      clearInterval(this.syncTimerId)
      this.syncTimerId = null
    }

    console.log('[Heartbeat] 服务已停止')
  }

  async syncFences() {
    try {
      const fences = await fencesService.getActiveFences()
      this.cachedFences = fences || []
      storage.set('cached_fences', this.cachedFences)
    } catch (e) {
      console.warn('[Heartbeat] 同步围栏失败，使用缓存:', e)
      this.cachedFences = storage.get('cached_fences', [])
    }
  }

  async _heartbeatTick() {
    if (!this.isRunning) return

    try {
      const location = await locationService.getCurrentLocation({
        enableHighAccuracy: true,
        fallbackToDefault: false,
        fallbackToBrowser: true
      })

      if (!location || !location.lng) {
        this._scheduleNextTick()
        return
      }

      mapStore.setLocation(location)
      mapStore.setLastHeartbeatTime(Date.now())

      const point = { lng: location.lng, lat: location.lat }
      const triggered = fenceService.findTriggeredFences(point, this.cachedFences)

      if (triggered.length === 0) {
        this._scheduleNextTick()
        return
      }

      const result = await fencesService.checkFence(point.lng, point.lat)
      if (!result || !result.triggered) {
        this._scheduleNextTick()
        return
      }

      const fence = result.fence
      const figure = result.figure

      if (!this._checkCooldown(fence.id)) {
        this._scheduleNextTick()
        return
      }

      this._handleTrigger(fence, figure)
    } catch (e) {
      console.warn('[Heartbeat] tick 失败:', e)
    }

    this._scheduleNextTick()
  }

  _scheduleNextTick() {
    if (!this.isRunning) return
    this.timerId = setTimeout(() => {
      this._heartbeatTick()
    }, this.intervalMs)
  }

  _checkCooldown(fenceId) {
    const lastTime = this.triggerHistory.get(fenceId)
    if (!lastTime) return true
    return Date.now() - lastTime >= this.cooldownMs
  }

  _recordTrigger(fenceId) {
    this.triggerHistory.set(fenceId, Date.now())
    const history = Object.fromEntries(this.triggerHistory)
    storage.set('trigger_history', history)
  }

  _loadTriggerHistory() {
    const history = storage.get('trigger_history') || {}
    if (typeof history !== 'object' || history === null) return
    for (const [fenceId, timestamp] of Object.entries(history)) {
      if (Date.now() - timestamp < this.cooldownMs) {
        this.triggerHistory.set(fenceId, timestamp)
      }
    }
  }

  _handleTrigger(fence, figure) {
    this._recordTrigger(fence.id)

    if (this._isAppForeground()) {
      this._showFencePopup(fence, figure)
    } else {
      this._showNotification(fence, figure)
    }

    this._recordTriggerToBackend(fence.id, figure?.id)
  }

  _isAppForeground() {
    return document.visibilityState === 'visible'
  }

  _bindVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isRunning) {
        this._heartbeatTick()
      }
    })
  }

  _showFencePopup(fence, figure) {
    if (this.popup && typeof this.popup.show === 'function') {
      this.popup.show({ fence, figure })
    }
  }

  async _showNotification(fence, figure) {
    await notificationService.scheduleNotification({
      title: `发现红色文化景点：${figure?.name || fence.name}`,
      body: fence.trigger_prompt || '您已进入景点区域，点击了解更多',
      id: fence.id,
      extra: {
        fenceId: fence.id,
        figureId: figure?.id,
        type: 'fence_trigger'
      }
    })
  }

  async _recordTriggerToBackend(fenceId, figureId) {
    try {
      if (!userStore.state.isLoggedIn) return

      const location = mapStore.state.currentLocation
      await fencesService.recordTrigger({
        fence_id: fenceId,
        figure_id: figureId || null,
        trigger_type: 'heartbeat',
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        is_notified: !this._isAppForeground()
      })
    } catch (e) {
      console.warn('[Heartbeat] 上报触发记录失败:', e)
    }
  }

  setPopup(popupInstance) {
    this.popup = popupInstance
  }

  destroy() {
    this.stop()
    this.popup = null
  }
}

const heartbeatService = new HeartbeatService()
export default heartbeatService
export { HeartbeatService }
