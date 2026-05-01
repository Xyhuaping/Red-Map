<template>
  <div class="page-container">
    <div class="page-header">
      <h2>轨迹管理</h2>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="filters.user_id"
        placeholder="用户ID"
        clearable
        style="width: 120px"
      />
      <el-select v-model="filters.event_type" placeholder="事件类型" clearable style="width: 160px">
        <el-option label="围栏触发" value="fence_trigger" />
        <el-option label="位置更新" value="location_update" />
        <el-option label="对话触发" value="chat_trigger" />
      </el-select>
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
      <el-button @click="handleExport">导出</el-button>
    </div>

    <el-table :data="tracks" stripe border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="user_id" label="用户ID" width="80" />
      <el-table-column prop="event_type" label="事件类型" width="120">
        <template #default="{ row }">
          <el-tag :type="eventTypeTag(row.event_type)" size="small">
            {{ eventTypeName(row.event_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="位置" width="180">
        <template #default="{ row }">
          {{ row.latitude?.toFixed(4) }}, {{ row.longitude?.toFixed(4) }}
        </template>
      </el-table-column>
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.detail ? (typeof row.detail === 'string' ? row.detail : JSON.stringify(row.detail)) : '-' }}
        </template>
      </el-table-column>
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
import { trackApi } from '../api/admin'

const tracks = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filters = reactive({
  user_id: '',
  event_type: '',
  date_range: null,
})

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.user_id) params.user_id = filters.user_id
    if (filters.event_type) params.event_type = filters.event_type
    if (filters.date_range?.length === 2) {
      params.start_date = filters.date_range[0]
      params.end_date = filters.date_range[1]
    }
    const res = await trackApi.getList(params)
    tracks.value = res.data?.items || res.data || []
    total.value = res.data?.total || tracks.value.length
  } catch {} finally {
    loading.value = false
  }
}

function handleExport() {
  const headers = ['ID', '用户ID', '事件类型', '纬度', '经度', '地址', '时间']
  const rows = tracks.value.map((t) => [
    t.id, t.user_id, eventTypeName(t.event_type),
    t.latitude, t.longitude, t.address, t.created_at,
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `轨迹数据_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function eventTypeName(type) {
  const map = { fence_trigger: '围栏触发', location_update: '位置更新', chat_trigger: '对话触发' }
  return map[type] || type || '-'
}

function eventTypeTag(type) {
  const map = { fence_trigger: 'danger', location_update: '', chat_trigger: 'success' }
  return map[type] || 'info'
}

function formatTime(val) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

onMounted(fetchData)
</script>
