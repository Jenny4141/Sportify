import { adminApiClient } from '@/api/axios'

export const fetchCourtTimeSlots = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await adminApiClient.get(`/venue/court-time-slot?${query}`)
  return res.data
}

export const fetchCourtTimeSlot = async (id) => {
  const res = await adminApiClient.get(`/venue/court-time-slot/${id}`)
  return res.data
}

export const createCourtTimeSlot = async (data) => {
  const res = await adminApiClient.post('/venue/court-time-slot', data)
  return res.data
}

export const updateCourtTimeSlot = async (id, data) => {
  const res = await adminApiClient.put(`/venue/court-time-slot/${id}`, data)
  return res.data
}

export const deleteCourtTimeSlot = async (deletedId) => {
  const res = await adminApiClient.delete(`/venue/court-time-slot/${deletedId}`)
  return res.data
}

export const deleteMultipleCourtTimeSlots = async (checkedItems) => {
  const res = await adminApiClient.delete('/venue/court-time-slot/multi', {
    data: { checkedItems },
  })
  return res.data
}

// 批次設定價格（依條件）
export const batchSetCourtTimeSlotPrice = async (data) => {
  const res = await adminApiClient.post(
    '/venue/court-time-slot/batch-set-price',
    data
  )
  return res.data
}
