<template>
  <div class="page-container">
    <div class="page-header">
      <h2>围栏管理</h2>
      <div>
        <el-button @click="$router.push('/fences/map')">地图预览</el-button>
        <el-button type="primary" :icon="Plus" @click="$router.push('/fences/create')">
          新建围栏
        </el-button>
      </div>
    </div>

    <el-table :data="fences" stripe border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="围栏名称" width="180" />
      <el-table-column prop="shape_type" label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="row.shape_type === 'circle' ? '' : 'warning'" size="small">
            {{ row.shape_type === 'circle' ? '圆形' : '多边形' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联人物" width="120">
        <template #default="{ row }">
          {{ row.figure?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="中心/半径" width="200">
        <template #default="{ row }">
          <template v-if="row.shape_type === 'circle'">
            {{ row.center_lat?.toFixed(4) }}, {{ row.center_lng?.toFixed(4) }}
            <br />半径: {{ row.radius }}m
          </template>
          <template v-else>
            {{ row.polygon_coords?.length || 0 }} 个顶点
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="trigger_prompt" label="触发提示" min-width="200" show-overflow-tooltip />
      <el-table-column prop="is_active" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
            {{ row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="$router.push(`/fences/${row.id}`)">
            编辑
          </el-button>
          <el-button
            :type="row.is_active ? 'warning' : 'success'"
            size="small"
            @click="handleToggleStatus(row)"
          >
            {{ row.is_active ? '禁用' : '启用' }}
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { fenceApi } from '../api/fences'

const fences = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function fetchData() {
  loading.value = true
  try {
    const res = await fenceApi.getList({ page: page.value, page_size: pageSize.value })
    fences.value = res.data?.items || res.data || []
    total.value = res.data?.total || fences.value.length
  } catch {} finally {
    loading.value = false
  }
}

async function handleToggleStatus(row) {
  try {
    await fenceApi.toggleStatus(row.id)
    ElMessage.success(row.is_active ? '已禁用' : '已启用')
    fetchData()
  } catch {}
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除围栏 "${row.name}" 吗？`, '删除确认', { type: 'warning' })
    await fenceApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {}
}

onMounted(fetchData)
</script>
