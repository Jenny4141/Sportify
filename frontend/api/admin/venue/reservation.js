import { adminApiClient } from '@/api/axios'

// 取得 Reservation 列表資料
export const fetchReservations = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await adminApiClient.get(`/venue/reservation?${query}`)
  return res.data
}

// 取得單筆 Reservation 資料
export const fetchReservation = async (id) => {
  const res = await adminApiClient.get(`/venue/reservation/${id}`)
  return res.data
}

// 新增 Reservation
export const createReservation = async (data) => {
  const res = await adminApiClient.post('/venue/reservation', data)
  return res.data
}

// 編輯 Reservation
export const updateReservation = async (id, data) => {
  const res = await adminApiClient.put(`/venue/reservation/${id}`, data)
  return res.data
}

// 刪除單筆 Reservation
export const deleteReservation = async (id) => {
  const res = await adminApiClient.delete(`/venue/reservation/${id}`)
  return res.data
}

// 多選刪除 Reservation
export const deleteMultipleReservations = async (checkedItems) => {
  const res = await adminApiClient.delete('/venue/reservation/multi', {
    data: { checkedItems },
  })
  return res.data
}
