<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑人物' : '新建人物' }}</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 800px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入人物名称" />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入人物标题" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-radio-group v-model="form.category">
            <el-radio value="figure">人物</el-radio>
            <el-radio value="site">遗址</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出生年份">
              <el-input-number v-model="form.birth_year" :min="1800" :max="2100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="逝世年份">
              <el-input-number v-model="form.death_year" :min="1800" :max="2100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="如：四川内江" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            :show-file-list="false"
            :http-request="handleUpload"
            accept="image/*"
          >
            <el-image
              v-if="form.avatar_url"
              :src="form.avatar_url"
              style="width: 120px; height: 120px"
              fit="cover"
            />
            <el-button v-else type="primary" size="small">上传头像</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="VR模型">
          <el-input v-model="form.vr_model_url" placeholder="VR模型URL（选填）" />
        </el-form-item>
        <el-form-item label="简介" prop="brief_intro">
          <el-input
            v-model="form.brief_intro"
            type="textarea"
            :rows="3"
            placeholder="请输入人物简介"
          />
        </el-form-item>
        <el-form-item label="详细介绍">
          <el-input
            v-model="form.full_bio"
            type="textarea"
            :rows="6"
            placeholder="请输入详细介绍"
          />
        </el-form-item>
        <el-form-item label="AI提示词">
          <el-input
            v-model="form.prompt_template"
            type="textarea"
            :rows="4"
            placeholder="AI对话的提示词模板，定义人物的性格和对话风格"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序权重">
              <el-input-number v-model="form.sort_order" :min="0" :max="9999" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">
            {{ isEdit ? '保存修改' : '创建人物' }}
          </el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { figureApi } from '../api/figures'
import { mediaApi } from '../api/admin'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const saving = ref(false)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  name: '',
  title: '',
  category: 'figure',
  birth_year: null,
  death_year: null,
  location: '',
  avatar_url: '',
  vr_model_url: '',
  brief_intro: '',
  full_bio: '',
  prompt_template: '',
  is_active: true,
  sort_order: 0,
})

const rules = {
  name: [{ required: true, message: '请输入人物名称', trigger: 'blur' }],
  brief_intro: [{ required: true, message: '请输入人物简介', trigger: 'blur' }],
}

async function loadFigure() {
  if (!isEdit.value) return
  try {
    const res = await figureApi.getDetail(route.params.id)
    const data = res.data
    Object.keys(form).forEach((key) => {
      if (data[key] !== undefined) form[key] = data[key]
    })
  } catch {
    ElMessage.error('加载人物信息失败')
    router.back()
  }
}

async function handleUpload(options) {
  const formData = new FormData()
  formData.append('file', options.file)
  formData.append('category', 'avatar')
  try {
    const res = await mediaApi.upload(formData)
    form.avatar_url = res.data?.url || res.data?.file_url || ''
    ElMessage.success('上传成功')
  } catch {
    ElMessage.error('上传失败')
  }
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    if (isEdit.value) {
      await figureApi.update(route.params.id, form)
      ElMessage.success('修改成功')
    } else {
      await figureApi.create(form)
      ElMessage.success('创建成功')
    }
    router.push('/figures')
  } catch {} finally {
    saving.value = false
  }
}

onMounted(loadFigure)
</script>
