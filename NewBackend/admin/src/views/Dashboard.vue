<template>
  <div class="page-container">
    <div class="page-header">
      <h2>仪表盘</h2>
      <el-button :icon="Refresh" @click="fetchData">刷新数据</el-button>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="36" color="#D93025"><User /></el-icon>
            <div class="stat-value">{{ dashboard.total_users }}</div>
            <div class="stat-label">注册用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="36" color="#E6A23C"><Avatar /></el-icon>
            <div class="stat-value">{{ dashboard.total_figures }}</div>
            <div class="stat-label">红色人物</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="36" color="#67C23A"><Location /></el-icon>
            <div class="stat-value">{{ dashboard.total_fences }}</div>
            <div class="stat-label">电子围栏</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="36" color="#409EFF"><ChatDotRound /></el-icon>
            <div class="stat-value">{{ dashboard.total_conversations }}</div>
            <div class="stat-label">对话次数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="36" color="#909399"><MapLocation /></el-icon>
            <div class="stat-value">{{ dashboard.total_tracks }}</div>
            <div class="stat-label">轨迹记录</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="36" color="#F56C6C"><Clock /></el-icon>
            <div class="stat-value">{{ dashboard.today_active_users }}</div>
            <div class="stat-label">今日活跃</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="36" color="#D93025"><ChatLineSquare /></el-icon>
            <div class="stat-value">{{ dashboard.today_conversations }}</div>
            <div class="stat-label">今日对话</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <el-icon :size="36" color="#67C23A"><Position /></el-icon>
            <div class="stat-value">{{ dashboard.today_fence_triggers }}</div>
            <div class="stat-label">今日围栏触发</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>最近注册用户</span></template>
          <el-table :data="dashboard.recent_users" size="small" stripe>
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="nickname" label="昵称" />
            <el-table-column prop="role" label="角色">
              <template #default="{ row }">
                <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
                  {{ row.role === 'admin' ? '管理员' : '用户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="注册时间">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>最近对话记录</span></template>
          <el-table :data="dashboard.recent_conversations" size="small" stripe>
            <el-table-column prop="user_id" label="用户ID" width="70" />
            <el-table-column prop="figure_id" label="人物ID" width="70" />
            <el-table-column prop="user_message" label="用户消息" show-overflow-tooltip />
            <el-table-column prop="created_at" label="时间">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { adminApi } from '../api/admin'

const dashboard = ref({
  total_users: 0,
  total_figures: 0,
  total_fences: 0,
  total_conversations: 0,
  total_tracks: 0,
  today_active_users: 0,
  today_conversations: 0,
  today_fence_triggers: 0,
  recent_users: [],
  recent_conversations: [],
})

async function fetchData() {
  try {
    const res = await adminApi.getDashboard()
    dashboard.value = res.data
  } catch {}
}

function formatTime(val) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN')
}

onMounted(fetchData)
</script>

<style scoped>
.stat-row .el-card {
  border-top: 3px solid var(--primary-color);
}
</style>
