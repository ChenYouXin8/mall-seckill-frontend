<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand-block">
        <div class="brand-mark">秒</div>
        <div class="brand-copy">
          <strong>秒杀商城</strong>
          <span>ADMIN CONSOLE</span>
        </div>
      </div>

      <div class="workspace-label">OPERATIONS</div>
      <el-menu :default-active="$route.path" router class="admin-menu">
        <el-menu-item index="/admin/activities">
          <span class="menu-index">01</span>
          <el-icon><Goods /></el-icon>
          <span>场次管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <span class="menu-index">02</span>
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-bottom">
        <div class="service-card">
          <div class="service-dot"></div>
          <div>
            <strong>服务运行中</strong>
            <span>SECKILL API · ONLINE</span>
          </div>
        </div>
        <a class="back-link" @click="$router.push('/seckill')">
          <span>↗</span>
          返回用户端
        </a>
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <div class="topbar-path">
          <span>SECKILL MALL</span>
          <i>/</i>
          <strong>{{ $route.path.includes('orders') ? 'ORDERS' : 'ACTIVITIES' }}</strong>
        </div>
        <div class="topbar-meta">
          <span class="live-dot"></span>
          <span>实时数据</span>
        </div>
      </div>
      <router-view />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.admin-shell {
  --admin-ink: #141414;
  --admin-muted: #7d7d78;
  --admin-soft: #a7a79f;
  --admin-line: rgba(20, 20, 20, .08);
  --admin-card: #ffffff;
  --admin-canvas: #f4f2ed;
  display: flex;
  min-height: 100vh;
  background: var(--admin-canvas);
  color: var(--admin-ink);
}

.sidebar {
  position: sticky;
  top: 0;
  width: 248px;
  height: 100vh;
  flex: 0 0 248px;
  display: flex;
  flex-direction: column;
  background: #171717;
  color: #fff;
  overflow: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 10% 10%, rgba(255,255,255,.08), transparent 30%),
    linear-gradient(180deg, rgba(255,255,255,.025), transparent 45%);
}

.brand-block,
.workspace-label,
.admin-menu,
.sidebar-bottom {
  position: relative;
  z-index: 1;
}

.brand-block {
  height: 92px;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 0 22px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.brand-mark {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #fff;
  color: #171717;
  font-size: 16px;
  font-weight: 750;
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.brand-copy strong {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: .2px;
}

.brand-copy span {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.8px;
  color: rgba(255,255,255,.42);
}

.workspace-label {
  padding: 25px 24px 10px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(255,255,255,.32);
}

.admin-menu {
  flex: 1;
  padding: 0 12px;
  border-right: none;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: rgba(255,255,255,.58);
  --el-menu-hover-bg-color: rgba(255,255,255,.06);
  --el-menu-active-color: #fff;
}

.admin-menu :deep(.el-menu-item) {
  height: 54px;
  margin: 5px 0;
  padding: 0 13px !important;
  border-radius: 12px;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 550;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}

.admin-menu :deep(.el-menu-item:hover) {
  color: #fff;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: rgba(255,255,255,.1);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
}

.admin-menu :deep(.el-icon) {
  width: 18px;
  height: 18px;
  margin: 0;
}

.menu-index {
  width: 22px;
  flex: 0 0 22px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: rgba(255,255,255,.28);
}

.admin-menu :deep(.el-menu-item.is-active) .menu-index {
  color: rgba(255,255,255,.62);
}

.sidebar-bottom {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,.08);
}

.service-card {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 13px;
  border: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.035);
  border-radius: 12px;
}

.service-card strong,
.service-card span {
  display: block;
}

.service-card strong {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,.78);
}

.service-card span {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 1px;
  color: rgba(255,255,255,.3);
}

.service-dot,
.live-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: #6fcf7a;
  box-shadow: 0 0 0 4px rgba(111,207,122,.12);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  padding: 0 4px;
  font-size: 11.5px;
  color: rgba(255,255,255,.42);
  cursor: pointer;
  transition: color .2s ease;
}

.back-link:hover {
  color: #fff;
}

.main {
  flex: 1;
  min-width: 0;
  background:
    radial-gradient(circle at 88% 6%, rgba(255,255,255,.72), transparent 25%),
    var(--admin-canvas);
}

.topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  border-bottom: 1px solid var(--admin-line);
  background: rgba(244,242,237,.86);
  backdrop-filter: blur(16px);
}

.topbar-path {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 1.2px;
  color: var(--admin-soft);
}

.topbar-path strong {
  color: var(--admin-ink);
  font-weight: 600;
}

.topbar-path i {
  font-style: normal;
  color: #c9c8c2;
}

.topbar-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 11px;
  color: var(--admin-muted);
}

@media (max-width: 900px) {
  .sidebar {
    width: 74px;
    flex-basis: 74px;
  }

  .brand-block {
    justify-content: center;
    padding: 0;
  }

  .brand-copy,
  .workspace-label,
  .menu-index,
  .sidebar-bottom {
    display: none;
  }

  .admin-menu {
    padding: 10px;
  }

  .admin-menu :deep(.el-menu-item) {
    justify-content: center;
    padding: 0 !important;
  }

  .topbar {
    padding: 0 22px;
  }

  .topbar-path span,
  .topbar-path i {
    display: none;
  }
}
</style>
