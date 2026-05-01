<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名/昵称"
        clearable
        style="width: 240px"
        @clear="fetchUsers"
        @keyup.enter="fetchUsers"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="fetchUsers">查询</el-button>
    </div>

    <el-table :data="users" stripe border v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="nickname" label="昵称" width="140" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
            {{ row.role === 'admin' ? '管理员' : '用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_active" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'warning'" size="small">
            {{ row.is_active ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_login_at" label="最后登录" width="170">
        <template #default="{ row }">{{ formatTime(row.last_login_at) }}</template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="170">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.role !== 'admin'"
            :type="row.role === 'user' ? 'warning' : 'info'"
            size="small"
            @click="handleChangeRole(row)"
          >
            {{ row.role === 'user' ? '设为管理员' : '设为用户' }}
          </el-button>
          <el-button
            :type="row.is_active ? 'danger' : 'success'"
            size="small"
            @click="handleToggleStatus(row)"
          >
            {{ row.is_active ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchUsers"
        @current-change="fetchUsers"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi } from '../api/users'

const users = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')

async function fetchUsers() {
  loading.value = true
  try {
    const res = await userApi.getList({ page: page.value, page_size: pageSize.value })
    users.value = res.data?.items || []
    total.value = res.data?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

async function handleChangeRole(row) {
  const newRole = row.role === 'user' ? 'admin' : 'user'
  const label = newRole === 'admin' ? '管理员' : '普通用户'
  try {
    await ElMessageBox.confirm(
      `确定将用户 "${row.username}" 的角色修改为 "${label}" 吗？`,
      '修改角色',
      { type: 'warning' }
    )
    await userApi.updateRole(row.id, newRole)
    ElMessage.success('角色修改成功')
    fetchUsers()
  } catch {}
}

async function handleToggleStatus(row) {
  const action = row.is_active ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(
      `确定${action}用户 "${row.username}" 吗？`,
      `${action}用户`,
      { type: 'warning' }
    )
    await userApi.updateStatus(row.id, !row.is_active)
    ElMessage.success(`${action}成功`)
    fetchUsers()
  } catch {}
}

function formatTime(val) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

onMounted(fetchUsers)
</script>
