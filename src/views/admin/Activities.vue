<template>
  <div class="page">
    <header class="page-head">
      <div>
        <div class="eyebrow-row">
          <p class="eyebrow page-eyebrow">ACTIVITIES / 01</p>
          <span class="head-live"><i></i> LIVE OPS</span>
        </div>
        <h2 class="display-md page-title">场次管理</h2>
        <p class="page-sub">创建秒杀场次 · 预热库存 · 下发抢购地址</p>
      </div>
      <div class="head-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadActivities">刷新数据</el-button>
        <el-button class="create-btn" type="primary" size="large" :icon="Plus" @click="showCreateDialog = true">创建场次</el-button>
      </div>
    </header>

    <section class="stats">
      <div class="stat stat--hero">
        <div class="stat-top"><span class="stat-label">TOTAL DROPS</span><span class="stat-code">01</span></div>
        <span class="stat-num display-md">{{ activities.length }}</span>
        <span class="stat-foot">全部秒杀活动</span>
      </div>
      <div class="stat stat--live">
        <div class="stat-top"><span class="stat-label">LIVE NOW</span><span class="signal"></span></div>
        <span class="stat-num display-md">{{ activeCount }}</span>
        <span class="stat-foot">当前抢购中</span>
      </div>
      <div class="stat">
        <div class="stat-top"><span class="stat-label">UPCOMING</span><span class="stat-code">03</span></div>
        <span class="stat-num display-md">{{ pendingCount }}</span>
        <span class="stat-foot">等待开场</span>
      </div>
      <div class="stat">
        <div class="stat-top"><span class="stat-label">ENDED</span><span class="stat-code">04</span></div>
        <span class="stat-num display-md">{{ endedCount }}</span>
        <span class="stat-foot">已结束场次</span>
      </div>
    </section>

    <section class="table-card">
      <div class="table-head">
        <div><p class="section-kicker">DROP DIRECTORY</p><h3>全部秒杀场次</h3></div>
        <span class="table-count">{{ activities.length }} ACTIVITIES</span>
      </div>
      <div class="table-wrap">
        <el-table :data="pagedActivities" v-loading="loading" class="table">
          <el-table-column label="场次" width="230" show-overflow-tooltip>
            <template #default="{ row, $index }">
              <div class="activity-cell">
                <span class="row-number">{{ String((currentPage - 1) * pageSize + $index + 1).padStart(2, '0') }}</span>
                <div><strong class="activity-title">{{ row.title || '未命名场次' }}</strong><span class="mono cell-id">ID {{ row.id }}</span></div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="productId" label="商品" width="92">
            <template #default="{ row }"><span class="product-chip">#{{ row.productId || '—' }}</span></template>
          </el-table-column>
          <el-table-column prop="price" label="秒杀价" width="110">
            <template #default="{ row }"><span class="price">¥{{ row.price || '—' }}</span></template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="92">
            <template #default="{ row }"><span class="stock-value">{{ row.stock ?? '—' }}</span></template>
          </el-table-column>
          <el-table-column label="活动时间" min-width="235">
            <template #default="{ row }"><div class="time-stack"><span class="mono cell-time">{{ formatTime(row.startTime) }}</span><span class="time-arrow">→</span><span class="mono cell-time">{{ formatTime(row.endTime) }}</span></div></template>
          </el-table-column>
          <el-table-column label="状态" width="116">
            <template #default="{ row }">
              <span v-if="row.status === 0" class="status-pill status--pending"><i></i> 未开始</span>
              <span v-else-if="row.status === 1" class="status-pill status--live"><i></i> 抢购中</span>
              <span v-else class="status-pill status--ended"><i></i> 已结束</span>
            </template>
          </el-table-column>
          <el-table-column label="预热" width="105">
            <template #default="{ row }"><span class="preheat-pill" :class="{ 'preheat--off': !row.preheated }">{{ row.preheated ? 'READY' : '—' }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="235" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button v-if="!row.preheated" size="small" @click="preheat(row)" :loading="preheatingId === row.id">预热</el-button>
                <el-button v-if="row.status === 1" size="small" type="primary" @click="showAddress(row)">抢购地址</el-button>
                <el-button size="small" @click="viewOrders(row)">订单</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <div class="pagination">
      <el-pagination background layout="total, prev, pager, next" :total="activities.length" v-model:current-page="currentPage" :page-size="pageSize" />
    </div>

    <el-dialog v-model="showCreateDialog" title="创建秒杀场次" width="520px">
      <div class="dialog-intro"><span>NEW FLASH SALE</span><p>设置场次、价格、库存和开放时间。</p></div>
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="场次名称" prop="title"><el-input v-model="createForm.title" placeholder="如：iPhone 16 限时抢购" /></el-form-item>
        <el-form-item label="商品ID" prop="productId"><el-input-number v-model="createForm.productId" :min="1" placeholder="商品ID" /></el-form-item>
        <el-form-item label="秒杀价(元)" prop="price"><el-input-number v-model="createForm.price" :min="0.01" :precision="2" /></el-form-item>
        <el-form-item label="库存数量" prop="stock"><el-input-number v-model="createForm.stock" :min="1" /></el-form-item>
        <el-form-item label="开始时间" prop="startTime"><el-date-picker v-model="createForm.startTime" type="datetime" placeholder="选择开始时间" style="width:100%" /></el-form-item>
        <el-form-item label="结束时间" prop="endTime"><el-date-picker v-model="createForm.endTime" type="datetime" placeholder="选择结束时间" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreateDialog = false">取消</el-button><el-button type="primary" :loading="creating" @click="createActivityFn">确认创建</el-button></template>
    </el-dialog>

    <el-dialog v-model="showAddressDialog" title="秒杀地址" width="440px">
      <div class="address-display" v-if="currentAddress">
        <p class="address-tip eyebrow">抢购地址 · 6 位随机串</p>
        <div class="address-value"><code>{{ currentAddress.secret }}</code><el-button :icon="CopyDocument" size="small" circle @click="copyAddress" /></div>
        <p class="address-url mono">POST /api/seckill/v1/{{ currentAddress.secret }}/order</p>
        <p class="address-ttl micro">有效期 {{ currentAddress.ttl }} 秒</p>
      </div>
      <div v-else class="address-empty"><p class="address-tip eyebrow">暂无可用地址</p><el-button type="primary" @click="regenerateAddress">生成秒杀地址</el-button></div>
      <template #footer v-if="currentAddress"><el-button @click="regenerateAddress">重新生成</el-button><el-button type="primary" @click="showAddressDialog = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createActivity, preheatActivity, listActivities, getAddress } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, CopyDocument, Refresh } from '@element-plus/icons-vue'
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

