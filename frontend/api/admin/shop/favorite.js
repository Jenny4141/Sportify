import { adminApiClient } from '@/api/axios'

export const toggleLike = async (productId) => {
  const res = await adminApiClient.post(`/shop/favorite/${productId}/toggle`)
  return res.data
}