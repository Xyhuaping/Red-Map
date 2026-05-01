import http from '../utils/http'

export const userApi = {
  getList: (params) => http.get('/admin/users', { params }),
  updateRole: (id, role) => http.put(`/admin/users/${id}/role`, { role }),
  updateStatus: (id, is_active) => http.put(`/admin/users/${id}/status`, { is_active }),
}
