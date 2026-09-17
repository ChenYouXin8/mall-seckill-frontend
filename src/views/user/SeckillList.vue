<template>
  <div class="seckill-list rise-in">
    <!-- 电影感主视觉 -->
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow hero-eyebrow">Flash Sale · 限时抢购</p>
        <h1 class="display-xl hero-title">秒杀场次</h1>
        <p class="hero-sub">限时低价 · 先到先得 · 当前 {{ filteredActivities.length }} 个场次</p>
      </div>

      <div class="hero-side">
        <div class="filters">
          <button
            v-for="f in filters"
            :key="f.value"
            class="filter-pill"
            :class="{ 'is-active': filterStatus === f.value }"
            @click="filterStatus = f.value"
          >
            {{ f.label }}
          </button>
        </div>
        <el-button class="pill-outline-dark refresh-btn" :loading="loading" @click="loadActivities">
          <el-icon><Refresh /></el-icon>&nbsp;刷新
        </el-button>
      </div>
    </section>

    <!-- 空状态 -->
    <div v-if="!loading && filteredActivities.length === 0" class="empty">
      <p class="empty-title display-md">暂无场次</p>
      <p class="empty-sub">去管理后台创建一个秒杀场次吧</p>
      <el-button class="pill-solid-white" @click="$router.push('/admin')">去创建</el-button>
    </div>

    <!-- 场次卡片 -->
    <section class="grid" v-loading="loading" element-loading-background="rgba(0,0,0,.6)">
      <article v-for="act in filteredActivities" :key="act.id" class="act-card">
        <!-- 状态行 -->
        <header class="card-head">
          <span v-if="act.status === 0" class="tag tag--ghost-dark">即将开始</span>
          <span v-else-if="act.status === 1" class="tag tag--solid-dark">抢购中</span>
          <span v-else class="tag tag--ghost-dark">已结束</span>
          <span class="card-index mono">#{{ act.id }}</span>
        </header>

        <!-- 影像框 -->
        <div class="card-photo">
          <span class="photo-cap mono">PRODUCT</span>
          <span class="photo-glyph mono">{{ act.productId ?? '—' }}</span>
        </div>

        <h3 class="card-title">{{ act.title }}</h3>

        <div class="card-price-row">
          <span class="card-price"><i>¥</i>{{ act.price ?? '—' }}</span>
          <span class="card-stock">剩余 {{ act.stock ?? 0 }} 件</span>
        </div>

        <div class="bar">
          <span class="bar-inner" :style="{ width: stockPercent(act) + '%' }"></span>
        </div>
        <div class="bar-label">
          <span>已抢 {{ soldCount(act) }} 件</span>
          <span>共 {{ act.totalStock ?? '—' }} 件</span>
        </div>

        <div class="card-meta mono">
          <span>{{ formatTime(act.startTime) }}</span>
          <span class="arrow">→</span>
          <span>{{ formatTime(act.endTime) }}</span>
        </div>

        <!-- 操作 -->
        <footer class="card-foot">
          <div v-if="act.status === 0" class="countdown-area">
            <p class="countdown-label">距开始</p>
            <Countdown :targetTime="act.startTime" @end="onCountdownEnd(act)" />
          </div>

          <el-button
            v-else-if="act.status === 1"
            class="pill-solid-white cta"
            size="large"
            @click="goSeckill(act)"
          >
            立即抢购
          </el-button>

          <el-button v-else class="pill-outline-dark cta" size="large" disabled>
            已结束
          </el-button>

          <el-button class="pill-ghost-dark detail-link" @click="$router.push(`/seckill/${act.id}`)">
            查看详情 →
          </el-button>
        </footer>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { listActivities } from '@/api'
import Countdown from '@/components/Countdown.vue'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const activities = ref([])
const loading = ref(false)
const filterStatus = ref('all')
let refreshTimer = null

const filters = [
  { label: '全部', value: 'all' },
  { label: '抢购中', value: '1' },
  { label: '未开始', value: '0' },
  { label: '已结束', value: '2' }
]

const filteredActivities = computed(() => {
  if (filterStatus.value === 'all') return activities.value
  return activities.value.filter(a => String(a.status) === filterStatus.value)
})

function totalOf(act) {
  return Number(act.totalStock ?? act.stock ?? 0)
}

function soldCount(act) {
  return Math.max(0, totalOf(act) - Number(act.stock ?? 0))
}

function stockPercent(act) {
  const total = totalOf(act)
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((Number(act.stock ?? 0) / total) * 100)))
}

