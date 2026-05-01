export default class ChatBubble {
  constructor(container, message = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.message = message
  }

  render() {
    if (!this.message) return ''

    const isUser = this.message.role === 'user'
    
    return `
      <div class="chat-bubble chat-bubble--${isUser ? 'user' : 'assistant'}">
        ${!isUser ? '<div class="chat-bubble__avatar">🤖</div>' : ''}
        <div class="chat-bubble__content">
          <div class="chat-bubble__text">${this.formatMessage(this.message.content)}</div>
          <div class="chat-bubble__time">${this.formatTime(this.message.created_at)}</div>
        </div>
        ${isUser ? '<div class="chat-bubble__avatar">👤</div>' : ''}
      </div>
    `
  }

  formatMessage(content) {
    if (!content) return ''
    
    let formatted = content
    
    formatted = this.escapeHtml(formatted)
    
    formatted = formatted.replace(/\n/g, '<br>')
    
    return formatted
  }

  formatTime(timestamp) {
    if (!timestamp) return ''

    try {
      const date = new Date(timestamp)
      const now = new Date()
      
      const isToday = date.toDateString() === now.toDateString()
      
      if (isToday) {
        return date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch (error) {
      return ''
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
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}