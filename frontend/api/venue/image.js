/**
 * 取得商品圖片的完整 URL
 * @param {string} imageName - 圖片檔案名稱 (例如: "center01.jpg")
 * @returns {string} 完整的圖片 URL
 */
import { SERVER } from '@/lib/api-path'
export const getCenterImageUrl = (imageName) => {
  if (!imageName) return `/product-pic/product-img.jpg` // 預設圖片
  // 直接從後端靜態檔案目錄取得圖片（public 資料夾已經被 express.static 設為根目錄）
  return `${SERVER}/center-imgs/${imageName}`
}

/**
 * 取得多張商品圖片的 URL 陣列
 * @param {Array} images - 圖片物件陣列，每個物件包含 url 屬性
 * @returns {Array} 圖片 URL 陣列
 */
export const getCenterImageUrls = (images) => {
  if (!images || !Array.isArray(images)) return []

  return images
    .sort((a, b) => a.order - b.order) // 按照 order 排序
    .map((img) => getCenterImageUrl(img.url))
}
