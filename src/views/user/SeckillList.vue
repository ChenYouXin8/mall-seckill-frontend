<template>
  <div class="seckill-list rise-in">
    <section class="hero">
      <div class="hero-main">
        <div class="hero-copy">
          <div class="hero-badge"><span class="live-dot"></span> FLASH SALE · LIVE</div>
          <p class="eyebrow hero-eyebrow">限时秒杀 · 高并发抢购</p>
          <h1 class="display-xl hero-title">把想要的，<br /><em>抢在手里。</em></h1>
          <p class="hero-sub">精选限时场次 · 低价发售 · 库存实时同步</p>
          <div class="hero-actions">
            <button class="hero-primary" @click="scrollToProducts">立即浏览</button>
            <div class="hero-note"><span>{{ filteredActivities.length }}</span> 个进行中的场次</div>
          </div>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="art-orbit orbit-one"></div>
          <div class="art-orbit orbit-two"></div>
          <div class="art-badge">01<br /><span>DROP</span></div>
          <div class="art-card">
            <span>SECKILL</span>
            <strong>99</strong>
            <small>LIMITED PRICE</small>
          </div>
          <div class="art-caption">ENGINEERED<br />FOR SPEED</div>
        </div>
      </div>

      <div class="hero-metrics">
        <div class="metric"><span>总场次</span><strong>{{ activities.length }}</strong></div>
        <div class="metric metric-live"><span>抢购中</span><strong>{{ activeCount }}</strong></div>
        <div class="metric"><span>即将开始</span><strong>{{ pendingCount }}</strong></div>
        <div class="metric"><span>已结束</span><strong>{{ endedCount }}</strong></div>
      </div>
    </section>

    <section ref="productSection" class="catalog-head">
      <div>
        <p class="eyebrow">THE DROP</p>
        <h2 class="heading-xl catalog-title">今日秒杀</h2>
        <p class="catalog-sub">按状态浏览全部场次，库存每 10 秒自动刷新。</p>
      </div>
      <div class="catalog-tools">
        <div class="filters" role="tablist" aria-label="场次筛选">
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
        <el-button class="refresh-btn" :loading="loading" @click="loadActivities">
          <el-icon><Refresh /></el-icon><span>刷新</span>
        </el-button>
      </div>
    </section>

    <div v-if="!loading && filteredActivities.length === 0" class="empty">
      <div class="empty-mark">—</div>
      <p class="empty-title">当前没有可展示的场次</p>
      <p class="empty-sub">去管理后台创建一场秒杀，让这里开始有货。</p>
      <el-button class="empty-btn" @click="$router.push('/admin')">去创建场次</el-button>
    </div>

    <section ref="gridSection" class="grid" v-loading="loading" element-loading-background="rgba(15,17,23,.68)">
      <article v-for="act in filteredActivities" :key="act.id" class="act-card">
        <header class="card-head">
          <div class="card-status">
            <span v-if="act.status === 0" class="status status-pending">即将开始</span>
            <span v-else-if="act.status === 1" class="status status-live"><span class="mini-dot"></span> 抢购中</span>
            <span v-else class="status status-ended">已结束</span>
          </div>
          <span class="card-index mono">DROP / {{ String(act.id).padStart(3, '0') }}</span>
        </header>

        <div class="card-media">
          <ProductVisual :product-id="act.productId" compact />
          <div class="media-price">
            <span>秒杀价</span>
            <strong><i>¥</i>{{ act.price ?? '—' }}</strong>
          </div>
        </div>

        <div class="card-copy">
          <div class="card-title-row">
            <h3 class="card-title">{{ act.title }}</h3>
            <span class="product-id mono">#{{ act.productId ?? '—' }}</span>
          </div>
          <p class="card-desc">限时低价 · 先到先得 · 活动结束后恢复原价</p>
        </div>

        <div class="inventory">
          <div class="inventory-head">
            <span>库存进度</span>
            <strong>{{ act.stock ?? 0 }} <small>/ {{ act.totalStock ?? '—' }}</small></strong>
          </div>
          <div class="bar"><span class="bar-inner" :style="{ width: stockPercent(act) + '%' }"></span></div>
          <div class="inventory-foot">
            <span>已抢 {{ soldCount(act) }} 件</span>
            <span>剩余 {{ act.stock ?? 0 }} 件</span>
          </div>
        </div>

        <div class="card-meta">
          <div>
            <span class="meta-label">START</span>
            <span class="mono">{{ formatTime(act.startTime) }}</span>
          </div>
          <span class="meta-arrow">→</span>
          <div class="meta-end">
            <span class="meta-label">END</span>
            <span class="mono">{{ formatTime(act.endTime) }}</span>
          </div>
        </div>

        <footer class="card-foot">
          <div v-if="act.status === 0" class="countdown-area">
            <div class="countdown-heading"><span>距开始</span><span>COUNTDOWN</span></div>
            <Countdown :targetTime="act.startTime" @end="onCountdownEnd(act)" />
          </div>

          <el-button
            v-if="act.status === 1"
            class="cta cta-primary"
            size="large"
            @click="goSeckill(act)"
          >
            立即抢购 <span>→</span>
          </el-button>

          <el-button v-else-if="act.status === 2" class="cta cta-muted" size="large" disabled>
            本场已结束
          </el-button>

          <el-button v-else class="cta cta-dark" size="large" @click="$router.push(`/seckill/${act.id}`)">
            查看场次 <span>→</span>
          </el-button>

          <button class="detail-link" @click="$router.push(`/seckill/${act.id}`)">查看详情</button>
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
import ProductVisual from '@/components/ProductVisual.vue'
import { Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const productSection = ref(null)
const activities = ref([])
const loading = ref(false)
const filterStatus = ref('all')
let refreshTimer = null

const filters = [
  { label: '全部', value: 'all' },
  { label: '抢购中', value: '1' },
  { label: '即将开始', value: '0' },
  { label: '已结束', value: '2' }
]

const filteredActivities = computed(() => {
  if (filterStatus.value === 'all') return activities.value
  return activities.value.filter(a => String(a.status) === filterStatus.value)
})

const activeCount = computed(() => activities.value.filter(a => a.status === 1).length)
const pendingCount = computed(() => activities.value.filter(a => a.status === 0).length)
const endedCount = computed(() => activities.value.filter(a => a.status === 2).length)

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

function scrollToProducts() {
  productSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
.seckill-list {
  padding-bottom: 48px;
}

.hero {
  margin: 0 -24px;
  padding: 76px 56px 44px;
  background:
    radial-gradient(circle at 82% 25%, rgba(255,255,255,.08), transparent 26%),
    radial-gradient(circle at 8% 10%, rgba(255,255,255,.045), transparent 25%),
    linear-gradient(180deg, #101319, #0f1117 72%);
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.hero-main {
  max-width: 1288px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 430px);
  gap: 48px;
  align-items: center;
}

.hero-copy {
  max-width: 720px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 13px;
  margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: var(--r-pill);
  color: rgba(255,255,255,.62);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.8px;
}

.live-dot,
.mini-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255,255,255,.08);
}

.hero-eyebrow {
  margin-bottom: 17px;
  color: var(--shade-50);
}

.hero-title {
  margin: 0;
  color: #fff;
  font-size: clamp(54px, 6.5vw, 92px);
  line-height: .94;
  letter-spacing: -2px;
}

.hero-title em {
  font-style: normal;
  color: rgba(255,255,255,.72);
}

.hero-sub {
  margin-top: 26px;
  color: var(--shade-40);
  font-size: 16px;
  letter-spacing: .2px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 32px;
}

.hero-primary {
  height: 48px;
  padding: 0 24px;
  border: 0;
  border-radius: var(--r-pill);
  background: #fff;
  color: #0f1117;
  font: 600 14px var(--font-body);
  letter-spacing: .6px;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease;
}

.hero-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(0,0,0,.25);
}

