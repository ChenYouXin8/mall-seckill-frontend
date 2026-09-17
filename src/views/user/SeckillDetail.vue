<template>
  <div class="detail rise-in" v-loading="pageLoading" element-loading-background="rgba(0,0,0,.6)">
    <div class="back-row">
      <router-link class="back-link" to="/seckill">← 返回列表</router-link>
    </div>

    <div v-if="activity" class="detail-grid">
      <!-- 左：商品（影像框 + 编辑式排版） -->
      <section class="product">
        <div class="product-photo">
          <span class="photo-cap mono">PRODUCT</span>
          <span class="photo-glyph mono">#{{ activity.productId }}</span>
        </div>

        <div class="product-body">
          <p class="eyebrow product-eyebrow">限时秒杀 · 场次 #{{ activity.id }}</p>
          <h1 class="display-lg product-title">{{ activity.title }}</h1>

          <div class="price-row">
            <span class="price"><i>¥</i>{{ activity.price || '—' }}</span>
            <span class="orig">原价 ¥{{ originalPrice }}</span>
          </div>

          <div class="specs">
            <div class="spec">
              <span class="spec-k">活动时间</span>
              <span class="spec-v mono">{{ formatTime(activity.startTime) }} ~ {{ formatTime(activity.endTime) }}</span>
            </div>
            <div class="spec">
              <span class="spec-k">剩余库存</span>
              <span class="spec-v"><b>{{ activity.stock ?? '—' }}</b> / {{ activity.totalStock ?? '—' }} 件</span>
            </div>
          </div>

          <div class="bar">
            <span class="bar-inner" :style="{ width: stockPercent + '%' }"></span>
          </div>
          <div class="bar-label">
            <span>已抢 {{ (Number(activity.totalStock || 0) - Number(activity.stock || 0)) > 0 ? Number(activity.totalStock || 0) - Number(activity.stock || 0) : 0 }} 件</span>
            <span>共 {{ activity.totalStock ?? '—' }} 件</span>
          </div>
        </div>
      </section>

      <!-- 右：抢购面板 -->
      <aside class="order-panel">
        <!-- 倒计时 -->
        <div v-if="activity.status === 0" class="panel-block countdown-panel">
          <p class="eyebrow panel-eyebrow">距秒杀开始</p>
          <Countdown :targetTime="activity.startTime" @end="onActivityStart" />
        </div>

        <div v-else-if="activity.status === 2" class="panel-block ended-panel">
          <p class="ended-title display-md">已结束</p>
          <p class="ended-sub">本场秒杀已经结束</p>
        </div>

        <div v-else class="panel-block form-panel">
          <p class="eyebrow panel-eyebrow">立即抢购</p>

          <div class="stock-tips" v-if="!addressGot">
            点击下方按钮获取抢购资格，先到先得
          </div>

          <div v-if="!addressGot" class="action-area">
            <el-button
              class="pill-solid-white cta"
              size="large"
              :loading="gettingAddress"
              @click="getSeckillAddress"
            >
              获取抢购资格
            </el-button>
          </div>

          <div v-else-if="addressGot && !orderPlaced" class="action-area">
            <div class="address-info">
              <span class="dot-live"></span> 已获取抢购资格
            </div>
            <el-button
              class="pill-solid-white cta"
              size="large"
              :loading="placingOrder"
              :disabled="placingOrder"
              @click="doSeckill"
            >
              立即抢购
            </el-button>
          </div>

          <div v-if="orderNo" class="order-result">
            <div class="result-header" :class="resultStatus">
              <p class="result-msg">{{ resultMessage }}</p>
              <p class="order-no mono">{{ orderNo }}</p>
            </div>

            <div v-if="resultStatus === 'pending'" class="polling-info">
              <p>正在处理订单，请稍候…</p>
              <el-progress :percentage="pollProgress" :stroke-width="6" :show-text="false" />
            </div>

            <el-button
              v-if="resultStatus === 'success'"
              class="pill-solid-white cta"
              size="large"
              :loading="paying"
              @click="payOrder"
            >
              立即支付
            </el-button>

            <el-button
              v-if="resultStatus === 'failed'"
              class="pill-outline-dark cta"
              size="large"
              @click="resetOrder"
            >
              重新抢购
            </el-button>
          </div>

          <el-alert
            v-if="errorMsg"
            :title="errorMsg"
            type="error"
            show-icon
            :closable="false"
            class="error-alert"
          />
        </div>

        <!-- 我的订单 -->
        <div v-if="myOrder" class="panel-block my-order">
          <p class="eyebrow panel-eyebrow">我的订单</p>
          <div class="order-info-item">
            <span>订单号</span><span class="mono">{{ myOrder.orderNo }}</span>
          </div>
          <div class="order-info-item">
            <span>状态</span>
            <span class="tag tag--ghost-dark">{{ orderStatusText(myOrder.status) }}</span>
          </div>
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
const resultStatus = ref('') // pending / success / failed
const resultMessage = ref('')
const pollProgress = ref(0)
const myOrder = ref(null)
const errorMsg = ref('')
const orderPlaced = ref(false)

