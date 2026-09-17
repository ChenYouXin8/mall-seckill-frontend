<template>
  <div class="detail rise-in" v-loading="pageLoading" element-loading-background="rgba(15,17,23,.68)">
    <div class="back-row">
      <router-link class="back-link" to="/seckill">← 返回今日秒杀</router-link>
    </div>

    <div v-if="activity" class="detail-grid">
      <section class="product">
        <div class="product-photo-wrap">
          <ProductVisual :product-id="activity.productId" />
          <div class="photo-corner mono">DROP / {{ String(activity.id).padStart(3, '0') }}</div>
          <div class="photo-status">
            <span v-if="activity.status === 1"><span class="mini-dot"></span> 正在抢购</span>
            <span v-else-if="activity.status === 0">即将开始</span>
            <span v-else>本场已结束</span>
          </div>
        </div>

        <div class="product-body">
          <div class="product-topline">
            <p class="eyebrow product-eyebrow">LIMITED DROP · {{ activity.productId }}</p>
            <span class="product-code mono">#{{ activity.id }}</span>
          </div>
          <h1 class="display-lg product-title">{{ activity.title }}</h1>
          <p class="product-intro">限时秒杀专场 · 低于常规售价的限定价格 · 库存实时同步</p>

          <div class="price-row">
            <div>
              <span class="price-label">FLASH PRICE</span>
              <span class="price"><i>¥</i>{{ activity.price || '—' }}</span>
            </div>
            <span class="orig">常规价 ¥{{ originalPrice }}</span>
          </div>

          <div class="specs">
            <div class="spec">
              <span class="spec-k">活动时间</span>
              <span class="spec-v mono">{{ formatTime(activity.startTime) }} — {{ formatTime(activity.endTime) }}</span>
            </div>
            <div class="spec">
              <span class="spec-k">剩余库存</span>
              <span class="spec-v"><b>{{ activity.stock ?? '—' }}</b> / {{ activity.totalStock ?? '—' }} 件</span>
            </div>
          </div>

          <div class="inventory">
            <div class="inventory-head"><span>库存进度</span><strong>{{ stockPercent }}%</strong></div>
            <div class="bar"><span class="bar-inner" :style="{ width: stockPercent + '%' }"></span></div>
            <div class="bar-label">
              <span>已抢 {{ soldCount }} 件</span>
              <span>共 {{ activity.totalStock ?? '—' }} 件</span>
            </div>
          </div>

          <div class="service-row">
            <div><strong>01</strong><span>资格校验</span></div>
            <div><strong>02</strong><span>异步下单</span></div>
            <div><strong>03</strong><span>结果确认</span></div>
          </div>
        </div>
      </section>

      <aside class="order-panel">
        <div v-if="activity.status === 0" class="panel-block countdown-panel">
          <div class="panel-top"><p class="eyebrow panel-eyebrow">NEXT DROP</p><span class="panel-index mono">01</span></div>
          <h2>即将开始</h2>
          <p class="panel-copy">准备好了吗？倒计时结束后即可获取抢购资格。</p>
          <Countdown :targetTime="activity.startTime" @end="onActivityStart" />
        </div>

        <div v-else-if="activity.status === 2" class="panel-block ended-panel">
          <p class="eyebrow panel-eyebrow">DROP CLOSED</p>
          <p class="ended-title display-md">已结束</p>
          <p class="ended-sub">本场秒杀已经结束，下一场敬请期待。</p>
          <el-button class="panel-secondary" @click="router.push('/seckill')">浏览其他场次 →</el-button>
        </div>

        <div v-else class="panel-block form-panel">
          <div class="panel-top"><p class="eyebrow panel-eyebrow">SECURE CHECKOUT</p><span class="panel-index mono">LIVE</span></div>
          <h2>现在抢购</h2>
          <p class="panel-copy">获取一次性抢购资格后提交订单，系统会异步处理订单结果。</p>

          <div class="checkout-summary">
            <span>秒杀价</span>
            <strong>¥{{ activity.price || '—' }}</strong>
          </div>

          <div v-if="!addressGot" class="action-area">
            <el-button class="cta cta-primary" size="large" :loading="gettingAddress" @click="getSeckillAddress">
              获取抢购资格 <span>→</span>
            </el-button>
            <p class="action-note">资格获取成功后才能提交订单</p>
          </div>

          <div v-else-if="addressGot && !orderPlaced" class="action-area">
            <div class="address-info"><span class="dot-live"></span> 抢购资格已就绪</div>
            <el-button class="cta cta-primary" size="large" :loading="placingOrder" :disabled="placingOrder" @click="doSeckill">
              立即抢购 <span>→</span>
            </el-button>
          </div>

          <div v-if="orderNo" class="order-result">
            <div class="result-header" :class="resultStatus">
              <p class="result-msg">{{ resultMessage }}</p>
              <p class="order-no mono">{{ orderNo }}</p>
            </div>
            <div v-if="resultStatus === 'pending'" class="polling-info">
              <p>订单处理中，请稍候…</p>
              <el-progress :percentage="pollProgress" :stroke-width="5" :show-text="false" />
            </div>
            <el-button v-if="resultStatus === 'success'" class="cta cta-primary result-cta" size="large" :loading="paying" @click="payOrder">立即支付 <span>→</span></el-button>
            <el-button v-if="resultStatus === 'failed'" class="cta cta-secondary result-cta" size="large" @click="resetOrder">重新抢购</el-button>
          </div>

          <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon :closable="false" class="error-alert" />
        </div>

        <div class="panel-block rules-panel">
          <p class="eyebrow panel-eyebrow">HOW IT WORKS</p>
          <div class="rule"><span>01</span><div><strong>获取资格</strong><small>活动开始后领取抢购资格</small></div></div>
          <div class="rule"><span>02</span><div><strong>提交订单</strong><small>服务端异步处理库存与订单</small></div></div>
          <div class="rule"><span>03</span><div><strong>确认支付</strong><small>订单成功后完成支付</small></div></div>
        </div>

        <div v-if="myOrder" class="panel-block my-order">
          <p class="eyebrow panel-eyebrow">MY ORDER</p>
          <div class="order-info-item"><span>订单号</span><span class="mono">{{ myOrder.orderNo }}</span></div>
          <div class="order-info-item"><span>状态</span><span class="order-status">{{ orderStatusText(myOrder.status) }}</span></div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAddress, submitOrder, pollOrderResult, payOrder as payApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import Countdown from '@/components/Countdown.vue'