.hero-note {
  color: var(--shade-50);
  font-size: 13px;
}

.hero-note span {
  color: #fff;
  font-weight: 600;
}

.hero-art {
  position: relative;
  min-height: 360px;
}

.art-orbit {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 360px;
  height: 150px;
  border: 1px solid rgba(255,255,255,.11);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-17deg);
}

.orbit-two {
  width: 430px;
  height: 190px;
  border-color: rgba(255,255,255,.05);
  transform: translate(-50%, -50%) rotate(26deg);
}

.art-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 190px;
  height: 238px;
  padding: 22px;
  transform: translate(-50%, -50%) rotate(-8deg);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 26px;
  background: linear-gradient(145deg, rgba(255,255,255,.14), rgba(255,255,255,.025));
  backdrop-filter: blur(8px);
  box-shadow: 0 30px 70px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.12);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.art-card span {
  color: rgba(255,255,255,.55);
  font-size: 10px;
  letter-spacing: 2.8px;
}

.art-card strong {
  font: 330 84px/.9 var(--font-display);
  color: #fff;
  letter-spacing: -4px;
}

.art-card small {
  color: rgba(255,255,255,.28);
  font-size: 9px;
  letter-spacing: 1.8px;
}

.art-badge {
  position: absolute;
  right: 3%;
  top: 12%;
  width: 66px;
  height: 66px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 50%;
  display: grid;
  place-items: center;
  text-align: center;
  color: #fff;
  font: 600 14px/1 var(--font-mono);
}

