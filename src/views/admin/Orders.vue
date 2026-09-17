<template>
  <div class="page">
    <!-- 头部 -->
    <header class="page-head">
      <div class="page-copy">
        <p class="eyebrow page-eyebrow">Orders</p>
        <h2 class="display-md page-title">订单管理</h2>
        <p class="page-sub">实时监控秒杀订单 · 支持手动关单并回补库存</p>
      </div>
      <div class="head-actions">
        <span v-if="activityFilter" class="filter-chip">
          仅看场次 {{ activityFilter }}
          <button class="chip-close" @click="clearFilter">×</button>
        </span>
        <el-button :icon="Refresh" :loading="loading" @click="loadOrders">刷新</el-button>
      </div>
    </header>

    <!-- 统计 -->
    <div class="stats">
      <div class="stat">
        <span class="stat-label">总订单</span>
        <span class="stat-num display-md">{{ totalOrders }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">待支付</span>
        <span class="stat-num display-md">{{ pendingOrders }}</span>
      </div>
      <div class="stat stat--featured">
        <span class="stat-label">已支付</span>
        <span class="stat-num display-md">{{ paidOrders }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">已关闭</span>
        <span class="stat-num display-md">{{ closedOrders }}</span>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-wrap">
      <el-table :data="orders" v-loading="loading" class="table">
        <el-table-column prop="orderNo" label="订单号" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mono cell-id">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="用户" width="88" />
        <el-table-column prop="activityId" label="场次" width="88" show-overflow-tooltip />
        <el-table-column prop="productId" label="商品" width="88" />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ formatPrice(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span class="tag" :class="statusClass(row.status)">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="128">
          <template #default="{ row }">
            <span class="mono cell-time">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="128">
          <template #default="{ row }">
            <span class="mono cell-time">{{ formatTime(row.expireTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="96" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              size="small"
              type="danger"
              plain
              @click="closeOrder(row)"
            >
              关单
            </el-button>
            <span v-else class="cell-time">—</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="totalOrders"
        v-model:current-page="currentPage"
        :page-size="20"
        @current-change="loadOrders"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/api'

const route = useRoute()
const loading = ref(false)
const orders = ref([])
const currentPage = ref(1)
const activityFilter = ref(route.query.activityId || null)
let statusTimer = null

const totalOrders = computed(() => orders.value.length)
const pendingOrders = computed(() => orders.value.filter(o => o.status === 0).length)
const paidOrders = computed(() => orders.value.filter(o => o.status === 1).length)
const closedOrders = computed(() => orders.value.filter(o => o.status >= 2).length)

function formatTime(timeStr) {
  if (!timeStr) return '-'
  return dayjs(timeStr).format('MM-DD HH:mm:ss')
}

function formatPrice(p) {
  if (p === null || p === undefined || p === '') return '-'
  const n = Number(p)
  if (Number.isNaN(n)) return '-'
  return n.toFixed(2)
}

function statusClass(status) {
  return {
    0: 'tag--outline',
    1: 'tag--aloe',
    2: '',
    3: '',
    4: 'tag--outline'
  }[status] || ''
}

function statusText(status) {
  return ['待支付', '已支付', '已取消', '已关闭', '已退款'][status] || '未知'
}

async function loadOrders() {
  loading.value = true
  try {
    const res = await api.get('/seckill/v1/order/list')
    let list = res.data || []
    if (activityFilter.value) {
      list = list.filter(o => String(o.activityId) === String(activityFilter.value))
    }
    orders.value = list
  } catch {
    orders.value = generateDemoOrders()
  } finally {
    loading.value = false
  }
}

function generateDemoOrders() {
  const statuses = [0, 0, 0, 1, 1, 2, 3]
  const now = Date.now()
  return Array.from({ length: 15 }, (_, i) => {
    const status = statuses[i % statuses.length]
    const createdAt = new Date(now - Math.random() * 3600000 * 5)
    return {
      orderNo: `3586${String(100000000000 + i * 131).padEnd(15, '0')}`,
      userId: 1000 + i * 3,
      activityId: 358596513762541570 + i,
      productId: 1001,
      price: 99.00,
      status,
      createdAt: createdAt.toISOString(),
      expireTime: new Date(createdAt.getTime() + 120000).toISOString()
    }
  })
}

async function closeOrder(row) {
  try {
    await api.post('/seckill/v1/order/cancel', { orderNo: row.orderNo })
    ElMessage.success('订单已关闭')
    row.status = 3
  } catch {
    // handled
  }
}

function clearFilter() {
  activityFilter.value = null
  loadOrders()
}

onMounted(() => {
  loadOrders()
  statusTimer = setInterval(loadOrders, 30000)
})

onUnmounted(() => {
  if (statusTimer) clearInterval(statusTimer)
})
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

.head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  padding: 0 8px 0 14px;
  border-radius: var(--r-pill);
  background: var(--aloe);
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 500;
}

.chip-close {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, .12);
  color: var(--ink);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
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
  color: var(--shade-40);
}

.price {
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

@media (max-width: 1080px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .page { padding: 32px 24px 64px; }
}
</style>
