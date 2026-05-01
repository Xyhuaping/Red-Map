import request from '../utils/request.js'

class FiguresService {
  async getFigures(params = {}) {
    const data = await request.get('/api/figures', {
      skip: params.skip || 0,
      limit: params.limit || 100
    })

    return Array.isArray(data) ? data : []
  }

  async searchFigures(params = {}) {
    const data = await request.get('/api/figures/search', {
      keyword: params.keyword || '',
      category: params.category || '',
      page: params.page || 1,
      page_size: params.page_size || 20
    })

    return data || { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 }
  }

  async getFigure(id) {
    const data = await request.get(`/api/figures/${id}`)
    return data
  }
}

const figuresService = new FiguresService()
export default figuresService