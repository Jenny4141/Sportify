import { apiClient } from '@/api/axios'

/**
 * 商品 API 呼叫函數集合
 * 這個檔案封裝所有與商品相關的 API 請求，提供給 React 組件使用
 * 使用 apiClient (基於 axios) 來處理 HTTP 請求和回應
 */

/**
 * 取得分頁商品列表 - 主要用於商品列表頁面
 * 支援多種篩選和排序功能
 *
 * @param {Object} params - 查詢參數物件
 * @param {string} params.keyword - 搜尋關鍵字
 * @param {number} params.page - 頁碼 (預設 1)
 * @param {string} params.sportId - 運動類型ID (逗號分隔多選)
 * @param {string} params.brandId - 品牌ID (逗號分隔多選)
 * @param {string} params.sort - 排序方式 ('price-asc' | 'price-desc')
 * @param {number} params.minPrice - 最低價格
 * @param {number} params.maxPrice - 最高價格
 * @returns {Promise<Object>} 包含商品列表和分頁資訊的回應
 */
export const getProducts = async (params = {}) => {
  // 將參數物件轉換為 URL 查詢字串
  const query = new URLSearchParams(params).toString()
  const res = await apiClient.get(`/shop/product?${query}`)
  return res.data
}

/**
 * 取得單一商品的詳細資訊 - 用於商品詳情頁
 * 包含商品圖片、規格、收藏狀態等完整資訊
 *
 * @param {string|number} id - 商品ID
 * @returns {Promise<Object>} 商品詳細資訊
 */
export const getProductDetail = async (id) => {
  const res = await apiClient.get(`/shop/product/${id}`)
  return res.data
}

/**
 * 取得所有商品列表 (不分頁) - 用於管理後台或下拉選單
 * 只包含基本資訊，不包含圖片和詳細描述
 *
 * @returns {Promise<Array>} 商品列表陣列
 */
export const getProductsList = async () => {
  const res = await apiClient.get('/shop/product/list')
  return res.data
}

/**
 * 取得所有品牌選項 - 用於篩選功能
 *
 * @returns {Promise<Array>} 品牌選項列表 [{id, name}, ...]
 */
export const getBrands = async () => {
  const res = await apiClient.get('/shop/product/brands')
  return res.data
}

/**
 * 取得所有運動類型選項 - 用於篩選功能
 *
 * @returns {Promise<Array>} 運動類型選項列表 [{id, name}, ...]
 */
export const getSports = async () => {
  const res = await apiClient.get('/shop/product/sports')
  return res.data
}
