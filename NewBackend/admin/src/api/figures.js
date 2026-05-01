import http from '../utils/http'

export const figureApi = {
  getList: (params) => http.get('/figures', { params }),
  getDetail: (id) => http.get(`/figures/${id}`),
  create: (data) => http.post('/figures', data),
  update: (id, data) => http.put(`/figures/${id}`, data),
  delete: (id) => http.delete(`/figures/${id}`),
  search: (params) => http.get('/figures/search', { params }),
}
