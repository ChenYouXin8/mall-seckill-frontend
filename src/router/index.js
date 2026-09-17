import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/seckill'
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    children: [
      { path: '', redirect: '/admin/activities' },
      { path: 'activities', component: () => import('@/views/admin/Activities.vue') },
      { path: 'orders', component: () => import('@/views/admin/Orders.vue') },
    ]
  },
  {
    path: '/seckill',
    component: () => import('@/views/user/Layout.vue'),
    children: [
      { path: '', component: () => import('@/views/user/SeckillList.vue') },
      { path: ':activityId', component: () => import('@/views/user/SeckillDetail.vue') },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
