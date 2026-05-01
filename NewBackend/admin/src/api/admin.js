import http from '../utils/http'

export const trackApi = {
  getList: (params) => http.get('/admin/tracks', { params }),
  getStats: () => http.get('/tracks/stats'),
}

export const conversationApi = {
  getList: (params) => http.get('/admin/conversations', { params }),
}

export const adminApi = {
  getDashboard: () => http.get('/admin/dashboard'),
  getStats: () => http.get('/admin/stats'),
  getConfig: () => http.get('/admin/config'),
  getConfigByKey: (key) => http.get(`/admin/config/${key}`),
  updateConfig: (key, data) => http.put(`/admin/config/${key}`, data),
  getLogs: (params) => http.get('/admin/logs', { params }),
}

export const mediaApi = {
  upload: (formData) =>
    http.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  getList: (params) => http.get('/media', { params }),
  delete: (id) => http.delete(`/media/${id}`),
}
