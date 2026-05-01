<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑围栏' : '新建围栏' }}</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="10">
        <el-card>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
          >
            <el-form-item label="围栏名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入围栏名称" />
            </el-form-item>
            <el-form-item label="围栏类型" prop="shape_type">
              <el-radio-group v-model="form.shape_type" @change="handleShapeChange">
                <el-radio value="circle">圆形围栏</el-radio>
                <el-radio value="polygon">多边形围栏</el-radio>
              </el-radio-group>
            </el-form-item>

            <template v-if="form.shape_type === 'circle'">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="中心纬度">
                    <el-input-number
                      v-model="form.center_lat"
                      :precision="6"
                      :step="0.001"
                      :min="-90"
                      :max="90"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="中心经度">
                    <el-input-number
                      v-model="form.center_lng"
                      :precision="6"
                      :step="0.001"
                      :min="-180"
                      :max="180"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="半径(米)">
                <el-input-number v-model="form.radius" :min="10" :max="100000" :step="50" style="width: 100%" />
              </el-form-item>
            </template>

            <template v-if="form.shape_type === 'polygon'">
              <el-form-item label="多边形坐标">
                <el-input
                  v-model="polygonText"
                  type="textarea"
                  :rows="4"
                  placeholder='JSON格式: [{"lng":104.065,"lat":30.580},...]'
                  @blur="parsePolygon"
                />
              </el-form-item>
            </template>

            <el-form-item label="关联人物">
              <el-select v-model="form.figure_id" placeholder="选择关联人物" clearable filterable style="width: 100%">
                <el-option
                  v-for="fig in figures"
                  :key="fig.id"
                  :label="fig.name"
                  :value="fig.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="触发提示词">
              <el-input
                v-model="form.trigger_prompt"
                type="textarea"
                :rows="3"
                placeholder="用户进入围栏时显示的提示文字"
              />
            </el-form-item>
            <el-form-item label="围栏颜色">
              <el-color-picker v-model="form.color" />
            </el-form-item>
            <el-form-item label="状态">
              <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">
                {{ isEdit ? '保存修改' : '创建围栏' }}
              </el-button>
              <el-button @click="$router.back()">取消</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>地图绘制</span>
              <el-button-group>
                <el-button
                  :type="drawing ? 'danger' : 'primary'"
                  size="small"
                  @click="toggleDraw"
                >
                  {{ drawing ? '结束绘制' : '开始绘制' }}
                </el-button>
                <el-button size="small" @click="clearDraw">清除</el-button>
              </el-button-group>
            </div>
          </template>
          <div id="fence-edit-map" style="height: 500px; width: 100%"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AMapLoader from '@amap/amap-jsapi-loader'
import { fenceApi } from '../api/fences'
import { figureApi } from '../api/figures'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const saving = ref(false)
const drawing = ref(false)
const polygonText = ref('')

const isEdit = computed(() => !!route.params.id)

let map = null
let AMap = null
let currentOverlay = null
let editor = null

const form = reactive({
  name: '',
  shape_type: 'circle',
  center_lng: 104.065699,
  center_lat: 30.580307,
  radius: 200,
  polygon_coords: [],
  figure_id: null,
  trigger_prompt: '',
  color: '#D93025',
  is_active: true,
})

const figures = ref([])

const rules = {
  name: [{ required: true, message: '请输入围栏名称', trigger: 'blur' }],
  shape_type: [{ required: true, message: '请选择围栏类型', trigger: 'change' }],
}

async function loadFigures() {
  try {
    const res = await figureApi.getList({ page: 1, page_size: 200 })
    figures.value = res.data?.items || res.data || []
  } catch {}
}

async function loadFence() {
  if (!isEdit.value) return
  try {
    const res = await fenceApi.getDetail(route.params.id)
    const data = res.data
    Object.keys(form).forEach((key) => {
      if (data[key] !== undefined) form[key] = data[key]
    })
    if (data.polygon_coords) {
      polygonText.value = JSON.stringify(data.polygon_coords, null, 2)
    }
    await nextTick()
    renderOverlay()
  } catch {
    ElMessage.error('加载围栏信息失败')
    router.back()
  }
}

async function initMap() {
  try {
    AMap = await AMapLoader.load({
      key: '4e90b4242ed26bcf402a0bb7f46197de',
      version: '2.0',
      plugins: ['AMap.CircleEditor', 'AMap.PolygonEditor', 'AMap.Geocoder'],
    })
    map = new AMap.Map('fence-edit-map', {
      zoom: 15,
      center: [form.center_lng, form.center_lat],
    })
    renderOverlay()
  } catch (e) {
    console.error('地图加载失败:', e)
  }
}

