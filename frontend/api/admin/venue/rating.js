import { adminApiClient } from '@/api/axios'

// *** 管理員新增/更新評分
export const addRating = async (centerId, memberId, data) => {
  const res = await adminApiClient.post(
    `/venue/rating/centers/${centerId}/members/${memberId}`,
    data
  )
  return res.data
}

// *** 取得運動中心的所有評分
export const getCenterRatings = async (centerId, params = {}) => {
  const { page = 1, perPage = 5 } = params
  const res = await adminApiClient.get(
    `/venue/rating/centers/${centerId}/ratings`,
    {
      params: { page, perPage },
    }
  )
  return res.data
}

// *** 管理員取得特定會員對運動中心的評分
export const getMemberRating = async (centerId, memberId) => {
  const res = await adminApiClient.get(
    `/venue/rating/centers/${centerId}/members/${memberId}`
  )
  return res.data
}

// *** 管理員刪除評分
export const deleteRating = async (centerId, memberId) => {
  const res = await adminApiClient.delete(
    `/venue/rating/centers/${centerId}/members/${memberId}`
  )
  return res.data
}

// *** 取得運動中心評分統計
export const getRatingStats = async (centerId) => {
  const res = await adminApiClient.get(
    `/venue/rating/centers/${centerId}/stats`
  )
  return res.data
}