let pollTimer = null
let progressTimer = null

async function loadActivity() {
  try {
    const res = await getAddress(route.params.activityId)
    if (res.data) {
      addressGot.value = true
      currentSecret.value = res.data.address
    }
  } catch (e) {
    // 地址获取失败（活动未开始/已结束）会在 ui 显示
  }
}

onMounted(async () => {
  pageLoading.value = true
  try {
    const { listActivities } = await import('@/api')
    const res = await listActivities()
    const list = res.data || []
    activity.value = list.find(a => String(a.id) === String(route.params.activityId)) || {
      id: route.params.activityId,
      title: '秒杀活动 #' + route.params.activityId,
      status: 1,
      price: 99.00,
      stock: 10,
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      productId: 1001
    }
    updateActivityStatus()
  } catch {
    activity.value = null
  } finally {
    pageLoading.value = false
  }
  statusTimer = setInterval(updateActivityStatus, 1000)
})

let statusTimer = null

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
  } catch (e) {
    errorMsg.value = e.data?.message || '获取抢购资格失败'
  } finally {
    gettingAddress.value = false
  }
}

async function doSeckill() {
  if (!addressGot.value) {
    ElMessage.warning('请先获取抢购资格')
    return
  }
  placingOrder.value = true
  errorMsg.value = ''
  orderPlaced.value = true
  orderNo.value = ''
  resultStatus.value = ''
  resultMessage.value = ''
  try {
    const res = await submitOrder(currentSecret.value, {
      activityId: Number(route.params.activityId),
      productId: activity.value.productId || 1001
    })
    orderNo.value = res.data.orderNo
    resultStatus.value = 'pending'
    resultMessage.value = '排队中，请稍候…'
    startPolling(res.data.orderNo)
  } catch (e) {
    resultStatus.value = 'failed'
    resultMessage.value = e.data?.message || '抢购失败'
    placingOrder.value = false
    orderPlaced.value = false
  }
}

function startPolling(orderNoVal) {
  pollProgress.value = 0
  let polls = 0
  const maxPolls = 30

  progressTimer = setInterval(() => {
    pollProgress.value = Math.min(95, pollProgress.value + 3)
  }, 500)

  pollTimer = setInterval(async () => {
    polls++
    try {
      const res = await pollOrderResult(orderNoVal)
      const status = res.data?.status
      if (status === 'PENDING') {
        // 继续轮询
      } else if (status === 'PAID') {
        clearTimers()
        resultStatus.value = 'success'
        resultMessage.value = '下单成功！'
        pollProgress.value = 100
        ElMessage.success('下单成功！')
      } else if (status === 'FAILED') {
        clearTimers()
        resultStatus.value = 'failed'
        resultMessage.value = '订单失败'
        placingOrder.value = false
        orderPlaced.value = false
      }
    } catch {
      // 继续轮询
    }
    if (polls >= maxPolls) {
      clearTimers()
      resultStatus.value = 'failed'
      resultMessage.value = '订单处理超时'
      placingOrder.value = false
      orderPlaced.value = false
    }
  }, 1000)
}

function clearTimers() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
}

async function payOrder() {
  paying.value = true
  try {
    await payApi(orderNo.value)
    ElMessageBox.alert('支付成功！订单号：' + orderNo.value, '支付完成', {
      confirmButtonText: '好的'
    })
  } catch (e) {
    ElMessage.error(e.data?.message || '支付失败')
  } finally {
    paying.value = false
  }
}

function resetOrder() {
  orderNo.value = ''
  resultStatus.value = ''
  resultMessage.value = ''
  orderPlaced.value = false
  addressGot.value = false
  currentSecret.value = ''
}

function formatTime(timeStr) {
  if (!timeStr) return '--'
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

const originalPrice = computed(() => {
  const p = Number(activity.value?.price)
  return p ? (p * 1.5).toFixed(2) : '—'
})

const stockPercent = computed(() => {
  const total = Number(activity.value?.totalStock ?? 0)
  const stock = Number(activity.value?.stock ?? 0)
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((stock / total) * 100)))
})

