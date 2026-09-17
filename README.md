# 秒杀商城前端

Vue 3 + Vite + Element Plus 秒ea杀商城管理界面，采用 Shopify 设计语言。

## 技术栈

- Vue 3 + Composition API
- Vite 8
- vue-router 4
- Pinia
- axios
- Element Plus + @element-plus/icons-vue
- dayjs

## 设计系统

双画布体系（Shopify DESIGN.md）：
- **暗色电影感轨**：用户端首页 /seckill
- **浅色奶油交易轨**：管理端 /admin/*

## 开发

```bash
npm install
npm run dev     # http://localhost:5173（或自动切换端口）
npm run build   # 产物输出 dist/
```

## 联调后端

后端地址默认 `http://localhost:8080`（可在 `src/api/index.js` 修改 `BASE_URL`）。

后端需启动：MySQL、Redis、RabbitMQ、Spring Boot 应用。

## 目录结构

```
src/
  api/          # axios 拦截器 + 接口封装
  components/   # 公共组件（倒计时等）
  router/       # 路由配置
  stores/       # Pinia store
  views/        # 页面组件
    user/       # 用户端（首页、详情）
    admin/      # 管理端（场次管理、订单管理）
  App.vue
  main.js
  style.css     # 设计令牌（CSS 变量）
```
