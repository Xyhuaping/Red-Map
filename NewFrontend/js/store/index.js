import { getStorage, setStorage, removeStorage } from '../utils/storage.js'

class Store {
  constructor(initialState = {}, options = {}) {
    this.state = this.createReactiveState(initialState)
    this.listeners = new Map()
    this.options = {
      persist: false,
      persistKey: '',
      ...options
    }

    if (this.options.persist && this.options.persistKey) {
      this.loadFromStorage()
    }
  }

  createReactiveState(state) {
    return new Proxy(state, {
      set: (target, property, value) => {
        const oldValue = target[property]
        target[property] = value

        this.notify(property, value, oldValue)

        if (this.options.persist) {
          this.saveToStorage()
        }

        return true
      },
      get: (target, property) => {
        return target[property]
      }
    })
  }

  getState() {
    return { ...this.state }
  }

  setState(newState) {
    Object.assign(this.state, newState)
  }

  subscribe(property, callback) {
    if (!this.listeners.has(property)) {
      this.listeners.set(property, new Set())
    }
    this.listeners.get(property).add(callback)

    return () => {
      const callbacks = this.listeners.get(property)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  notify(property, newValue, oldValue) {
    const callbacks = this.listeners.get(property)
    if (callbacks) {
      callbacks.forEach(callback => callback(newValue, oldValue))
    }

    const globalCallbacks = this.listeners.get('*')
    if (globalCallbacks) {
      globalCallbacks.forEach(callback => callback({ property, newValue, oldValue }))
    }
  }

  saveToStorage() {
    if (this.options.persist && this.options.persistKey) {
      setStorage(this.options.persistKey, JSON.stringify(this.state))
    }
  }

  loadFromStorage() {
    if (this.options.persist && this.options.persistKey) {
      const saved = getStorage(this.options.persistKey)
      if (saved) {
        try {
          const parsedState = JSON.parse(saved)
          Object.assign(this.state, parsedState)
        } catch (error) {
          console.error('Failed to load state from storage:', error)
        }
      }
    }
  }

  clearState() {
    Object.keys(this.state).forEach(key => {
      delete this.state[key]
    })

    if (this.options.persist && this.options.persistKey) {
      removeStorage(this.options.persistKey)
    }
  }
}

const userStore = new Store({
  token: null,
  refreshToken: null,
  userInfo: null,
  isLoggedIn: false
}, {
  persist: true,
  persistKey: 'user_store'
})

userStore.login = function(token, refreshToken, userInfo) {
  this.state.token = token
  this.state.refreshToken = refreshToken
  this.state.userInfo = userInfo
  this.state.isLoggedIn = true

  localStorage.setItem('access_token', token)
  localStorage.setItem('refresh_token', refreshToken)
}

userStore.logout = function() {
  this.state.token = null
  this.state.refreshToken = null
  this.state.userInfo = null
  this.state.isLoggedIn = false

  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  this.clearState()
}

userStore.updateUserInfo = function(userInfo) {
  this.state.userInfo = { ...this.state.userInfo, ...userInfo }
}

const mapStore = new Store({
  currentLocation: null,
  fences: [],
  triggeredFences: [],
  selectedFence: null,
  isLocating: false
})

mapStore.setLocation = function(location) {
  this.state.currentLocation = location
}

mapStore.setFences = function(fences) {
  this.state.fences = fences
}

mapStore.addTriggeredFence = function(fence) {
  if (!this.state.triggeredFences.find(f => f.id === fence.id)) {
    this.state.triggeredFences.push(fence)
  }
}

mapStore.setSelectedFence = function(fence) {
  this.state.selectedFence = fence
}

const chatStore = new Store({
  currentFigure: null,
  messages: [],
  isConnected: false,
  isLoading: false
}, {
  persist: true,
  persistKey: 'chat_store'
})

chatStore.setCurrentFigure = function(figure) {
  this.state.currentFigure = figure
}

chatStore.addMessage = function(message) {
  this.state.messages.push(message)
}

chatStore.clearMessages = function() {
  this.state.messages = []
}

chatStore.setConnected = function(connected) {
  this.state.isConnected = connected
}

chatStore.setLoading = function(loading) {
  this.state.isLoading = loading
}

export { Store, userStore, mapStore, chatStore }
export default {
  userStore,
  mapStore,
  chatStore
}