function orderStatusText(status) {
  return ['待支付', '已支付', '已取消', '已关闭', '已退款'][status] || '未知'
}

onUnmounted(() => {
  clearTimers()
  if (statusTimer) clearInterval(statusTimer)
})
</script>

<style scoped>
.detail {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 32px;
}

.back-row {
  margin-bottom: 32px;
}

.back-link {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: .3px;
  color: var(--shade-40);
  transition: color .2s ease;
}

.back-link:hover {
  color: #ffffff;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 28px;
  align-items: start;
}

/* ---------- 左侧商品 ---------- */
.product {
  background: var(--canvas-night-elevated);
  border-radius: var(--r-xl);
  overflow: hidden;
  box-shadow: var(--elev-1), 0 0 0 1px rgba(255, 255, 255, .08);
}

.product-photo {
  position: relative;
  height: 300px;
  background: #000000;
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .06);
}

.photo-cap {
  position: absolute;
  top: 20px;
  left: 24px;
  font-size: 10px;
  letter-spacing: 3px;
  color: var(--shade-60);
}

.photo-glyph {
  font-family: var(--font-display);
  font-size: 76px;
  font-weight: 330;
  font-variation-settings: "wght" 330;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, .2);
}

.product-body {
  padding: 36px 40px 40px;
}

.product-eyebrow {
  color: var(--shade-50);
  margin-bottom: 18px;
}

.product-title {
  color: #ffffff;
  margin-bottom: 28px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 28px;
  margin-bottom: 28px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
}

.price {
  font-family: var(--font-display);
  font-size: 64px;
  font-weight: 330;
  font-variation-settings: "wght" 330;
  line-height: 1;
  letter-spacing: -1px;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

.price i {
  font-size: 26px;
  font-style: normal;
  margin-right: 3px;
  color: var(--shade-40);
}

.orig {
  font-size: 14px;
  color: var(--shade-50);
  text-decoration: line-through;
}

.specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 28px;
}

.spec {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spec-k {
  font-size: 10px;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--shade-50);
}

.spec-v {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.spec-v b {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 330;
  font-variation-settings: "wght" 330;
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
  margin-top: 10px;
  font-size: 11.5px;
  letter-spacing: .3px;
  color: var(--shade-50);
}

/* ---------- 右侧抢购面板 ---------- */
.order-panel {
  position: sticky;
  top: 96px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-block {
  background: var(--canvas-night-elevated);
  border-radius: var(--r-xl);
  padding: 28px;
  box-shadow: var(--elev-1), 0 0 0 1px rgba(255, 255, 255, .08);
}

.panel-eyebrow {
  color: var(--shade-50);
  margin-bottom: 18px;
}

.countdown-panel {
  text-align: center;
}

.countdown-panel .panel-eyebrow {
  text-align: left;
}

.ended-panel {
  text-align: center;
  padding: 52px 28px;
}

.ended-title {
  color: #ffffff;
  margin-bottom: 10px;
}

.ended-sub {
  font-size: 13px;
  color: var(--shade-50);
}

.form-panel {
  display: flex;
  flex-direction: column;
}

.stock-tips {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--shade-40);
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, .08);
}

.action-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.cta {
  width: 100%;
  height: 54px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 3px;
}

.address-info {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 7px 16px;
  border-radius: var(--r-pill);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 500;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .28);
}

.dot-live {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, .16);
}

/* 订单结果 */
.order-result {
  margin-top: 20px;
}

.result-header {
  text-align: center;
  padding: 22px 18px;
  border-radius: var(--r-lg);
}

.result-header.success {
  background: #ffffff;
  color: #000000;
}

.result-header.failed {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .28);
  color: #ffffff;
}

.result-header.pending {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .16);
  color: var(--shade-40);
}

.result-msg {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
  letter-spacing: .3px;
  margin-bottom: 8px;
}

.order-no {
  font-size: 11.5px;
  letter-spacing: .4px;
  opacity: .72;
}

.polling-info {
  text-align: center;
  padding: 16px 0 4px;
  font-size: 12.5px;
  color: var(--shade-40);
}

.polling-info p {
  margin-bottom: 12px;
}

.error-alert {
  margin-top: 18px;
  border-radius: var(--r-lg);
}

/* 我的订单 */
.my-order {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #ffffff;
}

.order-info-item > span:first-child {
  color: var(--shade-50);
}

@media (max-width: 960px) {
  .detail-grid { grid-template-columns: 1fr; }
  .order-panel { position: static; }
  .specs { grid-template-columns: 1fr; }
}
</style>
