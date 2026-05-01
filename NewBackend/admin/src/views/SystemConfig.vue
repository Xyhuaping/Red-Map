<template>
  <div class="page-container">
    <div class="page-header">
      <h2>系统配置</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card>
          <template #header><span>配置项管理</span></template>
          <el-table :data="configs" stripe v-loading="loading">
            <el-table-column prop="config_key" label="配置键" width="200" />
            <el-table-column prop="config_value" label="配置值" min-width="250">
              <template #default="{ row }">
                <template v-if="editing === row.config_key">
                  <el-input
                    v-model="editValue"
                    :type="isSecretKey(row.config_key) ? 'password' : 'text'"
                    show-password
                    size="small"
                  >
                    <template #append>
                      <el-button @click="saveConfig(row)" :loading="saving">保存</el-button>
                    </template>
                  </el-input>
                </template>
                <template v-else>
                  {{ isSecretKey(row.config_key) ? '••••••••' : (row.config_value || '(空)') }}
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="editing !== row.config_key"
                  type="primary"
                  link
                  size="small"
                  @click="startEdit(row)"
                >
                  编辑
                </el-button>
                <el-button
                  v-else
                  type="default"
                  link
                  size="small"
                  @click="cancelEdit"
                >
                  取消
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card>
          <template #header><span>系统信息</span></template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="应用名称">红色文化AR教育平台</el-descriptions-item>
            <el-descriptions-item label="后端版本">v2.0.0</el-descriptions-item>
            <el-descriptions-item label="API版本">v1</el-descriptions-item>
            <el-descriptions-item label="技术栈">FastAPI + Vue3</el-descriptions-item>
            <el-descriptions-item label="数据库">MySQL 8.0</el-descriptions-item>
            <el-descriptions-item label="AI服务">智谱 GLM-4</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header><span>快捷操作</span></template>
          <div style="display: flex; flex-direction: column; gap: 10px">
            <el-button @click="testAmapKey" :loading="testing">测试高德地图Key</el-button>
            <el-button @click="testZhipuKey" :loading="testing">测试智谱AI Key</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '../api/admin'
import http from '../utils/http'

const configs = ref([])
const loading = ref(false)
const editing = ref('')
const editValue = ref('')
const saving = ref(false)
const testing = ref(false)

const secretKeys = ['zhipu_api_key', 'amap_key', 'amap_security_code', 'secret_key']

function isSecretKey(key) {
  return secretKeys.includes(key)
}

async function fetchConfigs() {
  loading.value = true
  try {
    const res = await adminApi.getConfig()
    configs.value = res.data || []
  } catch {} finally {
    loading.value = false
  }
}

function startEdit(row) {
  editing.value = row.config_key
  editValue.value = row.config_value || ''
}

function cancelEdit() {
  editing.value = ''
  editValue.value = ''
}

async function saveConfig(row) {
  saving.value = true
  try {
    await adminApi.updateConfig(row.config_key, {
      config_value: editValue.value,
    })
    row.config_value = editValue.value
    editing.value = ''
    ElMessage.success('配置已更新')
  } catch {} finally {
    saving.value = false
  }
}

async function testAmapKey() {
  testing.value = true
  try {
    const res = await adminApi.getConfigByKey('amap_key')
    const key = res.data?.config_value
    if (!key) {
      ElMessage.warning('未配置高德地图Key')
      return
    }
    ElMessage.success('高德地图Key已配置，请在围栏地图页面验证')
  } catch {} finally {
    testing.value = false
  }
}

async function testZhipuKey() {
  testing.value = true
  try {
    await http.get('/health')
    ElMessage.success('后端服务运行正常')
  } catch {
    ElMessage.error('后端服务连接失败')
  } finally {
    testing.value = false
  }
}

onMounted(fetchConfigs)
</script>
