import { apiClient } from '@/api/axios'

/**
 * 購物車 API 呼叫函數集合
 * 提供完整的購物車機能，包含 CRUD 操作和結帳流程
 * 所有 API 都需要登入授權，會自動帶上 JWT token
 */

/**
 * 取得當前用戶的購物車內容 - 用於購物車頁面
 * 包含所有購物車項目、商品資訊、圖片、價格等
 *
 * @returns {Promise<Object>} 購物車資訊包含：
 *   - cart: 購物車物件和項目列表
 *   - totalPrice: 總價格
 *   - itemCount: 商品總數
 */
export const getCarts = async () => {
  const res = await apiClient.get('/shop/cart')
  return res.data
}

/**
 * 新增商品到購物車 - 用於商品詳情頁和列表頁
 * 如果商品已存在於購物車中，會累加數量
 * 會自動檢查庫存是否足夠
 *
 * @param {number} productId - 商品ID
 * @param {number} quantity - 加入數量 (通常為 1)
 * @returns {Promise<Object>} 操作結果
 */
export const addProductCart = async (productId, quantity) => {
  const res = await apiClient.post('/shop/cart/add', { productId, quantity })
  return res.data
}

/**
 * 更新購物車中特定項目的數量 - 用於購物車頁面的 +/- 按鈕
 * 如果數量設為 0 或負數，會刪除該項目
 *
 * @param {number} cartItemId - 購物車項目ID (非商品ID)
 * @param {number} quantity - 新的數量
 * @returns {Promise<Object>} 操作結果
 */
export const updateCarts = async (cartItemId, quantity) => {
  const res = await apiClient.put(`/shop/cart/item/${cartItemId}`, {
    quantity,
  })
  return res.data
}

/**
 * 從購物車移除單一商品 - 用於購物車頁面的刪除按鈕
 *
 * @param {number} cartItemId - 購物車項目ID
 * @returns {Promise<Object>} 操作結果
 */
export const removeCart = async (cartItemId) => {
  const res = await apiClient.delete(`/shop/cart/item/${cartItemId}`)
  return res.data
}

/**
 * 清空整個購物車 - 用於購物車頁面的清空按鈕
 * 會刪除所有購物車項目
 *
 * @returns {Promise<Object>} 操作結果
 */
export const clearCarts = async () => {
  const res = await apiClient.delete('/shop/cart/clear')
  return res.data
}

/**
 * 取得結帳所需的所有資料 - 用於結帳頁面初始化
 * 包含購物車內容、付款方式、配送方式、發票類型等
 * 會自動驗證庫存和計算運費
 *
 * @returns {Promise<Object>} 結帳所需的完整資訊
 */
export const getCheckoutData = async () => {
  const res = await apiClient.get('/shop/cart/checkout')
  return res.data
}

/**
 * 執行結帳並創建訂單 - 結帳流程的最後一步
 * 會執行：
 * 1. 最終庫存檢查
 * 2. 創建訂單和訂單項目
 * 3. 更新商品庫存
 * 4. 清空購物車
 * 5. 生成訂單編號和發票
 *
 * @param {Object} orderData - 訂單資訊包含收件人、付款方式等
 * @returns {Promise<Object>} 建立的訂單資訊
 */
export const checkout = async (orderData) => {
  const res = await apiClient.post('/shop/cart/checkout', orderData)
  return res.data
}
