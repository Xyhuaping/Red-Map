const storage = {
  get(key) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Storage get error:', error)
      return localStorage.getItem(key)
    }
  },

  set(key, value) {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, serializedValue)
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  },

  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      return false
    }
  },

  has(key) {
    return localStorage.getItem(key) !== null
  },

  keys() {
    return Object.keys(localStorage)
  },

  size() {
    return localStorage.length
  }
}

export function getStorage(key) {
  return storage.get(key)
}

export function setStorage(key, value) {
  return storage.set(key, value)
}

export function removeStorage(key) {
  return storage.remove(key)
}

export function clearStorage() {
  return storage.clear()
}

export default storage