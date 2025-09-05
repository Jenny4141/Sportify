import { apiClient } from '@/api/axios'

// 收藏/取消收藏商品
export const toggleFavorite = async (productId) => {
  const res = await apiClient.post(`/shop/favorite/${productId}/toggle`)
  return res.data
}
// 取得會員收藏列表
export const memberFavorite = async () => {
  const res = await apiClient.get(`/shop/favorite/member`)
  return res.data
}
