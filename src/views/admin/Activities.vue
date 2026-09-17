<template>
  <div class="page">
    <!-- 头部 -->
    <header class="page-head">
      <div class="page-copy">
        <p class="eyebrow page-eyebrow">Activities</p>
        <h2 class="display-md page-title">场次管理</h2>
        <p class="page-sub">创建秒杀场次 · 预热库存 · 下发抢购地址</p>
      </div>
      <el-button type="primary" size="large" :icon="Plus" @click="showCreateDialog = true">
        创建场次
      </el-button>
    </header>

    <!-- 统计 -->
    <div class="stats">
      <div class="stat">
        <span class="stat-label">总场次</span>
        <span class="stat-num display-md">{{ activities.length }}</span>
      </div>
      <div class="stat stat--featured">
        <span class="stat-label">抢购中</span>
        <span class="stat-num display-md">{{ activeCount }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">未开始</span>
        <span class="stat-num display-md">{{ pendingCount }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">已结束</span>
        <span class="stat-num display-md">{{ endedCount }}</span>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-wrap">
      <el-table :data="pagedActivities" v-loading="loading" class="table">
        <el-table-column prop="id" label="场次ID" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mono cell-id">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="场次名称" min-width="180" />
        <el-table-column prop="productId" label="商品ID" width="100" />
        <el-table-column prop="price" label="秒杀价" width="110">
          <template #default="{ row }">
            <span class="price">¥{{ row.price || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="90" />
        <el-table-column label="活动时间" width="230">
          <template #default="{ row }">
            <span class="mono cell-time">{{ formatTime(row.startTime) }} ~ {{ formatTime(row.endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span v-if="row.status === 0" class="tag">未开始</span>
            <span v-else-if="row.status === 1" class="tag tag--ink">抢购中</span>
            <span v-else class="tag tag--outline">已结束</span>
          </template>
        </el-table-column>
        <el-table-column label="预热" width="110">
          <template #default="{ row }">
            <span v-if="row.preheated" class="tag tag--aloe">已预热</span>
            <span v-else class="tag tag--outline">未预热</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button
                v-if="!row.preheated"
                size="small"
                @click="preheat(row)"
                :loading="preheatingId === row.id"
              >
                预热
              </el-button>
              <el-button v-if="row.status === 1" size="small" type="primary" @click="showAddress(row)">
                地址
              </el-button>
              <el-button size="small" @click="viewOrders(row)">订单</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="activities.length"
        v-model:current-page="currentPage"
        :page-size="pageSize"
      />
    </div>

    <!-- 创建场次 -->
    <el-dialog v-model="showCreateDialog" title="创建秒杀场次" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="场次名称" prop="title">
          <el-input v-model="createForm.title" placeholder="如：iPhone 16 限时抢购" />
        </el-form-item>
        <el-form-item label="商品ID" prop="productId">
          <el-input-number v-model="createForm.productId" :min="1" placeholder="商品ID" />
        </el-form-item>
        <el-form-item label="秒杀价(元)" prop="price">
          <el-input-number v-model="createForm.price" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number v-model="createForm.stock" :min="1" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="createForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="createForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width:100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createActivityFn">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 秒杀地址 -->
    <el-dialog v-model="showAddressDialog" title="秒杀地址" width="420px">
      <div class="address-display" v-if="currentAddress">
        <p class="address-tip eyebrow">抢购地址 · 6 位随机串</p>
        <div class="address-value">
          <code>{{ currentAddress.secret }}</code>
          <el-button :icon="CopyDocument" size="small" circle @click="copyAddress" />
        </div>
        <p class="address-url mono">POST /api/seckill/v1/{{ currentAddress.secret }}/order</p>
        <p class="address-ttl micro">有效期 {{ currentAddress.ttl }} 秒</p>
      </div>
      <div v-else class="address-empty">
        <p class="address-tip eyebrow">暂无可用地址</p>
        <el-button type="primary" @click="regenerateAddress">生成秒杀地址</el-button>
      </div>
      <template #footer v-if="currentAddress">
        <el-button @click="regenerateAddress">重新生成</el-button>
        <el-button type="primary" @click="showAddressDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createActivity, preheatActivity, listActivities, getAddress } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, CopyDocument } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const activities = ref([])
const currentPage = ref(1)
const pageSize = 10
const showCreateDialog = ref(false)
const showAddressDialog = ref(false)
const creating = ref(false)
const preheatingId = ref(null)
const currentAddress = ref(null)
const currentActivityForAddress = ref(null)
const createFormRef = ref(null)

const createForm = ref({
  title: '',
  productId: 1001,
  price: 99.00,
  stock: 100,
  startTime: dayjs().add(1, 'hour').toDate(),
  endTime: dayjs().add(3, 'hour').toDate()
})

const createRules = {
  title: [{ required: true, message: '请输入场次名称', trigger: 'blur' }],
  productId: [{ required: true, message: '请输入商品ID', trigger: 'blur' }],
  price: [{ required: true, message: '请输入秒杀价', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const pagedActivities = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return activities.value.slice(start, start + pageSize)
})

const activeCount = computed(() => activities.value.filter(a => a.status === 1).length)
const pendingCount = computed(() => activities.value.filter(a => a.status === 0).length)
const endedCount = computed(() => activities.value.filter(a => a.status === 2).length)

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return dayjs(timeStr).format('MM-DD HH:mm')
}

async function loadActivities() {
  loading.value = true
  try {
    const res = await listActivities()
    activities.value = (res.data || []).map(a => {
      const now = Date.now()
      const start = new Date(a.startTime).getTime()
      const end = new Date(a.endTime).getTime()
      a.status = now < start ? 0 : (now < end ? 1 : 2)
      return a
    })
    currentPage.value = 1
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function createActivityFn() {
  try {
    await createFormRef.value.validate()
  } catch {
    return
  }

  creating.value = true
  try {
    const payload = {
      title: createForm.value.title,
      startTime: dayjs(createForm.value.startTime).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(createForm.value.endTime).format('YYYY-MM-DD HH:mm:ss'),
      price: createForm.value.price,
      stocks: [
        { productId: createForm.value.productId, totalStock: createForm.value.stock }
      ]
    }
    await createActivity(payload)
    ElMessage.success('场次创建成功！')
    showCreateDialog.value = false
    await loadActivities()
  } catch {
    // error handled by api interceptor
  } finally {
    creating.value = false
  }
}

async function preheat(row) {
  preheatingId.value = row.id
  try {
    await preheatActivity(row.id)
    ElMessage.success(`场次「${row.title}」预热成功！`)
    row.preheated = true
  } finally {
    preheatingId.value = null
  }
}

async function showAddress(row) {
  currentActivityForAddress.value = row
  showAddressDialog.value = true
  try {
    const res = await getAddress(row.id)
    currentAddress.value = {
      secret: res.data.address,
      ttl: res.data.expiresInSeconds
    }
  } catch {
    currentAddress.value = null
  }
}

async function regenerateAddress() {
  const row = currentActivityForAddress.value
  if (!row) return
  try {
    const res = await getAddress(row.id)
    currentAddress.value = {
      secret: res.data.address,
      ttl: res.data.expiresInSeconds
    }
    ElMessage.success('新地址已生成')
  } catch {
    // already shown
  }
}

function copyAddress() {
  if (currentAddress.value) {
    navigator.clipboard.writeText(currentAddress.value.secret)
    ElMessage.success('地址已复制到剪贴板')
  }
}

function viewOrders(row) {
  ElMessageBox.confirm(
    `查看场次「${row.title}」的所有订单？`,
    '查看订单',
    { confirmButtonText: '查看', cancelButtonText: '取消' }
  ).then(() => {
    router.push('/admin/orders?activityId=' + row.id)
  }).catch(() => {})
}

onMounted(loadActivities)
</script>

<style scoped>
.page {
  padding: 44px 40px 80px;
  animation: riseIn .45s cubic-bezier(.2, .7, .3, 1) both;
}

/* ---------- 头部 ---------- */
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 36px;
}

.page-eyebrow {
  color: var(--shade-50);
  margin-bottom: 14px;
}

.page-title {
  color: var(--ink);
  margin-bottom: 10px;
}

.page-sub {
  font-size: 14px;
  color: var(--shade-50);
}

/* ---------- 统计 ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border-radius: var(--r-lg);
  background: var(--canvas-light);
  box-shadow: var(--elev-3);
}

.stat--featured {
  background: var(--aloe);
  box-shadow: none;
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--shade-50);
}

.stat--featured .stat-label {
  color: var(--shade-60);
}

.stat-num {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* ---------- 表格 ---------- */
.table-wrap {
  background: var(--canvas-light);
  border-radius: var(--r-lg);
  box-shadow: var(--elev-3);
  overflow: hidden;
}

.table {
  width: 100%;
}

.cell-id {
  font-size: 12px;
  color: var(--shade-50);
}

.cell-time {
  font-size: 12px;
  color: var(--shade-50);
}

.price {
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

/* ---------- 地址弹窗 ---------- */
.address-display {
  text-align: center;
  padding: 4px 0 8px;
}

.address-tip {
  color: var(--shade-50);
}

.address-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 20px 0;
}

.address-value code {
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 500;
  letter-spacing: 6px;
  color: var(--ink);
  background: var(--canvas-cream);
  border: 1px solid var(--hairline-light);
  padding: 12px 22px;
  border-radius: var(--r-lg);
}

.address-url {
  font-size: 12px;
  color: var(--shade-50);
  background: var(--canvas-cream);
  border: 1px solid var(--hairline-light);
  border-radius: var(--r-md);
  padding: 10px 12px;
  margin-bottom: 12px;
  word-break: break-all;
}

.address-ttl {
  color: var(--shade-40);
}

.address-empty {
  text-align: center;
  padding: 18px 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

@media (max-width: 1080px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .page { padding: 32px 24px 64px; }
}
</style>