function renderOverlay() {
  if (!map || !AMap) return
  clearOverlay()

  if (form.shape_type === 'circle' && form.center_lng && form.center_lat && form.radius) {
    currentOverlay = new AMap.Circle({
      center: [form.center_lng, form.center_lat],
      radius: form.radius,
      strokeColor: form.color || '#D93025',
      fillColor: form.color || '#D93025',
      fillOpacity: 0.15,
      strokeWeight: 2,
    })
    map.add(currentOverlay)
    map.setFitView([currentOverlay])
  } else if (form.shape_type === 'polygon' && form.polygon_coords?.length >= 3) {
    const path = form.polygon_coords.map((p) => [p.lng, p.lat])
    currentOverlay = new AMap.Polygon({
      path,
      strokeColor: form.color || '#D93025',
      fillColor: form.color || '#D93025',
      fillOpacity: 0.15,
      strokeWeight: 2,
    })
    map.add(currentOverlay)
    map.setFitView([currentOverlay])
  }
}

function clearOverlay() {
  if (editor) {
    editor.close()
    editor = null
  }
  if (currentOverlay) {
    map.remove(currentOverlay)
    currentOverlay = null
  }
}

function toggleDraw() {
  if (drawing.value) {
    finishDraw()
    return
  }

  clearOverlay()
  drawing.value = true

  if (form.shape_type === 'circle') {
    const circle = new AMap.Circle({
      center: map.getCenter(),
      radius: form.radius || 200,
      strokeColor: form.color || '#D93025',
      fillColor: form.color || '#D93025',
      fillOpacity: 0.15,
      strokeWeight: 2,
    })
    map.add(circle)
    currentOverlay = circle
    editor = new AMap.CircleEditor(map, circle)
    editor.open()
    editor.on('move', (e) => {
      const c = circle.getCenter()
      form.center_lng = parseFloat(c.lng.toFixed(6))
      form.center_lat = parseFloat(c.lat.toFixed(6))
    })
    editor.on('adjust', () => {
      form.radius = Math.round(circle.getRadius())
    })
  } else {
    const polygon = new AMap.Polygon({
      strokeColor: form.color || '#D93025',
      fillColor: form.color || '#D93025',
      fillOpacity: 0.15,
      strokeWeight: 2,
    })
    map.add(polygon)
    currentOverlay = polygon
    editor = new AMap.PolygonEditor(map, polygon)
    editor.open()
  }
}

function finishDraw() {
  drawing.value = false
  if (editor) {
    editor.close()

    if (form.shape_type === 'circle' && currentOverlay) {
      const c = currentOverlay.getCenter()
      form.center_lng = parseFloat(c.lng.toFixed(6))
      form.center_lat = parseFloat(c.lat.toFixed(6))
      form.radius = Math.round(currentOverlay.getRadius())
    }

    if (form.shape_type === 'polygon' && currentOverlay) {
      const path = currentOverlay.getPath()
      form.polygon_coords = path.map((p) => ({
        lng: parseFloat(p.lng.toFixed(6)),
        lat: parseFloat(p.lat.toFixed(6)),
      }))
      polygonText.value = JSON.stringify(form.polygon_coords, null, 2)
    }
  }
}

function clearDraw() {
  drawing.value = false
  clearOverlay()
}

function handleShapeChange() {
  clearDraw()
  renderOverlay()
}

function parsePolygon() {
  try {
    const parsed = JSON.parse(polygonText.value)
    if (Array.isArray(parsed) && parsed.length >= 3) {
      form.polygon_coords = parsed
      renderOverlay()
    }
  } catch {}
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload = { ...form }
    if (payload.shape_type === 'polygon' && polygonText.value) {
      try {
        payload.polygon_coords = JSON.parse(polygonText.value)
      } catch {
        ElMessage.error('多边形坐标格式错误')
        return
      }
    }

    if (isEdit.value) {
      await fenceApi.update(route.params.id, payload)
      ElMessage.success('修改成功')
    } else {
      await fenceApi.create(payload)
      ElMessage.success('创建成功')
    }
    router.push('/fences')
  } catch {} finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadFigures()
  await loadFence()
  initMap()
})
</script>
