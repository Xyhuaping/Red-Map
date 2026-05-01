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
        await this.initGeolocation()
        await this.initGeocoder()
      }
      
      this.renderFences()
      this.bindEvents()
    } catch (error) {
      console.error('Failed to initialize map:', error)
    }
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
            this.addLocationMarker(location)

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
      // Map click handler if needed
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

  addLocationMarker(location) {
    if (!this.mapInstance || !location) return

    if (this.locationMarker) {
      this.locationMarker.setPosition([location.lng, location.lat])
    } else {
      this.locationMarker = new AMap.Marker({
        position: [location.lng, location.lat],
        icon: new AMap.Icon({
          size: new AMap.Size(25, 34),
          imageSize: new AMap.Size(25, 34),
          image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png'
        }),
        offset: new AMap.Pixel(-12, -34),
        zIndex: 1000
      })
      this.mapInstance.add(this.locationMarker)
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
      if (this.mapInstance) this.mapInstance.remove(circle)
    })
    this.circles = []

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

    if (this.locationMarker && this.mapInstance) {
      this.mapInstance.remove(this.locationMarker)
      this.locationMarker = null
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
  }
}