const createForm = ref({ title: '', productId: 1001, price: 99.00, stock: 100, startTime: dayjs().add(1, 'hour').toDate(), endTime: dayjs().add(3, 'hour').toDate() })
const createRules = {
  title: [{ required: true, message: '请输入场次名称', trigger: 'blur' }],
  productId: [{ required: true, message: '请输入商品ID', trigger: 'blur' }],
  price: [{ required: true, message: '请输入秒杀价', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}
const pagedActivities = computed(() => { const start = (currentPage.value - 1) * pageSize; return activities.value.slice(start, start + pageSize) })
const activeCount = computed(() => activities.value.filter(a => a.status === 1).length)
const pendingCount = computed(() => activities.value.filter(a => a.status === 0).length)
const endedCount = computed(() => activities.value.filter(a => a.status === 2).length)
function formatTime(timeStr) { return timeStr ? dayjs(timeStr).format('MM-DD HH:mm') : '-' }
async function loadActivities() {
  loading.value = true
  try {
    const res = await listActivities()
    activities.value = (res.data || []).map(a => { const now = Date.now(); const start = new Date(a.startTime).getTime(); const end = new Date(a.endTime).getTime(); a.status = now < start ? 0 : (now < end ? 1 : 2); return a })
    currentPage.value = 1
  } catch {} finally { loading.value = false }
}
async function createActivityFn() {
  try { await createFormRef.value.validate() } catch { return }
  creating.value = true
  try {
    await createActivity({ title: createForm.value.title, startTime: dayjs(createForm.value.startTime).format('YYYY-MM-DD HH:mm:ss'), endTime: dayjs(createForm.value.endTime).format('YYYY-MM-DD HH:mm:ss'), price: createForm.value.price, stocks: [{ productId: createForm.value.productId, totalStock: createForm.value.stock }] })
    ElMessage.success('场次创建成功！'); showCreateDialog.value = false; await loadActivities()
  } catch {} finally { creating.value = false }
}
async function preheat(row) { preheatingId.value = row.id; try { await preheatActivity(row.id); ElMessage.success(`场次「${row.title}」预热成功！`); row.preheated = true } finally { preheatingId.value = null } }
async function showAddress(row) { currentActivityForAddress.value = row; showAddressDialog.value = true; try { const res = await getAddress(row.id); currentAddress.value = { secret: res.data.address, ttl: res.data.expiresInSeconds } } catch { currentAddress.value = null } }
async function regenerateAddress() { const row = currentActivityForAddress.value; if (!row) return; try { const res = await getAddress(row.id); currentAddress.value = { secret: res.data.address, ttl: res.data.expiresInSeconds }; ElMessage.success('新地址已生成') } catch {} }
async function copyAddress() { if (!currentAddress.value) return; try { await navigator.clipboard.writeText(currentAddress.value.secret); ElMessage.success('地址已复制到剪贴板') } catch { ElMessage.error('复制失败，请手动复制') } }
function viewOrders(row) { ElMessageBox.confirm(`查看场次「${row.title}」的所有订单？`, '查看订单', { confirmButtonText: '查看', cancelButtonText: '取消' }).then(() => router.push('/admin/orders?activityId=' + row.id)).catch(() => {}) }
onMounted(loadActivities)
</script>

<style scoped>
.page { padding: 40px 40px 76px; animation: riseIn .45s cubic-bezier(.2,.7,.3,1) both; }
.page-head { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:30px; }
.eyebrow-row { display:flex; align-items:center; gap:12px; margin-bottom:13px; }
.page-eyebrow { margin:0; color:var(--shade-50); }
.head-live { display:inline-flex; align-items:center; gap:6px; padding:5px 9px; border:1px solid rgba(25,25,25,.08); border-radius:99px; background:rgba(255,255,255,.58); font-family:var(--font-mono); font-size:8px; letter-spacing:1.2px; color:#696963; }
.head-live i,.signal { width:6px; height:6px; border-radius:50%; background:#5fa967; box-shadow:0 0 0 3px rgba(95,169,103,.12); }
.page-title { margin:0 0 9px; color:var(--ink); }
.page-sub { font-size:13px; color:var(--shade-50); }
.head-actions { display:flex; align-items:center; gap:9px; }
.create-btn { min-width:128px; }
.stats { display:grid; grid-template-columns:1.25fr repeat(3,1fr); gap:12px; margin-bottom:18px; }
.stat { min-height:135px; padding:19px 20px 17px; border:1px solid rgba(20,20,20,.07); border-radius:16px; background:rgba(255,255,255,.78); box-shadow:0 14px 42px rgba(28,28,23,.055); display:flex; flex-direction:column; }
.stat--hero { color:#fff; background:#181818; border-color:#181818; }
.stat--live { background:#e9f2e5; }
.stat-top { display:flex; align-items:center; justify-content:space-between; }
.stat-label { font-family:var(--font-mono); font-size:9px; letter-spacing:1.6px; color:var(--shade-50); }
.stat--hero .stat-label { color:rgba(255,255,255,.45); }
.stat-code { font-family:var(--font-mono); font-size:8px; color:var(--shade-40); }
.stat--hero .stat-code { color:rgba(255,255,255,.3); }
.stat-num { margin-top:16px; color:var(--ink); font-variant-numeric:tabular-nums; }
.stat--hero .stat-num { color:#fff; }
.stat-foot { margin-top:auto; font-size:10.5px; color:var(--shade-40); }
.stat--hero .stat-foot { color:rgba(255,255,255,.42); }
.table-card { overflow:hidden; border:1px solid rgba(20,20,20,.07); border-radius:16px; background:rgba(255,255,255,.83); box-shadow:0 16px 54px rgba(28,28,23,.055); }
.table-head { min-height:78px; padding:17px 20px 15px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(20,20,20,.07); }
.section-kicker { margin-bottom:6px; font-family:var(--font-mono); font-size:8px; letter-spacing:1.7px; color:var(--shade-40); }
.table-head h3 { font-size:16px; font-weight:620; }
.table-count { font-family:var(--font-mono); font-size:8px; letter-spacing:1.1px; color:var(--shade-40); }
.table-wrap { overflow:hidden; }
.table { width:100%; }
.activity-cell { display:flex; align-items:center; gap:11px; min-width:0; }
.row-number { font-family:var(--font-mono); font-size:9px; color:#b4b4ad; }
.activity-cell > div { min-width:0; display:flex; flex-direction:column; gap:4px; }
.activity-title { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12.5px; font-weight:620; }
.cell-id,.cell-time { font-size:10px; color:var(--shade-40); }
.product-chip { display:inline-flex; padding:5px 8px; border-radius:8px; background:#f1efe9; font-family:var(--font-mono); font-size:9px; color:#686861; }
.price { font-weight:650; font-variant-numeric:tabular-nums; }
.stock-value { font-variant-numeric:tabular-nums; color:#55554f; }
.time-stack { display:flex; align-items:center; gap:7px; }
.time-arrow { color:#c4c3bc; }
.status-pill { display:inline-flex; align-items:center; gap:6px; width:max-content; padding:6px 9px; border-radius:99px; font-size:10px; font-weight:560; }
.status-pill i { width:5px; height:5px; border-radius:50%; background:currentColor; }
.status--pending { color:#85847c; background:#f0eee8; }
.status--live { color:#457d4d; background:#e4f1e1; }
.status--ended { color:#a09f98; background:#f3f2ee; }
.preheat-pill { display:inline-flex; padding:6px 8px; border-radius:99px; background:#edf5e9; color:#5d8559; font-family:var(--font-mono); font-size:8px; letter-spacing:1px; }
.preheat--off { background:#f0eee8; color:#9d9c94; }
.row-actions { display:flex; gap:6px; flex-wrap:wrap; }
.pagination { display:flex; justify-content:flex-end; margin-top:18px; }
.dialog-intro { margin-bottom:18px; padding:13px 14px; border-radius:11px; background:#f4f2ed; }
.dialog-intro span { font-family:var(--font-mono); font-size:8px; letter-spacing:1.4px; color:#7d7c74; }
.dialog-intro p { margin-top:5px; font-size:12px; color:#77766f; }
.address-display { text-align:center; padding:4px 0 9px; }
.address-tip { color:var(--shade-50); }
.address-value { display:flex; align-items:center; justify-content:center; gap:12px; margin:20px 0; }
.address-value code { padding:16px 20px; border:1px solid rgba(20,20,20,.08); border-radius:12px; background:#f4f2ed; font-family:var(--font-mono); font-size:28px; font-weight:520; letter-spacing:6px; color:var(--ink); }
.address-url { margin-top:4px; font-size:9px; color:#88877f; word-break:break-all; }
.address-ttl { margin-top:12px; color:#aaa9a1; }
.address-empty { padding:20px 0; text-align:center; }
.address-empty .address-tip { margin-bottom:16px; }
:deep(.el-table) { background:transparent; }
:deep(.el-table__inner-wrapper::before) { display:none; }
:deep(.el-table th.el-table__cell) { background:#f7f5f0; color:#87867f; border-bottom:1px solid rgba(20,20,20,.07); }
:deep(.el-table td.el-table__cell) { border-bottom:1px solid rgba(20,20,20,.055); }
:deep(.el-table tr:last-child td.el-table__cell) { border-bottom:none; }
:deep(.el-table .el-table__body tr:hover > td.el-table__cell) { background:#fbfaf7; }
:deep(.el-button--small) { min-height:30px; padding:0 11px; font-size:11px; }
:deep(.el-dialog__header) { padding-bottom:8px; }
:deep(.el-form-item__label) { font-size:12px; color:#66655e; }
@media (max-width:1120px) { .stats { grid-template-columns:repeat(2,1fr); } .page { padding:32px 24px 64px; } }
@media (max-width:760px) { .page-head { align-items:flex-start; flex-direction:column; } .head-actions { width:100%; } .head-actions .el-button { flex:1; } .stats { grid-template-columns:1fr 1fr; } .time-stack { display:block; } .time-arrow { display:none; } }
</style>
