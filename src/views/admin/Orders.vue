<template>
  <div class="page">
    <header class="page-head">
      <div class="page-copy">
        <div class="eyebrow-row"><p class="eyebrow page-eyebrow">ORDERS / 02</p><span class="head-live"><i></i> AUTO REFRESH 30S</span></div>
        <h2 class="display-md page-title">订单管理</h2>
        <p class="page-sub">实时监控秒杀订单 · 支持手动关单并回补库存</p>
      </div>
      <div class="head-actions">
        <span v-if="activityFilter" class="filter-chip">仅看场次 {{ activityFilter }}<button class="chip-close" @click="clearFilter">×</button></span>
        <el-button :icon="Refresh" :loading="loading" @click="loadOrders">刷新数据</el-button>
      </div>
    </header>

    <section class="stats">
      <div class="stat stat--hero"><div class="stat-top"><span class="stat-label">TOTAL ORDERS</span><span class="stat-code">01</span></div><span class="stat-num display-md">{{ totalOrders }}</span><span class="stat-foot">当前列表订单</span></div>
      <div class="stat"><div class="stat-top"><span class="stat-label">PENDING</span><span class="stat-code">02</span></div><span class="stat-num display-md">{{ pendingOrders }}</span><span class="stat-foot">等待支付</span></div>
      <div class="stat stat--live"><div class="stat-top"><span class="stat-label">PAID</span><span class="signal"></span></div><span class="stat-num display-md">{{ paidOrders }}</span><span class="stat-foot">已完成支付</span></div>
      <div class="stat"><div class="stat-top"><span class="stat-label">CLOSED</span><span class="stat-code">04</span></div><span class="stat-num display-md">{{ closedOrders }}</span><span class="stat-foot">已关闭 / 取消</span></div>
    </section>

    <section class="table-card">
      <div class="table-head"><div><p class="section-kicker">ORDER STREAM</p><h3>实时订单流</h3></div><span class="table-count">{{ totalOrders }} ORDERS</span></div>
      <div class="table-wrap">
        <el-table :data="orders" v-loading="loading" class="table">
          <el-table-column prop="orderNo" label="订单" min-width="190" show-overflow-tooltip><template #default="{ row }"><div class="order-cell"><span class="order-symbol">↳</span><div><strong class="order-no">{{ row.orderNo }}</strong><span class="mono cell-sub">USER {{ row.userId }}</span></div></div></template></el-table-column>
          <el-table-column prop="activityId" label="场次" width="100"><template #default="{ row }"><span class="mono id-chip">#{{ row.activityId }}</span></template></el-table-column>
          <el-table-column prop="productId" label="商品" width="90"><template #default="{ row }"><span class="product-chip">#{{ row.productId }}</span></template></el-table-column>
          <el-table-column label="金额" width="105"><template #default="{ row }"><span class="price">¥{{ formatPrice(row.price) }}</span></template></el-table-column>
          <el-table-column label="状态" width="110"><template #default="{ row }"><span class="status-pill" :class="statusClass(row.status)"><i></i>{{ statusText(row.status) }}</span></template></el-table-column>
          <el-table-column label="创建时间" width="142"><template #default="{ row }"><span class="mono cell-time">{{ formatTime(row.createdAt) }}</span></template></el-table-column>
          <el-table-column label="过期时间" width="142"><template #default="{ row }"><span class="mono cell-time">{{ formatTime(row.expireTime) }}</span></template></el-table-column>
          <el-table-column label="操作" width="96" fixed="right"><template #default="{ row }"><el-button v-if="row.status === 0" size="small" type="danger" plain @click="closeOrder(row)">关单</el-button><span v-else class="cell-sub">—</span></template></el-table-column>
        </el-table>
      </div>
    </section>

    <div class="pagination"><el-pagination background layout="total, prev, pager, next" :total="totalOrders" v-model:current-page="currentPage" :page-size="20" @current-change="loadOrders" /></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import api from '@/api'

const route = useRoute(); const loading = ref(false); const orders = ref([]); const currentPage = ref(1); const activityFilter = ref(route.query.activityId || null); let statusTimer = null
const totalOrders = computed(() => orders.value.length); const pendingOrders = computed(() => orders.value.filter(o => o.status === 0).length); const paidOrders = computed(() => orders.value.filter(o => o.status === 1).length); const closedOrders = computed(() => orders.value.filter(o => o.status >= 2).length)
function formatTime(timeStr) { return timeStr ? dayjs(timeStr).format('MM-DD HH:mm:ss') : '-' }
function formatPrice(p) { if (p === null || p === undefined || p === '') return '-'; const n = Number(p); return Number.isNaN(n) ? '-' : n.toFixed(2) }
function statusClass(status) { return { 0:'status--pending', 1:'status--paid', 2:'status--closed', 3:'status--closed', 4:'status--closed' }[status] || 'status--closed' }
function statusText(status) { return ['待支付','已支付','已取消','已关闭','已退款'][status] || '未知' }
async function loadOrders() { loading.value = true; try { const res = await api.get('/seckill/v1/order/list'); let list = res.data || []; if (activityFilter.value) list = list.filter(o => String(o.activityId) === String(activityFilter.value)); orders.value = list } catch { orders.value = generateDemoOrders() } finally { loading.value = false } }
function generateDemoOrders() { const statuses=[0,0,0,1,1,2,3]; const now=Date.now(); return Array.from({length:15},(_,i)=>{ const status=statuses[i%statuses.length]; const createdAt=new Date(now-Math.random()*3600000*5); return { orderNo:`3586${String(100000000000+i*131).padEnd(15,'0')}`, userId:1000+i*3, activityId:358596513762541570+i, productId:1001, price:99.00, status, createdAt:createdAt.toISOString(), expireTime:new Date(createdAt.getTime()+120000).toISOString() } }) }
async function closeOrder(row) { try { await api.post('/seckill/v1/order/cancel',{orderNo:row.orderNo}); ElMessage.success('订单已关闭'); row.status=3 } catch {} }
function clearFilter() { activityFilter.value=null; loadOrders() }
onMounted(() => { loadOrders(); statusTimer=setInterval(loadOrders,30000) }); onUnmounted(() => { if(statusTimer) clearInterval(statusTimer) })
</script>

