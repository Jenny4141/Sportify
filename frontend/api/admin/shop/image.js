import { API_SERVER_ADMIN } from '@/lib/api-path'

// 單一圖片
export const getProductImageUrl = (imageName) => {
  // 當imageName為falsy值時，使用預設圖
  if (!imageName) return '/product-pic/product-img.jpg'
  return `${API_SERVER_ADMIN}/shop/product/image/${imageName}`
}

// 多張圖片
export const getProductImageUrls = (images) => {
  // 檢查輸入是否為有效的陣列
  // 1. !images: 檢查是否為 falsy 值 (null, undefined, false, 0, '')
  // 2. !Array.isArray(images): 嚴格檢查是否為陣列類型
  if (!images || !Array.isArray(images)) return []
  return (
    images
      // 排序處理
      .sort((a, b) => a.order - b.order)
      // 使用 map 函數將每個圖片物件轉換為完整的 URL
      // 重用 getProductImageUrl 函數確保 URL 產生邏輯的一致性
      .map((img) => getProductImageUrl(img.url))
  )
}
