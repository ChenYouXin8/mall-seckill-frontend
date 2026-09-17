<template>
  <div class="admin">
    <!-- 侧栏（浅色交易轨） -->
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-mark">秒</span>
        <div class="logo-text">
          <span class="logo-name">管理后台</span>
          <span class="logo-sub">Admin Console</span>
        </div>
      </div>

      <el-menu :default-active="$route.path" router class="admin-menu">
        <el-menu-item index="/admin/activities">
          <el-icon><Goods /></el-icon>
          <span>场次管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
      </el-menu>

      <div class="side-foot">
        <a class="back-link" @click="$router.push('/seckill')">← 返回用户端</a>
        <div class="status">
          <span class="dot"></span> 服务运行中
        </div>
      </div>
    </aside>

    <!-- 内容 -->
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.admin {
  display: flex;
  min-height: 100vh;
  background: var(--canvas-cream);
}

.sidebar {
  width: 236px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: var(--canvas-light);
  border-right: 1px solid var(--hairline-light);
  position: sticky;
  top: 0;
  height: 100vh;
}

.logo {
  height: 76px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 22px;
  border-bottom: 1px solid var(--hairline-light);
}

.logo-mark {
  width: 34px;
  height: 34px;
  border-radius: var(--r-pill);
  display: grid;
  place-items: center;
  background: #000000;
  color: #ffffff;
  font-weight: 700;
  font-size: 15px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.12;
}

.logo-name {
  font-size: 15px;
  font-weight: 550;
  letter-spacing: .4px;
  color: var(--ink);
}

.logo-sub {
  font-size: 9px;
  letter-spacing: 2.2px;
  text-transform: uppercase;
  color: var(--shade-50);
}

.admin-menu {
  border-right: none;
  background: transparent;
  flex: 1;
  padding: 16px 0;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--shade-50);
  --el-menu-hover-bg-color: rgba(0, 0, 0, .04);
  --el-menu-active-color: #ffffff;
}

.admin-menu :deep(.el-menu-item) {
  margin: 4px 14px;
  height: 44px;
  border-radius: var(--r-pill);
  font-weight: 550;
  font-size: 14px;
  transition: all .2s ease;
}

.admin-menu :deep(.el-menu-item:hover) {
  color: var(--ink);
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: #000000;
  color: #ffffff;
}

.side-foot {
  padding: 18px 22px 22px;
  border-top: 1px solid var(--hairline-light);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.back-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--shade-50);
  cursor: pointer;
  transition: color .2s ease;
}

.back-link:hover {
  color: var(--ink);
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--shade-50);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2fb344;
  box-shadow: 0 0 0 3px var(--aloe);
}

.main {
  flex: 1;
  min-width: 0;
  overflow: auto;
}

@media (max-width: 900px) {
  .sidebar { width: 72px; }
  .logo-text, .admin-menu :deep(.el-menu-item span), .side-foot { display: none; }
  .admin-menu :deep(.el-menu-item) { justify-content: center; padding: 0 !important; }
}
</style>
