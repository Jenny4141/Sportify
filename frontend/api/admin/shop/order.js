import { adminApiClient } from '@/api/axios'

// 獲取所有訂單
export const getAllOrders = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await adminApiClient.get(`/shop/order?${query}`)
  return res.data
}
// 獲取單一訂單
export const getOrderById = async (id) => {
  const res = await adminApiClient.get(`/shop/order/${id}`)
  return res.data
}
// 創建新訂單
export const createAdminOrder = async (data) => {
  const res = await adminApiClient.post('/shop/order', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
// 更新訂單
export const updateOrder = async (id, data) => {
  const res = await adminApiClient.put(`/shop/order/${id}`, data)
  return res.data
}
// 刪除訂單
export const deleteOrder = async (deletedId) => {
  const res = await adminApiClient.delete(`/shop/order/${deletedId}`)
  return res.data
}
