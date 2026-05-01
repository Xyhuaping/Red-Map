import AMAP_CONFIG from '../config/amap.js'
import { mapStore } from '../store/index.js'

export default class MapView {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container

    if (!this.container) {
      throw new Error('Map container not found')
    }

    this.options = {
      center: AMAP_CONFIG.DEFAULT_CENTER,
      zoom: AMAP_CONFIG.DEFAULT_ZOOM,
      fences: [],
      markers: [],
      showLocation: true,
      onMarkerClick: null,
      onLocationUpdate: null,
      onFenceTrigger: null,
      ...options
    }

    this.mapInstance = null
    this.geolocation = null
    this.geocoder = null
    this.markers = []
    this.circles = []
    this.polygons = []
    this.locationMarker = null
    this.accuracyCircle = null
    this._lastLocation = null
    this._lastHeading = null
    this._unsubscribeLocation = null

    this.init()
  }

  async init() {
    if (typeof AMap === 'undefined') {
      console.error('AMap JS API not loaded')
      return
    }

    try {
      await this.createMap()

      if (this.options.showLocation) {
        this._setupLocationSubscription()
        await this.initGeolocation()
        await this.initGeocoder()
      }

      this.renderFences()
      this.bindEvents()
    } catch (error) {
      console.error('Failed to initialize map:', error)
    }
  }

  _setupLocationSubscription() {
    this._unsubscribeLocation = mapStore.subscribe('currentLocation', (location) => {
      if (!location || !this.mapInstance) return

      let heading = this._lastHeading

      if (this._lastLocation) {
        const distance = this._calculateDistance(this._lastLocation, location)
        if (distance > 3) {
          heading = this._calculateBearing(this._lastLocation, location)
          this._lastHeading = heading
        }
      }

      this._lastLocation = { lng: location.lng, lat: location.lat }
      this.addLocationMarker(location, heading)
    })
  }

  _calculateBearing(from, to) {
    const rad = Math.PI / 180
    const dLng = (to.lng - from.lng) * rad
    const lat1 = from.lat * rad
    const lat2 = to.lat * rad

    const y = Math.sin(dLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

    let bearing = Math.atan2(y, x) * 180 / Math.PI
    return (bearing + 360) % 360
  }

  _calculateDistance(point1, point2) {
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

  _createLocationIconHTML() {
    return `<div style="width:28px;height:40px;position:relative;">
      <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:12px solid #3d93fd;position:absolute;top:0;left:6px;"></div>
      <div style="width:20px;height:20px;background:#3d93fd;border:3px solid #fff;border-radius:50%;position:absolute;top:12px;left:4px;box-shadow:0 0 6px rgba(61,147,253,0.6);"></div>
      <div style="width:8px;height:8px;background:#fff;border-radius:50%;position:absolute;top:18px;left:10px;"></div>
    </div>`
  }

  async createMap() {
    return new Promise((resolve, reject) => {
      try {
        this.mapInstance = new AMap.Map(this.container, {
          zoom: this.options.zoom,
          center: [this.options.center.lng, this.options.center.lat],
          viewMode: '2D',
          dragEnable: true,
          zoomEnable: true,
          rotateEnable: false,
          mapStyle: 'amap://styles/normal',
          animateEnable: false,
          jogEnable: false,
          showIndoorMap: false,
          isHotspot: false,
          defaultCursor: 'pointer'
        })

        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  async initGeolocation() {
    return new Promise((resolve, reject) => {
      try {
        this.geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: AMAP_CONFIG.GEOLOCATION_OPTIONS.timeout,
          maximumAge: AMAP_CONFIG.GEOLOCATION_OPTIONS.maximumAge,
          convert: AMAP_CONFIG.GEOLOCATION_OPTIONS.convert,
          showButton: AMAP_CONFIG.GEOLOCATION_OPTIONS.showButton,
          showMarker: AMAP_CONFIG.GEOLOCATION_OPTIONS.showMarker,
          panToLocation: AMAP_CONFIG.GEOLOCATION_OPTIONS.panToLocation,
          zoomToAccuracy: AMAP_CONFIG.GEOLOCATION_OPTIONS.zoomToAccuracy
        })

        this.geolocation.getCurrentPosition(async (status, result) => {
          if (status === 'complete') {
            const location = {
              lng: result.position.lng,
              lat: result.position.lat,
              address: result.formattedAddress || '',
              accuracy: result.accuracy
            }

            mapStore.setLocation(location)
            this.centerToLocation(location)

            if (this.options.onLocationUpdate) {
              this.options.onLocationUpdate(location)
            }

            resolve(location)
          } else {
            console.warn('Geolocation failed:', result.message)
            this.useDefaultLocation()
            resolve(null)
          }
        })
      } catch (error) {
        console.error('Failed to initialize geolocation:', error)
        this.useDefaultLocation()
        reject(error)
      }
    })
  }

  async initGeocoder() {
    return new Promise((resolve, reject) => {
      try {
        AMap.plugin('AMap.Geocoder', () => {
          this.geocoder = new AMap.Geocoder({
            city: '全国',
            radius: 1000
          })
          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  useDefaultLocation() {
    const defaultLocation = {
      lng: AMAP_CONFIG.DEFAULT_CENTER.lng,
      lat: AMAP_CONFIG.DEFAULT_CENTER.lat,
      address: '北京市',
      accuracy: 0
    }

    mapStore.setLocation(defaultLocation)

    if (this.mapInstance) {
      this.mapInstance.setCenter([defaultLocation.lng, defaultLocation.lat])
    }

    if (this.options.onLocationUpdate) {
      this.options.onLocationUpdate(defaultLocation)
    }
  }

  render() {
    return `
      <div class="map-view" style="width: 100%; height: 100%; position: relative;">
        <div id="${this.container.id || 'map-container'}" style="width: 100%; height: 100%;"></div>
      </div>
    `
  }

  bindEvents() {
    if (!this.mapInstance) return

    this.mapInstance.on('click', (e) => {
    })

    this.mapInstance.on('moveend', () => {
      const center = this.mapInstance.getCenter()
      if (this.options.onLocationUpdate) {
        this.options.onLocationUpdate({
          lng: center.lng,
          lat: center.lat
        })
      }
    })
  }

  addMarker(position, options = {}) {
    if (!this.mapInstance) return null

    const markerOptions = {
      position: [position.lng, position.lat],
      title: options.title || '',
      icon: options.icon || 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
      offset: options.offset || new AMap.Pixel(-13, -30),
      ...options
    }

    const marker = new AMap.Marker(markerOptions)
    this.mapInstance.add(marker)
    this.markers.push(marker)

    if (options.onClick) {
      marker.on('click', () => options.onClick(marker))
    }

    return marker
  }

  addCircle(center, radius, options = {}) {
    if (!this.mapInstance) return null

    const circleOptions = {
      center: [center.lng, center.lat],
      radius: radius,
      fillColor: options.fillColor || '#FF6600',
      fillOpacity: options.fillOpacity !== undefined ? options.fillOpacity : 0.3,
      strokeColor: options.strokeColor || '#FF6600',
      strokeWeight: options.strokeWeight || 2,
      strokeOpacity: options.strokeOpacity !== undefined ? options.strokeOpacity : 0.8,
      ...options
    }

    const circle = new AMap.Circle(circleOptions)
    this.mapInstance.add(circle)
    this.circles.push(circle)

    return circle
  }

  addPolygon(path, options = {}) {
    if (!this.mapInstance) return null

    const polygonOptions = {
      path: path.map(p => [p.lng, p.lat]),
      fillColor: options.fillColor || '#FF6600',
      fillOpacity: options.fillOpacity !== undefined ? options.fillOpacity : 0.3,
      strokeColor: options.strokeColor || '#FF6600',
      strokeWeight: options.strokeWeight || 2,
      strokeOpacity: options.strokeOpacity !== undefined ? options.strokeOpacity : 0.8,
      ...options
    }

    const polygon = new AMap.Polygon(polygonOptions)
    this.mapInstance.add(polygon)
    this.polygons.push(polygon)

    return polygon
  }

  renderFences() {
    this.clearOverlays()

    if (!this.options.fences || !Array.isArray(this.options.fences)) return

    this.options.fences.forEach(fence => {
      if (fence.shape_type === 'circle' && fence.center_lng && fence.center_lat && fence.radius) {
        this.addCircle(
          { lng: fence.center_lng, lat: fence.center_lat },
          fence.radius,
          {
            fillColor: fence.color || '#FF6600',
            strokeColor: fence.color || '#FF6600'
          }
        )

        this.addMarker(
          { lng: fence.center_lng, lat: fence.center_lat },
          {
            title: fence.name,
            onClick: () => {
              if (this.options.onMarkerClick) {
                this.options.onMarkerClick(fence)
              }
            }
          }
        )
      } else if (fence.shape_type === 'polygon' && fence.polygon_coords && fence.polygon_coords.length >= 3) {
        this.addPolygon(
          fence.polygon_coords,
          {
            fillColor: fence.color || '#FF6600',
            strokeColor: fence.color || '#FF6600'
          }
        )

        const center = this.calculatePolygonCenter(fence.polygon_coords)
        this.addMarker(
          center,
          {
            title: fence.name,
            onClick: () => {
              if (this.options.onMarkerClick) {
                this.options.onMarkerClick(fence)
              }
            }
          }
        )
      }
    })
  }

  calculatePolygonCenter(coords) {
    if (!coords || coords.length === 0) return { lng: 0, lat: 0 }

    let sumLng = 0
    let sumLat = 0

    coords.forEach(coord => {
      sumLng += coord.lng
      sumLat += coord.lat
    })

    return {
      lng: sumLng / coords.length,
      lat: sumLat / coords.length
    }
  }

  addLocationMarker(location, heading = null) {
    if (!this.mapInstance || !location) return

    const iconHTML = this._createLocationIconHTML()

    if (this.locationMarker) {
      this.locationMarker.setPosition([location.lng, location.lat])
      if (heading !== null) {
        this.locationMarker.setAngle(heading)
      }
    } else {
      this.locationMarker = new AMap.Marker({
        position: [location.lng, location.lat],
        content: iconHTML,
        offset: new AMap.Pixel(-14, -22),
        zIndex: 1000,
        angle: heading || 0
      })
      this.mapInstance.add(this.locationMarker)
    }

    if (location.accuracy && location.accuracy > 0) {
      if (this.accuracyCircle) {
        this.accuracyCircle.setCenter([location.lng, location.lat])
        this.accuracyCircle.setRadius(Math.max(location.accuracy, 10))
      } else {
        this.accuracyCircle = new AMap.Circle({
          center: [location.lng, location.lat],
          radius: Math.max(location.accuracy, 10),
          fillColor: '#3d93fd',
          fillOpacity: 0.12,
          strokeColor: '#3d93fd',
          strokeWeight: 1,
          strokeOpacity: 0.25,
          zIndex: 999
        })
        this.mapInstance.add(this.accuracyCircle)
      }
    }
  }

  centerToLocation(location, zoom = AMAP_CONFIG.LOCATION_ZOOM) {
    if (!this.mapInstance || !location) return

    this.mapInstance.setZoomAndCenter(zoom, [location.lng, location.lat])
  }

  setFences(fences) {
    this.options.fences = fences
    this.renderFences()
  }

  clearOverlays() {
    this.markers.forEach(marker => {
      if (marker !== this.locationMarker && this.mapInstance) {
        this.mapInstance.remove(marker)
      }
    })
    this.markers = this.locationMarker ? [this.locationMarker] : []

    this.circles.forEach(circle => {
      if (circle !== this.accuracyCircle && this.mapInstance) {
        this.mapInstance.remove(circle)
      }
    })
    this.circles = this.accuracyCircle ? [this.accuracyCircle] : []

    this.polygons.forEach(polygon => {
      if (this.mapInstance) this.mapInstance.remove(polygon)
    })
    this.polygons = []
  }

  reverseGeocode(lng, lat) {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder not initialized'))
        return
      }

      this.geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.regeocode) {
          resolve(result.regeocode.formattedAddress)
        } else {
          reject(new Error('Reverse geocoding failed'))
        }
      })
    })
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!this.geolocation) {
        reject(new Error('Geolocation not initialized'))
        return
      }

      this.geolocation.getCurrentPosition((status, result) => {
        if (status === 'complete') {
          resolve({
            lng: result.position.lng,
            lat: result.position.lat,
            address: result.formattedAddress || ''
          })
        } else {
          reject(new Error(result.message || 'Get current position failed'))
        }
      })
    })
  }

  fitView(padding = [50, 50, 50, 50]) {
    if (!this.mapInstance) return

    this.mapInstance.setFitView(null, false, padding)
  }

  setZoom(zoom) {
    if (!this.mapInstance) return
    this.mapInstance.setZoom(zoom)
  }

  getZoom() {
    if (!this.mapInstance) return 0
    return this.mapInstance.getZoom()
  }

  destroy() {
    this.clearOverlays()

    if (this._unsubscribeLocation) {
      this._unsubscribeLocation()
      this._unsubscribeLocation = null
    }

    if (this.locationMarker && this.mapInstance) {
      this.mapInstance.remove(this.locationMarker)
      this.locationMarker = null
    }

    if (this.accuracyCircle && this.mapInstance) {
      this.mapInstance.remove(this.accuracyCircle)
      this.accuracyCircle = null
    }

    if (this.mapInstance) {
      this.mapInstance.destroy()
      this.mapInstance = null
    }

    this.geolocation = null
    this.geocoder = null
    this.markers = []
    this.circles = []
    this.polygons = []
    this._lastLocation = null
    this._lastHeading = null
  }
}