.art-badge span {
  font-size: 8px;
  letter-spacing: 1.6px;
  color: var(--shade-50);
}

.art-caption {
  position: absolute;
  left: 2%;
  bottom: 9%;
  color: var(--shade-60);
  font-size: 9px;
  line-height: 1.65;
  letter-spacing: 2px;
}

.hero-metrics {
  max-width: 1288px;
  margin: 44px auto 0;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,.08);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.metric {
  padding: 0 24px;
  border-left: 1px solid rgba(255,255,255,.08);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
}

.metric:first-child { padding-left: 0; border-left: 0; }

.metric span {
  color: var(--shade-50);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.metric strong {
  font: 330 35px/1 var(--font-display);
  color: #fff;
}

.metric-live strong { color: #fff; }

.catalog-head {
  position: sticky;
  top: 72px;
  z-index: 20;
  margin: 0 -24px 22px;
  padding: 26px 24px 20px;
  background: rgba(15,17,23,.94);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255,255,255,.08);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
}

.catalog-title {
  color: #fff;
  margin-top: 5px;
}

.catalog-sub {
  margin-top: 5px;
  color: var(--shade-50);
  font-size: 13px;
}

.catalog-tools {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filters { display: flex; gap: 7px; flex-wrap: wrap; }

.filter-pill {
  height: 38px;
  padding: 0 16px;
  border-radius: var(--r-pill);
  border: 1px solid rgba(255,255,255,.12);
  background: transparent;
  color: var(--shade-40);
  font: 500 12px var(--font-body);
  cursor: pointer;
  transition: all .2s ease;
}

.filter-pill:hover { color: #fff; border-color: rgba(255,255,255,.34); }
.filter-pill.is-active { background: #fff; border-color: #fff; color: #000; }

.refresh-btn {
  height: 38px;
  border: 1px solid rgba(255,255,255,.12);
  background: transparent;
  color: #fff;
}

.refresh-btn:hover { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.06); color: #fff; }

.empty {
  padding: 92px 24px;
  text-align: center;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: var(--r-xl);
  background: rgba(255,255,255,.015);
}

.empty-mark { font: 300 42px/1 var(--font-display); color: var(--shade-60); }
.empty-title { margin-top: 18px; color: #fff; font-size: 18px; font-weight: 550; }
.empty-sub { margin-top: 8px; color: var(--shade-50); font-size: 13px; }
.empty-btn { margin-top: 24px; }

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.act-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 18px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.012));
  box-shadow: 0 12px 35px rgba(0,0,0,.12);
  animation: riseIn .5s cubic-bezier(.2,.7,.3,1) both;
  transition: transform .28s ease, border-color .28s ease, box-shadow .28s ease;
}

.act-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255,255,255,.18);
  box-shadow: 0 30px 70px rgba(0,0,0,.28);
}

.card-head, .inventory-head, .inventory-foot, .card-meta, .card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-head { margin-bottom: 14px; }
.card-index { color: var(--shade-60); font-size: 10px; letter-spacing: 1.3px; }

.status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: var(--r-pill);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .6px;
}

