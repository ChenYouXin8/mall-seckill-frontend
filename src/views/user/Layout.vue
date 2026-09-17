<template>
  <div class="track-night">
    <!-- 暗色导航（nav-bar-dark） -->
    <header class="nav">
      <div class="nav-inner">
        <div class="brand" @click="$router.push('/seckill')">
          <span class="brand-mark">秒</span>
          <span class="brand-text">
            <span class="brand-name">秒杀商城</span>
            <span class="brand-sub">Seckill Mall</span>
          </span>
        </div>

        <nav class="nav-links">
          <router-link to="/seckill" exact-active-class="is-active">抢购首页</router-link>
        </nav>

        <div class="nav-actions">
          <button class="user-pill" @click="dialogVisible = true">
            <span class="avatar">{{ avatarText }}</span>
            <span class="uname">用户 {{ store.userId }}</span>
          </button>
          <el-button class="pill-solid-white nav-cta" @click="$router.push('/admin')">
            管理后台
          </el-button>
        </div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="stage">
      <router-view />
    </main>

    <!-- 页脚（footer-dark） -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">秒杀商城 · SECKILL MALL</div>
        <div class="footer-links">
          <span>Redis 原子预减</span>
          <span>RabbitMQ 异步下单</span>
          <span>MySQL 乐观锁兜底</span>
        </div>
        <div class="footer-legal">© 2026 mall-seckill · 高并发秒杀演示系统</div>
      </div>
    </footer>

    <!-- 切换用户对话框（浅色交易轨组件） -->
    <el-dialog v-model="dialogVisible" title="切换用户" width="400px">
      <el-form label-width="80px">
        <el-form-item label="用户ID">
          <el-input v-model="inputUserId" placeholder="请输入用户ID（数字）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="switchUser">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const dialogVisible = ref(false)
const inputUserId = ref(store.userId)

const avatarText = computed(() => {
  const s = String(store.userId || '')
  return s.length > 2 ? s.slice(-2) : s || 'U'
})

function switchUser() {
  if (!inputUserId.value) {
    ElMessage.warning('请输入用户ID')
    return
  }
  store.setUserId(inputUserId.value)
  dialogVisible.value = false
  ElMessage.success(`已切换为用户 ${inputUserId.value}`)
}
</script>

<style scoped>
.track-night {
  min-height: 100vh;
  background: var(--canvas-night);
  color: var(--on-primary);
  display: flex;
  flex-direction: column;
}

/* ---------- 导航 ---------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 17, 23, .82);
  backdrop-filter: saturate(180%) blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
}

.nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 72px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: var(--r-pill);
  display: grid;
  place-items: center;
  background: #ffffff;
  color: #000000;
  font-weight: 700;
  font-size: 15px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-name {
  font-size: 17px;
  font-weight: 550;
  letter-spacing: .5px;
  color: #ffffff;
}

.brand-sub {
  font-size: 9.5px;
  font-weight: 400;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--shade-50);
}

.nav-links {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-links a {
  color: var(--shade-40);
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: var(--r-pill);
  transition: color .2s ease, background-color .2s ease;
}

.nav-links a:hover {
  color: #ffffff;
}

.nav-links a.is-active {
  color: #ffffff;
  background: rgba(255, 255, 255, .1);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 38px;
  padding: 0 16px 0 5px;
  border-radius: var(--r-pill);
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, .9);
  color: #ffffff;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
  transition: background-color .2s ease;
}

.user-pill:hover {
  background: rgba(255, 255, 255, .12);
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #ffffff;
  color: #000000;
  font-size: 11px;
  font-weight: 700;
}

.nav-cta {
  height: 38px;
}

/* ---------- 舞台 ---------- */
.stage {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px 96px;
}

/* ---------- 页脚 ---------- */
.footer {
  border-top: 1px solid rgba(255, 255, 255, .08);
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 56px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.footer-brand {
  font-size: 14px;
  font-weight: 550;
  letter-spacing: 1.2px;
  color: #ffffff;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.footer-links span {
  font-size: 13px;
  color: var(--link-cool-1);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer-legal {
  font-size: 12px;
  letter-spacing: .3px;
  color: var(--shade-50);
}

@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-inner { gap: 16px; justify-content: space-between; }
}
</style>
