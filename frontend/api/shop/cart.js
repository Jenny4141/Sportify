import { apiClient } from '@/api/axios'

// 取得購物車資料
export const getCarts = async () => {
  const res = await apiClient.get('/shop/cart')
  return res.data
}
// 新增商品到購物車
export const addProductCart = async (productId, quantity) => {
  const res = await apiClient.post('/shop/cart/add', { productId, quantity })
  return res.data
}
// 更新購物車商品數量
export const updateCarts = async (cartItemId, quantity) => {
  const res = await apiClient.put(`/shop/cart/item/${cartItemId}`, {
    quantity,
  })
  return res.data
}
// 從購物車移除單一商品
export const removeCart = async (cartItemId) => {
  const res = await apiClient.delete(`/shop/cart/item/${cartItemId}`)
  return res.data
}
// 清空購物車
export const clearCarts = async () => {
  const res = await apiClient.delete('/shop/cart/clear')
  return res.data
}
// 準備結帳資料
export const getCheckoutData = async () => {
  const res = await apiClient.get('/shop/cart/checkout')
  return res.data
}
// 執行結帳 - 創建訂單
export const checkout = async (orderData) => {
  const res = await apiClient.post('/shop/cart/checkout', orderData)
  return res.data
}