import ProductVisual from '@/components/ProductVisual.vue'

const route = useRoute()
const router = useRouter()
const pageLoading = ref(false)
const activity = ref(null)
const addressGot = ref(false)
const currentSecret = ref('')
const gettingAddress = ref(false)
const placingOrder = ref(false)
const paying = ref(false)
const orderNo = ref('')
const resultStatus = ref('')
const resultMessage = ref('')
const pollProgress = ref(0)
const myOrder = ref(null)
const errorMsg = ref('')
const orderPlaced = ref(false)
let pollTimer = null
let progressTimer = null
let statusTimer = null

onMounted(async () => {
  pageLoading.value = true
  try {
    const { listActivities } = await import('@/api')
    const res = await listActivities()
    const list = res.data || []
    activity.value = list.find(a => String(a.id) === String(route.params.activityId)) || {
      id: route.params.activityId, title: '秒杀活动 #' + route.params.activityId, status: 1, price: 99,
      stock: 10, totalStock: 100, startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(), productId: 1001
    }
    updateActivityStatus()
  } catch { activity.value = null } finally { pageLoading.value = false }
  statusTimer = setInterval(updateActivityStatus, 1000)
})

function updateActivityStatus() {
  if (!activity.value?.startTime) return
  const now = Date.now()
  const start = new Date(activity.value.startTime).getTime()
  const end = new Date(activity.value.endTime).getTime()
  activity.value.status = now < start ? 0 : (now < end ? 1 : 2)
}

function onActivityStart() {
  if (activity.value) activity.value.status = 1
  ElMessage.success('秒杀已开始！')
}

async function getSeckillAddress() {
  gettingAddress.value = true
  errorMsg.value = ''
  try {
    const res = await getAddress(route.params.activityId)
    addressGot.value = true
    currentSecret.value = res.data.address
    ElMessage.success('已获取抢购资格！')
  } catch (e) { errorMsg.value = e.data?.message || '获取抢购资格失败' }
  finally { gettingAddress.value = false }
}

async function doSeckill() {
  if (!addressGot.value) { ElMessage.warning('请先获取抢购资格'); return }
  placingOrder.value = true; errorMsg.value = ''; orderPlaced.value = true
  orderNo.value = ''; resultStatus.value = ''; resultMessage.value = ''
  try {
    const res = await submitOrder(currentSecret.value, { activityId: Number(route.params.activityId), productId: activity.value.productId || 1001 })
    orderNo.value = res.data.orderNo; resultStatus.value = 'pending'; resultMessage.value = '排队中，请稍候…'; startPolling(res.data.orderNo)
  } catch (e) { resultStatus.value = 'failed'; resultMessage.value = e.data?.message || '抢购失败'; placingOrder.value = false; orderPlaced.value = false }
}

