<template>
  <div class="page-container">
    <div class="page-header">
      <h2>对话记录</h2>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        placeholder="搜索对话内容"
        clearable
        style="width: 240px"
        @keyup.enter="fetchData"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-input v-model="filters.user_id" placeholder="用户ID" clearable style="width: 120px" />
      <el-input v-model="filters.figure_id" placeholder="人物ID" clearable style="width: 120px" />
      <el-button type="primary" @click="fetchData">查询</el-button>
    </div>

    <el-table :data="conversations" stripe border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="user_id" label="用户ID" width="80" />
      <el-table-column prop="figure_id" label="人物ID" width="80" />
      <el-table-column prop="user_message" label="用户消息" min-width="200" show-overflow-tooltip />
      <el-table-column prop="ai_response" label="AI回复" min-width="250" show-overflow-tooltip />
      <el-table-column prop="created_at" label="时间" width="170">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row)">详情</el-button>
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

    <el-dialog v-model="detailVisible" title="对话详情" width="600px">
      <div v-if="currentRow" class="conversation-detail">
        <div class="msg-item user-msg">
          <div class="msg-label">用户消息</div>
          <div class="msg-content">{{ currentRow.user_message }}</div>
        </div>
        <div class="msg-item ai-msg">
          <div class="msg-label">AI回复</div>
          <div class="msg-content">{{ currentRow.ai_response }}</div>
        </div>
        <div class="msg-meta">
          <span>用户ID: {{ currentRow.user_id }}</span>
          <span>人物ID: {{ currentRow.figure_id }}</span>
          <span>时间: {{ formatTime(currentRow.created_at) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { conversationApi } from '../api/admin'

const conversations = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const detailVisible = ref(false)
const currentRow = ref(null)

const filters = reactive({
  keyword: '',
  user_id: '',
  figure_id: '',
})

async function fetchData() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: pageSize.value }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.user_id) params.user_id = filters.user_id
    if (filters.figure_id) params.figure_id = filters.figure_id
    const res = await conversationApi.getList(params)
    conversations.value = res.data?.items || res.data || []
    total.value = res.data?.total || conversations.value.length
  } catch {} finally {
    loading.value = false
  }
}

function showDetail(row) {
  currentRow.value = row
  detailVisible.value = true
}

function formatTime(val) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

onMounted(fetchData)
</script>

<style scoped>
.conversation-detail .msg-item {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
}
.conversation-detail .user-msg {
  background: #ecf5ff;
}
.conversation-detail .ai-msg {
  background: #f0f9eb;
}
.conversation-detail .msg-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}
.conversation-detail .msg-content {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.conversation-detail .msg-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
</style>