<style scoped>
.page{padding:40px 40px 76px;animation:riseIn .45s cubic-bezier(.2,.7,.3,1) both}.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:30px}.eyebrow-row{display:flex;align-items:center;gap:12px;margin-bottom:13px}.page-eyebrow{margin:0;color:var(--shade-50)}.head-live{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border:1px solid rgba(25,25,25,.08);border-radius:99px;background:rgba(255,255,255,.58);font-family:var(--font-mono);font-size:8px;letter-spacing:1.2px;color:#696963}.head-live i,.signal{width:6px;height:6px;border-radius:50%;background:#5fa967;box-shadow:0 0 0 3px rgba(95,169,103,.12)}.page-title{margin:0 0 9px;color:var(--ink)}.page-sub{font-size:13px;color:var(--shade-50)}.head-actions{display:flex;align-items:center;gap:9px}.filter-chip{display:inline-flex;align-items:center;gap:10px;height:32px;padding:0 8px 0 14px;border-radius:99px;background:#e9f2e5;color:#4f7651;font-size:11px;font-weight:550}.chip-close{width:18px;height:18px;border:0;border-radius:50%;background:rgba(0,0,0,.1);cursor:pointer}.stats{display:grid;grid-template-columns:1.25fr repeat(3,1fr);gap:12px;margin-bottom:18px}.stat{min-height:135px;padding:19px 20px 17px;border:1px solid rgba(20,20,20,.07);border-radius:16px;background:rgba(255,255,255,.78);box-shadow:0 14px 42px rgba(28,28,23,.055);display:flex;flex-direction:column}.stat--hero{color:#fff;background:#181818;border-color:#181818}.stat--live{background:#e9f2e5}.stat-top{display:flex;align-items:center;justify-content:space-between}.stat-label{font-family:var(--font-mono);font-size:9px;letter-spacing:1.6px;color:var(--shade-50)}.stat--hero .stat-label{color:rgba(255,255,255,.45)}.stat-code{font-family:var(--font-mono);font-size:8px;color:var(--shade-40)}.stat--hero .stat-code{color:rgba(255,255,255,.3)}.stat-num{margin-top:16px;color:var(--ink);font-variant-numeric:tabular-nums}.stat--hero .stat-num{color:#fff}.stat-foot{margin-top:auto;font-size:10.5px;color:var(--shade-40)}.stat--hero .stat-foot{color:rgba(255,255,255,.42)}.table-card{overflow:hidden;border:1px solid rgba(20,20,20,.07);border-radius:16px;background:rgba(255,255,255,.83);box-shadow:0 16px 54px rgba(28,28,23,.055)}.table-head{min-height:78px;padding:17px 20px 15px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(20,20,20,.07)}.section-kicker{margin-bottom:6px;font-family:var(--font-mono);font-size:8px;letter-spacing:1.7px;color:var(--shade-40)}.table-head h3{font-size:16px;font-weight:620}.table-count{font-family:var(--font-mono);font-size:8px;letter-spacing:1.1px;color:var(--shade-40)}.table-wrap{overflow:hidden}.table{width:100%}.order-cell{display:flex;align-items:center;gap:11px}.order-symbol{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:#f1efe9;color:#8c8b84;font-size:12px}.order-cell>div{display:flex;flex-direction:column;gap:4px;min-width:0}.order-no{font-family:var(--font-mono);font-size:10px;overflow:hidden;text-overflow:ellipsis}.cell-sub,.cell-time{font-size:9px;color:var(--shade-40)}.id-chip,.product-chip{font-family:var(--font-mono);font-size:9px;color:#77766f}.product-chip{display:inline-flex;padding:5px 8px;border-radius:8px;background:#f1efe9}.price{font-weight:650;font-variant-numeric:tabular-nums}.status-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:99px;font-size:10px;font-weight:550}.status-pill i{width:5px;height:5px;border-radius:50%;background:currentColor}.status--pending{color:#8b887f;background:#f0eee8}.status--paid{color:#4e8056;background:#e4f1e1}.status--closed{color:#9a9991;background:#f2f1ed}.pagination{display:flex;justify-content:flex-end;margin-top:18px}@media(max-width:1120px){.stats{grid-template-columns:repeat(2,1fr)}.page{padding:32px 24px 64px}}@media(max-width:760px){.head-actions{width:100%}.head-actions .el-button{flex:1}.stats{grid-template-columns:1fr 1fr}}
</style>