.status-live { background: #fff; color: #000; }
.status-live .mini-dot { width: 5px; height: 5px; background: #000; box-shadow: none; }
.status-pending, .status-ended { color: var(--shade-40); border: 1px solid rgba(255,255,255,.11); }

.card-media { position: relative; }
.media-price {
  position: absolute;
  right: 13px;
  bottom: 13px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 14px;
  background: rgba(8,9,12,.72);
  backdrop-filter: blur(10px);
}

.media-price span { display: block; color: var(--shade-50); font-size: 9px; letter-spacing: 1px; }
.media-price strong { display: block; margin-top: 4px; color: #fff; font: 330 26px/1 var(--font-display); }
.media-price i { color: var(--shade-40); font-size: 12px; font-style: normal; margin-right: 2px; }

.card-copy { padding: 18px 2px 0; }
.card-title { min-width: 0; color: #fff; font-size: 19px; line-height: 1.3; font-weight: 550; }
.product-id { flex: 0 0 auto; color: var(--shade-60); font-size: 10px; }
.card-desc { margin-top: 7px; color: var(--shade-50); font-size: 12px; }

.inventory { margin-top: 22px; }
.inventory-head span, .inventory-foot span { color: var(--shade-50); font-size: 11px; }
.inventory-head strong { color: #fff; font-size: 13px; font-weight: 550; }
.inventory-head small { color: var(--shade-60); font-weight: 400; }

.bar { height: 5px; margin-top: 10px; overflow: hidden; border-radius: var(--r-pill); background: rgba(255,255,255,.1); }
.bar-inner { display: block; height: 100%; border-radius: inherit; background: #fff; transition: width .5s ease; }
.inventory-foot { margin-top: 7px; }
.inventory-foot span:last-child { color: var(--shade-40); }

.card-meta { margin-top: 18px; padding: 14px 0; border-top: 1px solid rgba(255,255,255,.08); border-bottom: 1px solid rgba(255,255,255,.08); }
.card-meta > div { display: flex; flex-direction: column; gap: 4px; }
.card-meta .mono { color: #d6d6da; font-size: 11px; }
.meta-label { color: var(--shade-60); font-size: 8px; letter-spacing: 1.5px; }
.meta-arrow { color: var(--shade-60); }
.meta-end { text-align: right; }

.card-foot { margin-top: 18px; }
.countdown-area { padding: 2px 0 5px; }
.countdown-heading { display: flex; justify-content: space-between; margin-bottom: 12px; color: var(--shade-50); font-size: 9px; letter-spacing: 1.4px; }

.cta { width: 100%; height: 48px; font-size: 13px; font-weight: 600; letter-spacing: 1px; }
.cta span { margin-left: 8px; }
.cta-primary { border-color: #fff; background: #fff; color: #000; }
.cta-primary:hover { border-color: #f0f0f0; background: #f0f0f0; color: #000; }
.cta-dark { border-color: rgba(255,255,255,.16); background: rgba(255,255,255,.04); color: #fff; }
.cta-dark:hover { border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.08); color: #fff; }
.cta-muted { border-color: rgba(255,255,255,.08); background: transparent; color: var(--shade-60); }
.detail-link { width: 100%; margin-top: 9px; border: 0; background: transparent; color: var(--shade-50); font: 500 11px var(--font-body); cursor: pointer; }
.detail-link:hover { color: #fff; }

@media (max-width: 900px) {
  .hero-main { grid-template-columns: 1fr; }
  .hero-art { min-height: 280px; }
  .grid { grid-template-columns: 1fr; }
  .metric strong { font-size: 29px; }
}

@media (max-width: 700px) {
  .hero { margin: 0 -16px; padding: 54px 24px 34px; }
  .hero-title { font-size: 54px; }
  .hero-metrics { grid-template-columns: repeat(2, 1fr); gap: 18px 0; }
  .metric:nth-child(3) { border-left: 0; padding-left: 0; }
  .catalog-head { top: 60px; margin-left: -16px; margin-right: -16px; padding-left: 16px; padding-right: 16px; align-items: flex-start; flex-direction: column; }
  .catalog-tools { width: 100%; justify-content: flex-start; }
  .filters { max-width: 100%; overflow-x: auto; padding-bottom: 2px; flex-wrap: nowrap; }
  .filter-pill { flex: 0 0 auto; }
}
</style>
