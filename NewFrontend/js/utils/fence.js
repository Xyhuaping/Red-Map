import locationService from './location.js'
import { mapStore } from '../store/index.js'

class FenceService {
  constructor() {
    this.earthRadius = 6371000
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  toDegrees(radians) {
    return radians * (180 / Math.PI)
  }

  calculateDistance(point1, point2) {
    if (!point1 || !point2) return 0

    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * 
              Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return this.earthRadius * c
  }

  isInsideCircleFence(point, fence) {
    if (!point || !fence || fence.shape_type !== 'circle') {
      return false
    }

    const center = {
      lng: fence.center_lng,
      lat: fence.center_lat
    }

    const distance = this.calculateDistance(point, center)
    
    return distance <= fence.radius
  }

  isInsidePolygonFence(point, fence) {
    if (!point || !fence || fence.shape_type !== 'polygon') {
      return false
    }

    if (!fence.polygon_coords || fence.polygon_coords.length < 3) {
      return false
    }

    return this.isPointInPolygon(point, fence.polygon_coords)
  }

  isPointInPolygon(point, polygon) {
    if (!point || !polygon || polygon.length < 3) {
      return false
    }

    let inside = false
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng,
            yi = polygon[i].lat
      const xj = polygon[j].lng,
            yj = polygon[j].lat

      const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
        (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)

      if (intersect) {
        inside = !inside
      }
    }

    return inside
  }

  isInsideAnyFence(point, fences) {
    if (!point || !fences || fences.length === 0) {
      return false
    }

    for (const fence of fences) {
      if (this.isInsideFence(point, fence)) {
        return true
      }
    }

    return false
  }

  isInsideFence(point, fence) {
    if (!fence) return false

    switch (fence.shape_type) {
      case 'circle':
        return this.isInsideCircleFence(point, fence)
      
      case 'polygon':
        return this.isInsidePolygonFence(point, fence)
      
      default:
        console.warn(`Unknown fence shape type: ${fence.shape_type}`)
        return false
    }
  }

  findTriggeredFences(point, fences) {
    if (!point || !fences || fences.length === 0) {
      return []
    }

    const triggeredFences = []

    for (const fence of fences) {
      if (this.isInsideFence(point, fence)) {
        triggeredFences.push(fence)
        
        mapStore.addTriggeredFence(fence)
      }
    }

    return triggeredFences
  }

  getDistanceToFence(point, fence) {
    if (!point || !fence) return Infinity

    switch (fence.shape_type) {
      case 'circle': {
        const center = { lng: fence.center_lng, lat: fence.center_lat }
        const distance = this.calculateDistance(point, center)
        return Math.max(0, distance - fence.radius)
      }
      
      case 'polygon': {
        if (this.isInsidePolygonFence(point, fence)) {
          return 0
        }
        
        return this.getDistanceToPolygonEdge(point, fence.polygon_coords)
      }
      
      default:
        return Infinity
    }
  }

  getDistanceToPolygonEdge(point, polygon) {
    if (!point || !polygon || polygon.length === 0) {
      return Infinity
    }

    let minDistance = Infinity

    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i]
      const p2 = polygon[(i + 1) % polygon.length]
      
      const distance = this.getDistanceToLineSegment(point, p1, p2)
      minDistance = Math.min(minDistance, distance)
    }

    return minDistance
  }

  getDistanceToLineSegment(point, lineStart, lineEnd) {
    if (!point || !lineStart || !lineEnd) return Infinity

    const A = point.lng - lineStart.lng
    const B = point.lat - lineStart.lat
    const C = lineEnd.lng - lineStart.lng
    const D = lineEnd.lat - lineStart.lat

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    let param = -1
    
    if (lenSq !== 0) {
      param = dot / lenSq
    }

    let xx, yy

    if (param < 0) {
      xx = lineStart.lng
      yy = lineStart.lat
    } else if (param > 1) {
      xx = lineEnd.lng
      yy = lineEnd.lat
    } else {
      xx = lineStart.lng + param * C
      yy = lineStart.lat + param * D
    }

    const dx = point.lng - xx
    const dy = point.lat - yy

    return Math.sqrt(dx * dx + dy * dy)
  }

  getNearestFence(point, fences) {
    if (!point || !fences || fences.length === 0) {
      return null
    }

    let nearestFence = null
    let minDistance = Infinity

    for (const fence of fences) {
      const distance = this.getDistanceToFence(point, fence)
      
      if (distance < minDistance) {
        minDistance = distance
        nearestFence = fence
      }
    }

    return nearestFence ? { ...nearestFence, distance: minDistance } : null
  }

  async checkFenceWithBackend(longitude, latitude, requestFn) {
    try {
      const result = await requestFn({ longitude, latitude })
      return result
    } catch (error) {
      console.error('Backend fence check failed:', error)
      return null
    }
  }

  formatDistance(meters) {
    if (meters < 0) return '0m'
    
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  }
}

const fenceService = new FenceService()
export default fenceService
export { FenceService }