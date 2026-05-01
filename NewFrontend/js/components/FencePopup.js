import { escapeHtml } from '../utils/helpers.js'

class FencePopup {
  constructor() {
    this.visible = false
    this.autoCloseTimer = null
    this.autoCloseMs = 30000
    this.container = null
    this.currentData = null
    this._ensureContainer()
  }

  _ensureContainer() {
    this.container = document.getElementById('fence-popup-root')
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'fence-popup-root'
      document.body.appendChild(this.container)
    }
  }

  show(fenceData) {
    if (this.visible) {
      this.hide()
    }

    this.currentData = fenceData
    this.visible = true
    this.container.innerHTML = this._render(fenceData)
    this._injectStyles()
    this._bindEvents()
    this._startAutoClose()

    requestAnimationFrame(() => {
      const popup = this.container.querySelector('.fence-popup')
      if (popup) {
        popup.classList.add('fence-popup--visible')
      }
    })
  }

  hide() {
    const popup = this.container.querySelector('.fence-popup')
    if (popup) {
      popup.classList.remove('fence-popup--visible')
      popup.classList.add('fence-popup--hiding')
      setTimeout(() => {
        this._cleanup()
      }, 300)
    } else {
      this._cleanup()
    }
  }

  _cleanup() {
    this.visible = false
    this.currentData = null
    this.container.innerHTML = ''
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
      this.autoCloseTimer = null
    }
  }

  _startAutoClose() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer)
    }
    this.autoCloseTimer = setTimeout(() => {
      this.hide()
    }, this.autoCloseMs)
  }

  _render(fenceData) {
    const { fence, figure } = fenceData
    const figureName = figure?.name || fence.name || '红色文化景点'
    const figureTitle = figure?.title || ''
    const figureAvatar = figure?.avatar_url || ''
    const prompt = fence.trigger_prompt || '您已进入景点区域，点击了解更多'
    const figureId = figure?.id || fence.figure_id || ''

    return `
      <div class="fence-popup">
        <div class="fence-popup__overlay"></div>
        <div class="fence-popup__content">
          <button class="fence-popup__close" id="fence-popup-close" aria-label="关闭">
            <span class="material-symbols-outlined">close</span>
          </button>

          <div class="fence-popup__header">
            ${figureAvatar ? `
              <img class="fence-popup__avatar" src="${escapeHtml(figureAvatar)}" alt="${escapeHtml(figureName)}" />
            ` : `
              <div class="fence-popup__avatar fence-popup__avatar--placeholder">
                <span class="material-symbols-outlined">person</span>
              </div>
            `}
            <div class="fence-popup__info">
              <h3 class="fence-popup__name">${escapeHtml(figureName)}</h3>
              ${figureTitle ? `<p class="fence-popup__title">${escapeHtml(figureTitle)}</p>` : ''}
            </div>
          </div>

          <p class="fence-popup__prompt">${escapeHtml(prompt)}</p>

          <div class="fence-popup__actions">
            <button class="fence-popup__btn fence-popup__btn--ar" id="fence-popup-ar">
              <span class="material-symbols-outlined">view_in_ar</span>
              AR 游览
            </button>
            <button class="fence-popup__btn fence-popup__btn--chat" id="fence-popup-chat" ${!figureId ? 'disabled' : ''}>
              <span class="material-symbols-outlined">chat</span>
              AI 对话
            </button>
          </div>
        </div>
      </div>
    `
  }

  _bindEvents() {
    const closeBtn = document.getElementById('fence-popup-close')
    const arBtn = document.getElementById('fence-popup-ar')
    const chatBtn = document.getElementById('fence-popup-chat')
    const overlay = this.container.querySelector('.fence-popup__overlay')

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide())
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.hide())
    }

    if (arBtn) {
      arBtn.addEventListener('click', () => {
        this.hide()
        window.location.hash = '#/map'
      })
    }

    if (chatBtn && !chatBtn.disabled) {
      chatBtn.addEventListener('click', () => {
        const figureId = this.currentData?.figure?.id || this.currentData?.fence?.figure_id
        this.hide()
        if (figureId) {
          window.location.hash = `#/chat?figureId=${figureId}`
        }
      })
    }
  }

  _injectStyles() {
    if (document.getElementById('fence-popup-styles')) return

    const style = document.createElement('style')
    style.id = 'fence-popup-styles'
    style.textContent = `
      .fence-popup {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: var(--z-index-modal, 500);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        pointer-events: none;
      }

      .fence-popup__overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        pointer-events: auto;
      }

      .fence-popup__content {
        position: relative;
        width: 100%;
        max-width: 480px;
        background: var(--color-bg-card, #ffffff);
        border-radius: var(--radius-lg, 16px) var(--radius-lg, 16px) 0 0;
        padding: var(--spacing-lg, 24px) var(--spacing-md, 16px) calc(var(--spacing-lg, 24px) + var(--safe-area-bottom, 0px));
        pointer-events: auto;
        transform: translateY(100%);
        transition: transform var(--transition-base, 300ms ease-out);
        box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
      }

      .fence-popup--visible .fence-popup__content {
        transform: translateY(0);
      }

      .fence-popup--hiding .fence-popup__content {
        transform: translateY(100%);
      }

      .fence-popup__close {
        position: absolute;
        top: var(--spacing-sm, 12px);
        right: var(--spacing-sm, 12px);
        width: 32px;
        height: 32px;
        border: none;
        background: var(--color-surface-container-high, #e8e8ed);
        border-radius: var(--radius-full, 9999px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--color-text-secondary, #414755);
        transition: background var(--transition-fast, 150ms ease-out);
      }

      .fence-popup__close:hover {
        background: var(--color-surface-container-highest, #e2e2e7);
      }

      .fence-popup__close .material-symbols-outlined {
        font-size: 18px;
      }

      .fence-popup__header {
        display: flex;
        align-items: center;
        gap: var(--spacing-md, 16px);
        margin-bottom: var(--spacing-md, 16px);
      }

      .fence-popup__avatar {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-full, 9999px);
        object-fit: cover;
        flex-shrink: 0;
      }

      .fence-popup__avatar--placeholder {
        background: var(--color-tertiary, #ba0034);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-on-tertiary, #ffffff);
      }

      .fence-popup__avatar--placeholder .material-symbols-outlined {
        font-size: 32px;
      }

      .fence-popup__info {
        flex: 1;
        min-width: 0;
      }

      .fence-popup__name {
        font-size: var(--font-size-lg, 18px);
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-text-primary, #1a1c1f);
        margin: 0 0 4px 0;
        line-height: var(--line-height-tight, 1.25);
      }

      .fence-popup__title {
        font-size: var(--font-size-base, 14px);
        color: var(--color-text-muted, #717786);
        margin: 0;
        line-height: var(--line-height-base, 1.5);
      }

      .fence-popup__prompt {
        font-size: var(--font-size-base, 14px);
        color: var(--color-text-secondary, #414755);
        line-height: var(--line-height-base, 1.5);
        margin: 0 0 var(--spacing-lg, 24px) 0;
        padding: var(--spacing-sm, 12px);
        background: var(--color-surface-container-low, #f3f3f8);
        border-radius: var(--radius-sm, 8px);
      }

      .fence-popup__actions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm, 12px);
      }

      .fence-popup__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs, 8px);
        width: 100%;
        padding: var(--spacing-sm, 12px) var(--spacing-md, 16px);
        border: none;
        border-radius: var(--radius-md, 12px);
        font-size: var(--font-size-md, 17px);
        font-weight: var(--font-weight-semibold, 600);
        cursor: pointer;
        transition: all var(--transition-fast, 150ms ease-out);
        font-family: var(--font-family-body);
      }

      .fence-popup__btn .material-symbols-outlined {
        font-size: 20px;
      }

      .fence-popup__btn--ar {
        background: var(--color-tertiary, #ba0034);
        color: var(--color-on-tertiary, #ffffff);
      }

      .fence-popup__btn--ar:hover {
        background: var(--color-tertiary-container, #e51245);
      }

      .fence-popup__btn--ar:active {
        transform: scale(0.98);
      }

      .fence-popup__btn--chat {
        background: transparent;
        color: var(--color-tertiary, #ba0034);
        border: 2px solid var(--color-tertiary, #ba0034);
      }

      .fence-popup__btn--chat:hover {
        background: rgba(186, 0, 52, 0.06);
      }

      .fence-popup__btn--chat:active {
        transform: scale(0.98);
      }

      .fence-popup__btn--chat:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    `
    document.head.appendChild(style)
  }

  destroy() {
    this._cleanup()
    const style = document.getElementById('fence-popup-styles')
    if (style) {
      style.remove()
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
  }
}

const fencePopup = new FencePopup()
export default fencePopup
export { FencePopup }
