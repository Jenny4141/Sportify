// ===================================================================
// 商品圖片處理模組 - 統一的圖片 URL 管理
// ===================================================================
/**
 * 此模組提供商品圖片的統一處理功能，包括：
 * • 單張圖片 URL 產生
 * • 多張圖片批量處理
 * • 預設圖片回退機制
 * • 圖片順序排列支援
 * • 統一的錯誤處理
 */

import { API_SERVER_ADMIN } from '@/lib/api-path' // 管理後台 API 伺服器位址

// ===================================================================
// 單張圖片 URL 產生函數
// ===================================================================
/**
 * getProductImageUrl - 產生單一商品圖片的完整 URL
 *
 * 功能特色：
 * • 自動回退：當圖片名稱不存在時返回預設圖片
 * • API 路徑統一：經由後端 API 端點獲取圖片
 * • 安全性：後端控制圖片訪問權限和驗證
 * • 緩存優化：支援 HTTP 緩存機制
 *
 * 設計理念：
 * • 失敗安全：無效輸入時不會導致破損的圖片鏈接
 * • 用戶體驗：始終顯示有效圖片，避免空白或破損圖示
 * • 一致性：全站使用相同的圖片 URL 產生邏輯
 *
 * @param {string|null|undefined} imageName 圖片檔案名稱，可以是 null 或 undefined
 * @returns {string} 完整的圖片 URL，絕不為空
 *
 * @example
 * // 正常情況：返回 API 端點 URL
 * getProductImageUrl('product-123.jpg')
 * // -> 'http://localhost:3001/admin/shop/product/image/product-123.jpg'
 *
 * @example
 * // 異常情況：返回預設圖片
 * getProductImageUrl(null)
 * // -> '/product-pic/product-img.jpg'
 * getProductImageUrl('')
 * // -> '/product-pic/product-img.jpg'
 */
export const getProductImageUrl = (imageName) => {
  // === 預設圖片回退機制 ===
  // 當 imageName 為 falsy 值時 (null, undefined, '', 0, false)
  // 返回預先放置在 public 目錄下的預設商品圖片
  if (!imageName) return '/product-pic/product-img.jpg'

  // === 完整 API URL 產生 ===
  // 結合 API 伺服器位址和圖片端點路徑
  // 這樣設計的好處：
  // 1. 集中管理：所有圖片都經由後端 API 提供
  // 2. 權限控制：後端可以驗證用戶權限和檔案存在性
  // 3. 緩存支援：後端可以設定適當的 HTTP 緩存標頭
  // 4. 統一路徑：所有圖片都使用相同的 URL 結構
  return `${API_SERVER_ADMIN}/shop/product/image/${imageName}`
}

// ===================================================================
// 多張圖片批量處理函數
// ===================================================================
/**
 * getProductImageUrls - 批量處理商品圖片陣列並產生 URL 清單
 *
 * 功能特色：
 * • 批量處理：一次處理多張圖片的 URL 產生
 * • 智能排序：按照資料庫中的 order 欄位進行排序
 * • 安全檢查：防止無效輸入導致的錯誤
 * • 型別安全：嚴格檢查輸入是否為陣列類型
 * • 效能優化：使用函數式程式設計提高效能
 *
 * 設計理念：
 * • 失敗安全：無效輸入時返回空陣列，不會導致應用崩潰
 * • 数據一致性：保持與資料庫中定義的圖片順序一致
 * • 可組合性：返回的 URL 陣列可以直接用於 React 組件渲染
 *
 * @param {Array<Object>|null|undefined} images 圖片資訊陣列，每個物件包含 url 和 order 屬性
 * @returns {Array<string>} 排序後的圖片 URL 陣列
 *
 * @example
 * // 正常情況：返回排序後的 URL 陣列
 * const images = [
 *   { url: 'product-2.jpg', order: 2 },
 *   { url: 'product-1.jpg', order: 1 },
 *   { url: 'product-3.jpg', order: 3 }
 * ]
 * getProductImageUrls(images)
 * // -> [
 * //   'http://localhost:3001/admin/shop/product/image/product-1.jpg',
 * //   'http://localhost:3001/admin/shop/product/image/product-2.jpg',
 * //   'http://localhost:3001/admin/shop/product/image/product-3.jpg'
 * // ]
 *
 * @example
 * // 異常情況：返回空陣列
 * getProductImageUrls(null)      // -> []
 * getProductImageUrls(undefined) // -> []
 * getProductImageUrls('string')  // -> []
 */
export const getProductImageUrls = (images) => {
  // === 輸入驗證和安全檢查 ===
  // 檢查輸入是否為有效的陣列
  // 這裡使用兩個條件：
  // 1. !images: 檢查是否為 falsy 值 (null, undefined, false, 0, '')
  // 2. !Array.isArray(images): 嚴格檢查是否為陣列類型
  if (!images || !Array.isArray(images)) return []

  // === 圖片處理管道 (Image Processing Pipeline) ===
  return (
    images
      // 步驟 1：排序處理
      // 按照資料庫中的 order 欄位進行遞增排序
      // 這確保圖片在前端顯示的順序與後台設定一致
      .sort((a, b) => a.order - b.order)

      // 步驟 2：URL 產生轉換
      // 使用 map 函數將每個圖片物件轉換為完整的 URL
      // 重用 getProductImageUrl 函數確保 URL 產生邏輯的一致性
      .map((img) => getProductImageUrl(img.url))
  )
}
