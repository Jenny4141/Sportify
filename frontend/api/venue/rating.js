import { apiClient } from '@/api/axios'

// 取得運動中心的所有評分
export const getCenterRatings = async (centerId, params = {}) => {
  const { page = 1, perPage = 5 } = params
  const res = await apiClient.get(`/venue/rating/centers/${centerId}/ratings`, {
    params: { page, perPage },
  })
  return res.data
}

// 新增/更新評分 (需要登入)
export const addRating = async (centerId, data) => {
  const res = await apiClient.post(`/venue/rating/${centerId}`, data)
  return res.data
}

// 取得會員對特定運動中心的評分 (需要登入)
export const getMemberRating = async (centerId) => {
  const res = await apiClient.get(`/venue/rating/centers/${centerId}/my-rating`)
  return res.data
}

// 刪除評分 (需要登入)
export const deleteRating = async (centerId) => {
  const res = await apiClient.delete(`/venue/rating/centers/${centerId}/rating`)
  return res.data
}

// 取得運動中心評分統計
export const getRatingStats = async (centerId) => {
  const res = await apiClient.get(`/venue/rating/centers/${centerId}/stats`)
  return res.data
}
