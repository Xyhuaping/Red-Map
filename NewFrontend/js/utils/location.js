import AMAP_CONFIG from '../config/amap.js'
import { mapStore } from '../store/index.js'

class LocationService {
  constructor() {
    this.geolocation = null
    this.watchId = null
    this.isWatching = false
  }

  async init() {
    if (typeof AMap === 'undefined') {
      throw new Error('AMap JS API not loaded')
    }

    return new Promise((resolve, reject) => {
      try {
        AMap.plugin('AMap.Geolocation', () => {
          this.geolocation = new AMap.Geolocation({
            enableHighAccuracy: AMAP_CONFIG.GEOLOCATION_OPTIONS.enableHighAccuracy,
            timeout: AMAP_CONFIG.GEOLOCATION_OPTIONS.timeout,
            maximumAge: AMAP_CONFIG.GEOLOCATION_OPTIONS.maximumAge,
            convert: AMAP_CONFIG.GEOLOCATION_OPTIONS.convert,
            showButton: false,
            showMarker: false,
            panToLocation: false,
            zoomToAccuracy: false
          })
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  async getCurrentLocation(options = {}) {
    const { fallbackToDefault = true, fallbackToBrowser = true } = options

    try {
      if (!this.geolocation) {
        await this.init()
      }

      return await new Promise((resolve, reject) => {
        this.geolocation.getCurrentPosition(async (status, result) => {
          if (status === 'complete') {
            const location = {
              lng: result.position.lng,
              lat: result.position.lat,
              address: result.formattedAddress || '',
              accuracy: result.accuracy || 0,
              timestamp: Date.now(),
              source: 'amap'
            }

            mapStore.setLocation(location)
            resolve(location)
          } else {
            console.warn('AMap geolocation failed:', result.message)
            
            if (fallbackToBrowser) {
              try {
                const browserLocation = await this.getBrowserLocation()
                resolve(browserLocation)
              } catch (browserError) {
                if (fallbackToDefault) {
                  const defaultLocation = this.getDefaultLocation()
                  resolve(defaultLocation)
                } else {
                  reject(new Error(result.message || 'Geolocation failed'))
                }
              }
            } else if (fallbackToDefault) {
              const defaultLocation = this.getDefaultLocation()
              resolve(defaultLocation)
            } else {
              reject(new Error(result.message || 'Geolocation failed'))
            }
          }
        })
      })
    } catch (error) {
      console.error('Get current location error:', error)
      
      if (fallbackToDefault) {
        const defaultLocation = this.getDefaultLocation()
        return defaultLocation
      }
      
      throw error
    }
  }

  async getBrowserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Browser geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lng: position.coords.longitude,
            lat: position.coords.latitude,
            address: '',
            accuracy: position.coords.accuracy || 0,
            timestamp: position.timestamp,
            source: 'browser'
          }

          mapStore.setLocation(location)
          resolve(location)
        },
        (error) => {
          let message = 'Unknown error'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'User denied the request for Geolocation.'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              message = 'The request to get user location timed out.'
              break
          }
          
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  getDefaultLocation() {
    const defaultLocation = {
      lng: AMAP_CONFIG.DEFAULT_CENTER.lng,
      lat: AMAP_CONFIG.DEFAULT_CENTER.lat,
      address: '北京市',
      accuracy: 0,
      timestamp: Date.now(),
      source: 'default'
    }

    mapStore.setLocation(defaultLocation)
    return defaultLocation
  }

  watchLocation(callback, options = {}) {
    const { interval = 5000, enableHighAccuracy = true } = options

    if (!this.geolocation) {
      console.warn('Geolocation not initialized')
      return null
    }

    this.stopWatchLocation()

    this.isWatching = true
    
    const updateLocation = async () => {
      if (!this.isWatching) return

      try {
        const location = await this.getCurrentLocation({
          fallbackToDefault: false,
          fallbackToBrowser: true
        })

        if (callback && typeof callback === 'function') {
          callback(location)
        }
      } catch (error) {
        console.error('Watch location error:', error)
      }

      if (this.isWatching) {
        this.watchId = setTimeout(updateLocation, interval)
      }
    }

    updateLocation()

    return this.watchId
  }

  stopWatchLocation() {
    this.isWatching = false
    
    if (this.watchId) {
      clearTimeout(this.watchId)
      this.watchId = null
    }
  }

  calculateDistance(point1, point2) {
    if (!point1 || !point2) return 0

    const rad = Math.PI / 180
    const R = 6371000

    const dLat = (point2.lat - point1.lat) * rad
    const dLng = (point2.lng - point1.lng) * rad

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.lat * rad) * Math.cos(point2.lat * rad) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  destroy() {
    this.stopWatchLocation()
    this.geolocation = null
  }
}

const locationService = new LocationService()
export default locationService
export { LocationService }