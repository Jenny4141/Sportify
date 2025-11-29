import { apiClient } from '@/api/axios'

// 切換商品收藏狀態
export const toggleFavorite = async (productId) => {
  const res = await apiClient.post(`/shop/favorite/${productId}/toggle`)
  return res.data
}

// 取得用戶所有的收藏
export const memberFavorite = async () => {
  const res = await apiClient.get(`/shop/favorite/member`)
  return res.data
}
