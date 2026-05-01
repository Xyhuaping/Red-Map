<template>
  <div class="page-container">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="filters.action"
        placeholder="操作类型"
        clearable
        style="width: 160px"
      />
      <el-input
        v-model="filters.user_id"
        placeholder="操作人ID"
        clearable
        style="width: 120px"
      />
      <el-date-picker
        v-model="filters.date_range"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 280px"
      />
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>

    <el-table :data="logs" stripe border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="user_id" label="操作人ID" width="90" />
      <el-table-column prop="action" label="操作类型" width="140">
        <template #default="{ row }">
          <el-tag :type="actionTag(row.action)" size="small">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resource_type" label="资源类型" width="100" />
      <el-table-column prop="resource_id" label="资源ID" width="80" />
      <el-table-column prop="detail" label="详情" min-width="250" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.detail ? (typeof row.detail === 'string' ? row.detail : JSON.stringify(row.detail)) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="ip_address" label="IP地址" width="130" />
      <el-table-column prop="created_at" label="时间" width="170">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '../api/admin'

const logs = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = reactive({
  action: '',
  user_id: '',
  date_range: null,
})

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.action) params.action = filters.action
    if (filters.user_id) params.user_id = filters.user_id
    if (filters.date_range?.length === 2) {
      params.start_date = filters.date_range[0]
      params.end_date = filters.date_range[1]
    }
    const res = await adminApi.getLogs(params)
    logs.value = res.data?.items || res.data || []
    total.value = res.data?.total || logs.value.length
  } catch {} finally {
    loading.value = false
  }
}

function actionTag(action) {
  const map = {
    login: 'success',
    create: '',
    update: 'warning',
    delete: 'danger',
    update_role: 'warning',
    update_status: 'warning',
  }
  return map[action] || 'info'
}

function formatTime(val) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

onMounted(fetchData)
</script>
