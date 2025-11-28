import { apiClient } from '@/api/axios'

/**
 * 商品收藏 API 呼叫函數集合
 * 提供愛心功能相關的 API 操作
 * 所有 API 都需要登入授權
 */

/**
 * 切換商品收藏狀態 - 用於愛心按鈕的點擊事件
 * 這是一個切換型 API：
 * - 如果已收藏，則移除收藏
 * - 如果未收藏，則加入收藏
 *
 * 使用場景：
 * - 商品列表頁面的愛心按鈕
 * - 商品詳情頁面的愛心按鈕
 * - 會員中心的收藏管理
 *
 * @param {number} productId - 商品ID
 * @returns {Promise<Object>} 包含新收藏狀態的回應物件
 *   - favorited: boolean - 操作後的收藏狀態
 *   - message: string - 操作結果訊息
 */
export const toggleFavorite = async (productId) => {
  const res = await apiClient.post(`/shop/favorite/${productId}/toggle`)
  return res.data
}

/**
 * 取得當前會員的所有收藏商品 - 用於會員中心的「我的收藏」頁面
 * 僅包含必要的商品資訊，不包含完整的商品詳細資訊
 *
 * @returns {Promise<Array>} 收藏商品列表，每個項目包含：
 *   - id: 商品ID
 *   - name: 商品名稱
 *   - price: 商品價格
 *   - image_url: 商品圖片URL
 */
export const memberFavorite = async () => {
  const res = await apiClient.get(`/shop/favorite/member`)
  return res.data
}
