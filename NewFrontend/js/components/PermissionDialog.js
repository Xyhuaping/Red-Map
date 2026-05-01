import { escapeHtml } from '../utils/helpers.js'
import storage from '../utils/storage.js'

class PermissionDialog {
  constructor() {
    this.container = null
    this._ensureContainer()
  }

  _ensureContainer() {
    this.container = document.getElementById('permission-dialog-root')
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'permission-dialog-root'
      document.body.appendChild(this.container)
    }
  }

  async requestLocationPermission() {
    const dismissed = storage.get('location_permission_dismissed')
    if (dismissed) return false

    return new Promise((resolve) => {
      this._showDialog({
        icon: 'location_on',
        title: '位置权限',
        message: '我们需要获取您的位置，以便在您靠近红色文化景点时及时提醒您。您的位置信息仅用于景点推荐，不会用于其他用途。',
        confirmText: '同意',
        cancelText: '拒绝',
        onConfirm: async () => {
          this.hide()
          try {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                () => resolve(true),
                () => resolve(false)
              )
            } else {
              resolve(false)
            }
          } catch {
            resolve(false)
          }
        },
        onCancel: () => {
          this.hide()
          storage.set('location_permission_dismissed', true)
          resolve(false)
        }
      })
    })
  }

  async requestNotificationPermission() {
    const dismissed = storage.get('notification_permission_dismissed')
    if (dismissed) return false

    try {
      const available = await this._isNotificationAvailable()
      if (!available) return false

      const currentPerm = await this._checkNotificationPermission()
      if (currentPerm === 'granted') return true
      if (currentPerm === 'denied') return false
    } catch {
      return false
    }

    return new Promise((resolve) => {
      this._showDialog({
        icon: 'notifications',
        title: '通知权限',
        message: '允许通知，以便在后台时向您推送景点提醒。您可以在系统设置中随时修改此权限。',
        confirmText: '允许',
        cancelText: '以后再说',
        onConfirm: async () => {
          this.hide()
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications')
            const result = await LocalNotifications.requestPermissions()
            resolve(result.display === 'granted')
          } catch {
            resolve(false)
          }
        },
        onCancel: () => {
          this.hide()
          storage.set('notification_permission_dismissed', true)
          resolve(false)
        }
      })
    })
  }

  async _isNotificationAvailable() {
    try {
      await import('@capacitor/local-notifications')
      return true
    } catch {
      return false
    }
  }

  async _checkNotificationPermission() {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const result = await LocalNotifications.checkPermissions()
      return result.display
    } catch {
      return 'denied'
    }
  }

  _showDialog({ icon, title, message, confirmText, cancelText, onConfirm, onCancel }) {
    this.container.innerHTML = `
      <div class="permission-dialog">
        <div class="permission-dialog__overlay"></div>
        <div class="permission-dialog__content">
          <div class="permission-dialog__icon">
            <span class="material-symbols-outlined">${icon}</span>
          </div>
          <h3 class="permission-dialog__title">${escapeHtml(title)}</h3>
          <p class="permission-dialog__message">${escapeHtml(message)}</p>
          <div class="permission-dialog__actions">
            <button class="permission-dialog__btn permission-dialog__btn--cancel" id="permission-dialog-cancel">
              ${escapeHtml(cancelText)}
            </button>
            <button class="permission-dialog__btn permission-dialog__btn--confirm" id="permission-dialog-confirm">
              ${escapeHtml(confirmText)}
            </button>
          </div>
        </div>
      </div>
    `

    this._injectStyles()
    this._bindDialogEvents(onConfirm, onCancel)

    requestAnimationFrame(() => {
      const dialog = this.container.querySelector('.permission-dialog')
      if (dialog) {
        dialog.classList.add('permission-dialog--visible')
      }
    })
  }

  _bindDialogEvents(onConfirm, onCancel) {
    const confirmBtn = document.getElementById('permission-dialog-confirm')
    const cancelBtn = document.getElementById('permission-dialog-cancel')
    const overlay = this.container.querySelector('.permission-dialog__overlay')

    if (confirmBtn) {
      confirmBtn.addEventListener('click', onConfirm)
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', onCancel)
    }
    if (overlay) {
      overlay.addEventListener('click', onCancel)
    }
  }

  hide() {
    const dialog = this.container.querySelector('.permission-dialog')
    if (dialog) {
      dialog.classList.remove('permission-dialog--visible')
      dialog.classList.add('permission-dialog--hiding')
      setTimeout(() => {
        this.container.innerHTML = ''
      }, 300)
    } else {
      this.container.innerHTML = ''
    }
  }

  _injectStyles() {
    if (document.getElementById('permission-dialog-styles')) return

    const style = document.createElement('style')
    style.id = 'permission-dialog-styles'
    style.textContent = `
      .permission-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: var(--z-index-modal, 500);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

      .permission-dialog__overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        pointer-events: auto;
      }

      .permission-dialog__content {
        position: relative;
        width: calc(100% - var(--spacing-xl, 32px) * 2);
        max-width: 360px;
        background: var(--color-bg-card, #ffffff);
        border-radius: var(--radius-lg, 16px);
        padding: var(--spacing-xl, 32px) var(--spacing-lg, 24px);
        pointer-events: auto;
        transform: scale(0.9);
        opacity: 0;
        transition: all var(--transition-base, 300ms ease-out);
        box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
        text-align: center;
      }

      .permission-dialog--visible .permission-dialog__content {
        transform: scale(1);
        opacity: 1;
      }

      .permission-dialog--hiding .permission-dialog__content {
        transform: scale(0.9);
        opacity: 0;
      }

      .permission-dialog__icon {
        width: 56px;
        height: 56px;
        margin: 0 auto var(--spacing-md, 16px);
        background: var(--color-tertiary, #ba0034);
        border-radius: var(--radius-full, 9999px);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-on-tertiary, #ffffff);
      }

      .permission-dialog__icon .material-symbols-outlined {
        font-size: 28px;
      }

      .permission-dialog__title {
        font-size: var(--font-size-lg, 18px);
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-text-primary, #1a1c1f);
        margin: 0 0 var(--spacing-sm, 12px) 0;
      }

      .permission-dialog__message {
        font-size: var(--font-size-base, 14px);
        color: var(--color-text-secondary, #414755);
        line-height: var(--line-height-base, 1.5);
        margin: 0 0 var(--spacing-lg, 24px) 0;
      }

      .permission-dialog__actions {
        display: flex;
        gap: var(--spacing-sm, 12px);
      }

      .permission-dialog__btn {
        flex: 1;
        padding: var(--spacing-sm, 12px) var(--spacing-md, 16px);
        border: none;
        border-radius: var(--radius-md, 12px);
        font-size: var(--font-size-base, 14px);
        font-weight: var(--font-weight-semibold, 600);
        cursor: pointer;
        transition: all var(--transition-fast, 150ms ease-out);
        font-family: var(--font-family-body);
      }

      .permission-dialog__btn--cancel {
        background: var(--color-surface-container-high, #e8e8ed);
        color: var(--color-text-secondary, #414755);
      }

      .permission-dialog__btn--cancel:hover {
        background: var(--color-surface-container-highest, #e2e2e7);
      }

      .permission-dialog__btn--confirm {
        background: var(--color-tertiary, #ba0034);
        color: var(--color-on-tertiary, #ffffff);
      }

      .permission-dialog__btn--confirm:hover {
        background: var(--color-tertiary-container, #e51245);
      }

      .permission-dialog__btn:active {
        transform: scale(0.97);
      }
    `
    document.head.appendChild(style)
  }

  destroy() {
    this.container.innerHTML = ''
    const style = document.getElementById('permission-dialog-styles')
    if (style) style.remove()
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }
}

const permissionDialog = new PermissionDialog()
export default permissionDialog
export { PermissionDialog }
