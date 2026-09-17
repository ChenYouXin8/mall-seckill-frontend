import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截：注入认证 token + userId
api.interceptors.request.use(config => {
  config.headers['Authorization'] = 'Bearer test-token'
  config.headers['X-User-Id'] = localStorage.getItem('userId') || '10001'
  return config
})

// 响应拦截
api.interceptors.response.use(
  res => {
    const data = res.data
    if (data.code && data.code !== 0) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(data)
    }
    return data
  },
  err => {
    ElMessage.error(err.response?.data?.message || '网络错误，请稍后重试')
    return Promise.reject(err)
  }
)

// ============ 场次管理（Admin） ============
export const createActivity = (data) =>
  api.post('/admin/seckill/activities', data)

export const preheatActivity = (id) =>
  api.post(`/admin/seckill/activities/${id}/preheat`)

export const listActivities = () =>
  api.get('/seckill/v1/activities')

export const getActivityDetail = (id) =>
  api.get(`/admin/seckill/activities/${id}`)

// ============ 用户抢购 ============
export const getAddress = (activityId) =>
  api.get(`/seckill/v1/address/${activityId}`)

export const submitOrder = (secretPath, data) =>
  api.post(`/seckill/v1/${secretPath}/order`, data)

// ============ 订单查询 ============
export const pollOrderResult = (orderNo) =>
  api.get('/seckill/v1/order/result', { params: { orderNo } })

export const payOrder = (orderNo) =>
  api.post('/seckill/v1/order/pay', { orderNo })

export const listMyOrders = () =>
  api.get('/seckill/v1/order/list')

export default api
