import { apiClient } from '@/api/axios'


// 取得用戶的所有訂單列表
export const getUserOrders = async (params = {}) => {
  const res = await apiClient.get('/shop/order/orders', { params })
  return res.data
}

// 取得單一訂單資訊
export const getOrderDetail = async (orderId, params = {}) => {
  const res = await apiClient.get(`/shop/order/${orderId}`, { params })
  return res.data
}
