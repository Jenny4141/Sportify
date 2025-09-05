import { apiClient } from '@/api/axios'

// 取得 Reservation 列表資料
export const fetchReservations = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await apiClient.get(`/venue/reservation?${query}`)
  return res.data
}

// 取得單筆 Reservation 資料
export const fetchReservation = async (id) => {
  const res = await apiClient.get(`/venue/reservation/${id}`)
  return res.data
}

// 新增 Reservation
export const createReservation = async (data) => {
  const res = await apiClient.post('/venue/reservation', data)
  return res.data
}

// 編輯 Reservation
export const updateReservation = async (id, data) => {
  const res = await apiClient.put(`/venue/reservation/${id}`, data)
  return res.data
}

// 刪除單筆 Reservation
export const deleteReservation = async (id) => {
  const res = await apiClient.delete(`/venue/reservation/${id}`)
  return res.data
}

// 多選刪除 Reservation
export const deleteMultipleReservations = async (checkedItems) => {
  const res = await apiClient.delete('/venue/reservation/multi', {
    data: { checkedItems },
  })
  return res.data
}

// 取得某會員所有 Reservation 資料
export const getUserReservations = async (params = {}) => {
  const res = await apiClient.get('/venue/reservation/member', { params })
  return res.data
}
