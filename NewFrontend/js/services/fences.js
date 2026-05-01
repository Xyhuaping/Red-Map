import request from '../utils/request.js'

class FencesService {
  async getFences(params = {}) {
    const data = await request.get('/api/fences', {
      is_active: params.is_active !== undefined ? params.is_active : '',
      skip: params.skip || 0,
      limit: params.limit || 100
    })

    return Array.isArray(data) ? data : []
  }

  async getFence(id) {
    const data = await request.get(`/api/fences/${id}`)
    return data
  }

  async checkFence(longitude, latitude) {
    const data = await request.post('/api/fences/check', { longitude, latitude })
    return data
  }

  async toggleStatus(id) {
    const data = await request.patch(`/api/v1/fences/${id}/status`)
    return data
  }
}

const fencesService = new FencesService()
export default fencesService