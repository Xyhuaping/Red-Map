import chatService from '../services/chat.js'
import ChatBubble from '../components/ChatBubble.js'
import { chatStore } from '../store/index.js'

export default class ChatPage {
  constructor(container, params = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container
    
    this.figureId = params.id || ''
    this.isLoading = false
    this.wsConnection = null
    this.typingText = ''

    this.init()
  }

  async init() {
    try {
      await this.render()
      
      if (this.figureId) {
        await this.initChat()
      }
      
      this.bindEvents()
    } catch (error) {
      console.error('Failed to initialize chat page:', error)
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="chat-page">
        <div class="chat-header">
          <button class="chat-header__back" id="back-btn">←</button>
          <div class="chat-header__info">
            <div class="chat-header__name" id="figure-name">
              ${chatStore.state.currentFigure?.name || 'AI 助手'}
            </div>
            <div class="chat-header__status">在线</div>
          </div>
          <div style="width: 36px;"></div>
        </div>

        <div class="chat-messages" id="messages-container"></div>

        <div class="chat-input-area">
          <textarea 
            class="chat-input" 
            id="message-input"
            placeholder="输入消息..."
            rows="1"
          ></textarea>
          <button class="chat-send-btn" id="send-btn" disabled>→</button>
        </div>
      </div>
    `
  }

  async initChat() {
    try {
      await chatService.getHistory(this.figureId)
      
      if (!chatStore.state.messages || chatStore.state.messages.length === 0) {
        await chatService.startChat(this.figureId)
      }
      
      this.updateHeaderName()
      this.renderMessages()
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      this.addSystemMessage('对话初始化失败，请重试')
    }
  }

  renderMessages() {
    const messagesContainer = document.getElementById('messages-container')
    
    if (!messagesContainer) return

    const messages = chatStore.state.messages || []

    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div style="text-align: center; color: var(--color-text-muted); padding: var(--spacing-2xl);">
          开始与 AI 对话吧！
        </div>
      `
      return
    }

    messagesContainer.innerHTML = ''

    messages.forEach(message => {
      const bubbleWrapper = document.createElement('div')
      messagesContainer.appendChild(bubbleWrapper)

      const bubble = new ChatBubble(bubbleWrapper, message)
      bubbleWrapper.innerHTML = bubble.render()
    })

    this.scrollToBottom()
  }

  async sendMessage() {
    const input = document.getElementById('message-input')
    const sendBtn = document.getElementById('send-btn')
    
    if (!input || !input.value.trim() || this.isLoading) return

    const messageText = input.value.trim()
    
    chatStore.addMessage({
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    })

    input.value = ''
    sendBtn.disabled = true
    
    this.renderMessages()
    this.showTypingIndicator()

    try {
      this.isLoading = true
      
      await chatService.sendMessage(
        this.figureId,
        messageText,
        chatStore.state.messages.filter(m => m.role !== 'system')
      )

      this.hideTypingIndicator()
      this.renderMessages()
    } catch (error) {
      console.error('Send message failed:', error)
      this.hideTypingIndicator()
      this.addSystemMessage(`发送失败：${error.message}`)
    } finally {
      this.isLoading = false
      if (sendBtn) sendBtn.disabled = false
    }
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('messages-container')
    
    if (!messagesContainer) return

    const typingDiv = document.createElement('div')
    typingDiv.className = 'chat-bubble chat-bubble--assistant'
    typingDiv.id = 'typing-indicator'
    typingDiv.innerHTML = `
      <div class="chat-bubble__avatar">🤖</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `

    messagesContainer.appendChild(typingDiv)
    this.scrollToBottom()
  }

  hideTypingIndicator() {
    const typingEl = document.getElementById('typing-indicator')
    
    if (typingEl && typingEl.parentNode) {
      typingEl.parentNode.removeChild(typingEl)
    }
  }

  addSystemMessage(text) {
    chatStore.addMessage({
      role: 'assistant',
      content: text,
      created_at: new Date().toISOString(),
      isSystem: true
    })
    
    this.renderMessages()
  }

  updateHeaderName() {
    const nameEl = document.getElementById('figure-name')
    
    if (nameEl && chatStore.state.currentFigure?.name) {
      nameEl.textContent = chatStore.state.currentFigure.name
    }
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container')
    
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }, 100)
    }
  }

  bindEvents() {
    const backBtn = document.getElementById('back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back()
      })
    }

    const sendBtn = document.getElementById('send-btn')
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage())
    }

    const messageInput = document.getElementById('message-input')
    if (messageInput) {
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          this.sendMessage()
        }
      })

      messageInput.addEventListener('input', () => {
        const sendBtn = document.getElementById('send-btn')
        
        if (sendBtn) {
          sendBtn.disabled = !messageInput.value.trim() || this.isLoading
        }

        messageInput.style.height = 'auto'
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px'
      })
    }
  }

  destroy() {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
    }

    this.figureId = ''
    this.isLoading = false
    this.typingText = ''
  }
}