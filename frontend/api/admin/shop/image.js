import { API_SERVER_ADMIN } from '@/lib/api-path'

export const getProductImageUrl = (imageName) => {
  if (!imageName) return '/product-pic/product-img.jpg' // 預設圖片
  // 經由後端 API 端點取得圖片
  return `${API_SERVER_ADMIN}/shop/product/image/${imageName}`
}

export const getProductImageUrls = (images) => {
  if (!images || !Array.isArray(images)) return []

  return images
    .sort((a, b) => a.order - b.order) // 按照 order 排序
    .map((img) => getProductImageUrl(img.url))
}
