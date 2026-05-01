import http from '../utils/http'

export const fenceApi = {
  getList: (params) => http.get('/fences', { params }),
  getDetail: (id) => http.get(`/fences/${id}`),
  create: (data) => http.post('/fences', data),
  update: (id, data) => http.put(`/fences/${id}`, data),
  delete: (id) => http.delete(`/fences/${id}`),
  toggleStatus: (id) => http.patch(`/fences/${id}/status`),
  check: (data) => http.post('/fences/check', data),
}
