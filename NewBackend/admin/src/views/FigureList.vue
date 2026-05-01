<template>
  <div class="page-container">
    <div class="page-header">
      <h2>人物管理</h2>
      <el-button type="primary" :icon="Plus" @click="$router.push('/figures/create')">
        新建人物
      </el-button>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索人物名称"
        clearable
        style="width: 240px"
        @clear="fetchData"
        @keyup.enter="fetchData"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="category" placeholder="分类" clearable style="width: 140px" @change="fetchData">
        <el-option label="人物" value="figure" />
        <el-option label="遗址" value="site" />
      </el-select>
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>

    <el-table :data="figures" stripe border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" width="120" />
      <el-table-column prop="title" label="标题" width="160" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="80">
        <template #default="{ row }">
          <el-tag :type="row.category === 'figure' ? '' : 'warning'" size="small">
            {{ row.category === 'figure' ? '人物' : '遗址' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="地点" width="120" show-overflow-tooltip />
      <el-table-column prop="brief_intro" label="简介" min-width="200" show-overflow-tooltip />
      <el-table-column prop="is_active" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
            {{ row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="70" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="$router.push(`/figures/${row.id}`)">
            编辑
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
import { figureApi } from '../api/figures'

const figures = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')
const category = ref('')

async function fetchData() {
  loading.value = true
  try {
    const res = await figureApi.getList({
      page: page.value,
      page_size: pageSize.value,
      keyword: keyword.value || undefined,
      category: category.value || undefined,
    })
    figures.value = res.data?.items || res.data || []
    total.value = res.data?.total || figures.value.length
  } catch {} finally {
    loading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除人物 "${row.name}" 吗？此操作不可恢复。`, '删除确认', {
      type: 'warning',
    })
    await figureApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {}
}

onMounted(fetchData)
</script>
