import { apiClient } from '@/api/axios'

/**
 * 訂單 API 呼叫函數集合
 * 提供用戶訂單查詢相關的 API 操作
 * 所有 API 都需要登入授權，只能查詢屬於當前用戶的訂單
 */

/**
 * 獲取當前用戶的所有訂單列表 - 用於會員中心的訂單歷史
 * 按照建立時間倒序排列，最新的訂單在最前面
 *
 * 包含資訊：
 * - 訂單基本資訊 (編號、狀態、總金額)
 * - 配送和付款方式
 * - 訂單項目和商品資訊
 * - 發票資訊
 *
 * @param {Object} params - 查詢參數 (目前未使用，保留擴展空間)
 * @returns {Promise<Array>} 訂單列表陣列
 */
export const getUserOrders = async (params = {}) => {
  const res = await apiClient.get('/shop/order/orders', { params })
  return res.data
}

/**
 * 獲取單一訂單的詳細資訊 - 用於訂單詳情頁面
 * 包含最完整的訂單資訊，包含商品圖片和詳細資訊
 *
 * 包含資訊：
 * - 訂單完整資訊 (收件人、地址、電話等)
 * - 所有訂單項目的詳細資訊
 * - 商品圖片和规格
 * - 付款、配送、發票資訊
 * - 訂單狀態跟蹤
 *
 * @param {string|number} orderId - 訂單 ID
 * @param {Object} params - 查詢參數 (目前未使用，保留擴展空間)
 * @returns {Promise<Object>} 訂單詳細資訊
 */
export const getOrderDetail = async (orderId, params = {}) => {
  const res = await apiClient.get(`/shop/order/${orderId}`, { params })
  return res.data
}
