import request from '../utils/request.js'
import { chatStore } from '../store/index.js'

class ChatService {
  async startChat(figureId) {
    const data = await request.post(`/api/chat/start?figure_id=${figureId}`)
    
    if (data) {
      chatStore.setCurrentFigure({
        id: data.figure_id,
        name: data.figure_name
      })

      if (data.initial_message) {
        chatStore.addMessage({
          role: 'assistant',
          content: data.initial_message,
          created_at: new Date().toISOString()
        })
      }
    }

    return data
  }

  async sendMessage(figureId, message, history = []) {
    chatStore.setLoading(true)

    try {
      const data = await request.post('/api/chat/send', {
        figure_id: figureId,
        message: message,
        history: history.length > 0 ? history : undefined
      })

      if (data && data.message) {
        chatStore.addMessage({
          role: 'assistant',
          content: data.message,
          audio_url: data.audio_url || null,
          created_at: new Date().toISOString()
        })
      }

      return data
    } catch (error) {
      console.error('Send message failed:', error)
      throw error
    } finally {
      chatStore.setLoading(false)
    }
  }

  async getHistory(figureId) {
    try {
      const messages = await request.get(`/api/chat/history/${figureId}`)
      
      if (Array.isArray(messages)) {
        chatStore.clearMessages()
        messages.forEach(msg => {
          chatStore.addMessage(msg)
        })
      }

      return messages
    } catch (error) {
      console.error('Get chat history failed:', error)
      throw error
    }
  }

  connectWebSocket(onMessage, onError, onClose) {
    const token = localStorage.getItem('access_token')
    
    if (!token) {
      throw new Error('No authentication token')
    }

    const wsUrl = `ws://${window.location.host}/ws/chat?token=${token}`

    let ws = null

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        chatStore.setConnected(true)
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case 'chunk':
              if (onMessage) onMessage(data.text, false)
              break
            
            case 'done':
              if (onMessage) onMessage(data.full_text, true)
              break
            
            case 'error':
              console.error('WebSocket error:', data.message)
              if (onError) onError(new Error(data.message))
              break
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        chatStore.setConnected(false)
        if (onError) onError(new Error('WebSocket connection error'))
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        chatStore.setConnected(false)
        if (onClose) onClose(event)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      throw error
    }

    return ws
  }

  sendViaWebSocket(ws, figureId, message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected')
    }

    ws.send(JSON.stringify({ figure_id: figureId, message }))
  }
}

const chatService = new ChatService()
export default chatService