<template>
  <div class="page-container">
    <div class="page-header">
      <h2>围栏地图预览</h2>
      <el-button @click="$router.back()">返回列表</el-button>
    </div>
    <el-card>
      <div id="fence-overview-map" style="height: 600px; width: 100%"></div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { fenceApi } from '../api/fences'

let map = null

async function initMap() {
  try {
    const AMap = await AMapLoader.load({
      key: '4e90b4242ed26bcf402a0bb7f46197de',
      version: '2.0',
      plugins: ['AMap.CircleEditor', 'AMap.PolygonEditor'],
    })

    map = new AMap.Map('fence-overview-map', {
      zoom: 12,
      center: [104.065699, 30.580307],
    })

    const res = await fenceApi.getList({ page: 1, page_size: 200 })
    const fences = res.data?.items || res.data || []

    fences.forEach((fence) => {
      if (fence.shape_type === 'circle' && fence.center_lng && fence.center_lat) {
        const circle = new AMap.Circle({
          center: [fence.center_lng, fence.center_lat],
          radius: fence.radius,
          strokeColor: fence.color || '#D93025',
          fillColor: fence.color || '#D93025',
          fillOpacity: fence.is_active ? 0.15 : 0.05,
          strokeWeight: 2,
          strokeStyle: fence.is_active ? 'solid' : 'dashed',
        })
        circle.setMap(map)

        const marker = new AMap.Marker({
          position: [fence.center_lng, fence.center_lat],
          content: `<div style="background:${fence.is_active ? '#D93025' : '#999'};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;white-space:nowrap">${fence.name}</div>`,
          offset: new AMap.Pixel(-30, -10),
        })
        marker.setMap(map)
      } else if (fence.shape_type === 'polygon' && fence.polygon_coords?.length >= 3) {
        const path = fence.polygon_coords.map((p) => [p.lng, p.lat])
        const polygon = new AMap.Polygon({
          path,
          strokeColor: fence.color || '#D93025',
          fillColor: fence.color || '#D93025',
          fillOpacity: fence.is_active ? 0.15 : 0.05,
          strokeWeight: 2,
          strokeStyle: fence.is_active ? 'solid' : 'dashed',
        })
        polygon.setMap(map)
      }
    })

    if (fences.length > 0) {
      map.setFitView()
    }
  } catch (e) {
    console.error('地图加载失败:', e)
  }
}

onMounted(initMap)
</script>