function startPolling(orderNoVal) {
  pollProgress.value = 0
  let polls = 0
  progressTimer = setInterval(() => { pollProgress.value = Math.min(95, pollProgress.value + 3) }, 500)
  pollTimer = setInterval(async () => {
    polls++
    try {
      const res = await pollOrderResult(orderNoVal)
      const status = res.data?.status
      if (status === 'PAID') { clearTimers(); resultStatus.value = 'success'; resultMessage.value = '下单成功！'; pollProgress.value = 100; ElMessage.success('下单成功！') }
      else if (status === 'FAILED') { clearTimers(); resultStatus.value = 'failed'; resultMessage.value = '订单失败'; placingOrder.value = false; orderPlaced.value = false }
    } catch {}
    if (polls >= 30) { clearTimers(); resultStatus.value = 'failed'; resultMessage.value = '订单处理超时'; placingOrder.value = false; orderPlaced.value = false }
  }, 1000)
}

function clearTimers() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
}

async function payOrder() {
  paying.value = true
  try { await payApi(orderNo.value); ElMessageBox.alert('支付成功！订单号：' + orderNo.value, '支付完成', { confirmButtonText: '好的' }) }
  catch (e) { ElMessage.error(e.data?.message || '支付失败') }
  finally { paying.value = false }
}

function resetOrder() { orderNo.value = ''; resultStatus.value = ''; resultMessage.value = ''; orderPlaced.value = false; addressGot.value = false; currentSecret.value = '' }