function formatTime(timeStr) {
  if (!timeStr) return '--'
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

async function loadActivities() {
  loading.value = true
  try {
    const res = await listActivities()
    activities.value = res.data || []
    updateStatuses()
  } catch {
    // 错误已在 api 拦截器处理
  } finally {
    loading.value = false
  }
}

function updateStatuses() {
  const now = Date.now()
  activities.value.forEach(act => {
    if (!act.startTime || !act.endTime) return
    const start = new Date(act.startTime).getTime()
    const end = new Date(act.endTime).getTime()
    act.status = now < start ? 0 : (now < end ? 1 : 2)
  })
}

function onCountdownEnd(act) {
  act.status = 1
}

function goSeckill(act) {
  router.push(`/seckill/${act.id}`)
}

onMounted(() => {
  loadActivities()
  refreshTimer = setInterval(loadActivities, 10000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
/* ---------- 主视觉 ---------- */
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
  padding: 72px 0 48px;
  background: var(--canvas-night);
}

.hero-eyebrow {
  color: var(--shade-40);
  margin-bottom: 20px;
}

.hero-title {
  color: #ffffff;
  margin-bottom: 16px;
}

.hero-sub {
  font-size: 15px;
  color: var(--shade-40);
  letter-spacing: .2px;
}

.hero-side {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-pill {
  height: 38px;
  padding: 0 18px;
  border-radius: var(--r-pill);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, .18);
  color: var(--shade-40);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: .3px;
  cursor: pointer;
  transition: all .2s ease;
}

.filter-pill:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, .5);
}

.filter-pill.is-active {
  background: #ffffff;
  border-color: #ffffff;
  color: #000000;
  font-weight: 600;
}

.refresh-btn {
  height: 38px;
}

/* ---------- 空状态 ---------- */
.empty {
  padding: 96px 0;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, .08);
}

.empty-title {
  color: #ffffff;
  margin-bottom: 12px;
}

.empty-sub {
  color: var(--shade-50);
  font-size: 14px;
  margin-bottom: 28px;
}

/* ---------- 网格 ---------- */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  min-height: 160px;
}

.act-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--canvas-night-elevated);
  border-radius: var(--r-xl);
  box-shadow: var(--elev-1), 0 0 0 1px rgba(255, 255, 255, .08);
  transition: transform .3s cubic-bezier(.2, .7, .3, 1), box-shadow .3s ease;
  animation: riseIn .5s cubic-bezier(.2, .7, .3, 1) both;
}

.act-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--elev-1), 0 0 0 1px rgba(255, 255, 255, .18), 0 30px 60px -30px rgba(0, 0, 0, .9);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-index {
  font-size: 12px;
  color: var(--shade-50);
  letter-spacing: .5px;
}

/* 影像框 */
.card-photo {
  position: relative;
  height: 128px;
  border-radius: var(--r-lg);
  background: #000000;
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .07);
  overflow: hidden;
}

.photo-cap {
  position: absolute;
  top: 14px;
  left: 16px;
  font-size: 10px;
  letter-spacing: 2.4px;
  color: var(--shade-60);
}

.photo-glyph {
  font-family: var(--font-display);
  font-size: 46px;
  font-weight: 330;
  font-variation-settings: "wght" 330;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, .22);
}

.card-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
  letter-spacing: .3px;
  line-height: 1.3;
  color: #ffffff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 52px;
}

.card-price-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.card-price {
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 330;
  font-variation-settings: "wght" 330;
  line-height: 1;
  letter-spacing: -.5px;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

.card-price i {
  font-size: 20px;
  font-style: normal;
  margin-right: 2px;
  color: var(--shade-40);
}

.card-stock {
  font-size: 12.5px;
  color: var(--shade-40);
  padding-bottom: 6px;
}

.bar {
  height: 4px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, .14);
  overflow: hidden;
}

.bar-inner {
  display: block;
  height: 100%;
  border-radius: var(--r-pill);
  background: #ffffff;
  transition: width .5s cubic-bezier(.2, .7, .3, 1);
}

.bar-label {
  display: flex;
  justify-content: space-between;
  margin-top: -8px;
  font-size: 11.5px;
  letter-spacing: .3px;
  color: var(--shade-50);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--shade-40);
}

.card-meta .arrow {
  color: var(--shade-60);
}

/* 操作区 */
.card-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, .08);
}

.countdown-area {
  text-align: center;
}

.countdown-label {
  font-size: 10px;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--shade-50);
  margin-bottom: 12px;
}

.cta {
  width: 100%;
  height: 50px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 3px;
}

.detail-link {
  width: 100%;
  font-size: 13px;
}
</style>
