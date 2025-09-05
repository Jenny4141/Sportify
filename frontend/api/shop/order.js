import { apiClient } from '@/api/axios'

// 獲取用戶訂單列表
export const getUserOrders = async (params = {}) => {
  const res = await apiClient.get('/shop/order/orders', { params })
  return res.data
}
// 獲取用戶單一訂單詳情
export const getOrderDetail = async (orderId, params = {}) => {
  const res = await apiClient.get(`/shop/order/${orderId}`, { params })
  return res.data
}