function formatTime(timeStr) { if (!timeStr) return '--'; return new Date(timeStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }
const originalPrice = computed(() => { const p = Number(activity.value?.price); return p ? (p * 1.5).toFixed(2) : '—' })
const stockPercent = computed(() => { const total = Number(activity.value?.totalStock ?? 0); const stock = Number(activity.value?.stock ?? 0); return total ? Math.max(0, Math.min(100, Math.round((stock / total) * 100))) : 0 })
const soldCount = computed(() => Math.max(0, Number(activity.value?.totalStock || 0) - Number(activity.value?.stock || 0)))
function orderStatusText(status) { return ['待支付', '已支付', '已取消', '已关闭', '已退款'][status] || '未知' }
onUnmounted(() => { clearTimers(); if (statusTimer) clearInterval(statusTimer) })
</script>

<style scoped>
.detail { max-width: 1288px; margin: 0 auto; padding: 32px 0 48px; }
.back-row { margin-bottom: 22px; }
.back-link { color: var(--shade-40); font-size: 12px; letter-spacing: .4px; transition: color .2s; }
.back-link:hover { color: #fff; }
.detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) 410px; gap: 20px; align-items: start; }
.product { overflow: hidden; border: 1px solid rgba(255,255,255,.08); border-radius: 24px; background: #151822; box-shadow: 0 20px 60px rgba(0,0,0,.18); }
.product-photo-wrap { position: relative; }
.photo-corner { position: absolute; left: 20px; top: 18px; z-index: 2; color: rgba(255,255,255,.45); font-size: 9px; letter-spacing: 1.6px; }
.photo-status { position: absolute; right: 18px; top: 17px; z-index: 2; padding: 7px 11px; border: 1px solid rgba(255,255,255,.15); border-radius: 999px; background: rgba(8,9,12,.64); color: rgba(255,255,255,.72); backdrop-filter: blur(10px); font-size: 10px; }
.mini-dot { display: inline-block; width: 5px; height: 5px; margin-right: 6px; border-radius: 50%; background: #fff; vertical-align: 1px; }
.product-body { padding: 32px 38px 38px; }
.product-topline, .panel-top, .inventory-head, .bar-label, .order-info-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.product-eyebrow, .panel-eyebrow { color: var(--shade-50); }
.product-code, .panel-index { color: var(--shade-60); font-size: 10px; letter-spacing: 1px; }
.product-title { margin-top: 12px; color: #fff; max-width: 800px; }
.product-intro { margin-top: 13px; color: var(--shade-40); font-size: 13px; }
.price-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 28px 0; margin-top: 24px; border-top: 1px solid rgba(255,255,255,.08); border-bottom: 1px solid rgba(255,255,255,.08); }
.price-row > div { display: flex; flex-direction: column; gap: 7px; }
.price-label { color: var(--shade-50); font-size: 9px; letter-spacing: 1.8px; }
.price { color: #fff; font: 330 64px/1 var(--font-display); letter-spacing: -1.5px; }
.price i { margin-right: 3px; color: var(--shade-40); font: normal 24px/1 var(--font-display); }
.orig { padding-bottom: 7px; color: var(--shade-50); font-size: 13px; text-decoration: line-through; }
.specs { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; padding: 25px 0; }
.spec { display: flex; flex-direction: column; gap: 7px; }
.spec-k { color: var(--shade-50); font-size: 9px; letter-spacing: 1.8px; text-transform: uppercase; }
.spec-v { color: #fff; font-size: 13px; }
.spec-v b { font: 330 25px/1 var(--font-display); }
.inventory-head span, .bar-label span { color: var(--shade-50); font-size: 10px; }
.inventory-head strong { color: #fff; font: 330 23px/1 var(--font-display); }
.bar { height: 5px; margin-top: 10px; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.1); }
.bar-inner { display: block; height: 100%; border-radius: inherit; background: #fff; }
.bar-label { margin-top: 8px; }
.service-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin-top: 28px; overflow: hidden; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; background: rgba(255,255,255,.08); }
.service-row > div { padding: 15px; background: #151822; }
.service-row strong { display: block; color: #fff; font: 330 22px/1 var(--font-display); }
.service-row span { display: block; margin-top: 7px; color: var(--shade-50); font-size: 10px; }
.order-panel { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 14px; }
.panel-block { padding: 26px; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; background: #151822; box-shadow: 0 14px 45px rgba(0,0,0,.14); }
.panel-block h2 { margin-top: 13px; color: #fff; font: 500 25px/1.2 var(--font-display); }
.panel-copy { margin-top: 8px; color: var(--shade-50); font-size: 12px; line-height: 1.65; }
.countdown-panel :deep(.countdown) { margin-top: 24px; }
.ended-panel { text-align: center; padding: 44px 26px; }
.ended-panel .panel-eyebrow { text-align: left; }
.ended-title { margin-top: 24px !important; }
.ended-sub { margin-top: 10px; color: var(--shade-50); font-size: 12px; }
.panel-secondary { margin-top: 22px; width: 100%; }
.checkout-summary { display: flex; align-items: baseline; justify-content: space-between; margin: 22px 0 18px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,.08); border-bottom: 1px solid rgba(255,255,255,.08); color: var(--shade-50); font-size: 11px; }
.checkout-summary strong { color: #fff; font: 330 31px/1 var(--font-display); }
.action-area { display: flex; flex-direction: column; gap: 11px; }
.cta { width: 100%; height: 52px; font-size: 14px; font-weight: 600; letter-spacing: 1.3px; }
.cta span { margin-left: 8px; }
.cta-primary { border-color: #fff; background: #fff; color: #000; }
.cta-primary:hover { border-color: #eee; background: #eee; color: #000; }
.cta-secondary { border-color: rgba(255,255,255,.16); background: transparent; color: #fff; }
.action-note { text-align: center; color: var(--shade-60); font-size: 10px; }
.address-info { align-self: center; padding: 7px 13px; border: 1px solid rgba(255,255,255,.16); border-radius: 999px; color: #fff; font-size: 11px; }
.dot-live { display: inline-block; width: 6px; height: 6px; margin-right: 6px; border-radius: 50%; background: #fff; }
.order-result { margin-top: 16px; }
.result-header { padding: 18px; border-radius: 13px; text-align: center; }
.result-header.success { background: #fff; color: #000; }
.result-header.pending, .result-header.failed { border: 1px solid rgba(255,255,255,.12); color: #fff; }
.result-msg { font: 500 17px var(--font-display); }
.order-no { display: block; margin-top: 7px; font-size: 10px; opacity: .65; }
.polling-info { padding: 13px 0 2px; color: var(--shade-50); font-size: 11px; }
.polling-info p { margin-bottom: 10px; }
.result-cta { margin-top: 12px; }
.error-alert { margin-top: 14px; border-radius: 12px; }
.rules-panel { padding-bottom: 18px; }
.rule { display: grid; grid-template-columns: 28px 1fr; gap: 11px; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,.07); }
.rule:last-child { border-bottom: 0; padding-bottom: 0; }
.rule > span { color: var(--shade-60); font: 11px var(--font-mono); }
.rule strong { display: block; color: #fff; font-size: 12px; font-weight: 550; }
.rule small { display: block; margin-top: 3px; color: var(--shade-50); font-size: 10px; }
.my-order { display: flex; flex-direction: column; gap: 12px; }
.order-info-item { color: #fff; font-size: 11px; }
.order-info-item > span:first-child { color: var(--shade-50); }
.order-status { padding: 5px 9px; border: 1px solid rgba(255,255,255,.15); border-radius: 999px; }
@media (max-width: 960px) { .detail-grid { grid-template-columns: 1fr; } .order-panel { position: static; } }
@media (max-width: 640px) { .detail { padding-top: 18px; } .product-body { padding: 24px; } .specs { grid-template-columns: 1fr; gap: 18px; } .service-row { grid-template-columns: 1fr; } .price { font-size: 50px; } }
</style>
