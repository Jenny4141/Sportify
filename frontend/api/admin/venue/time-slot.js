import { adminApiClient } from '@/api/axios'

export const fetchTimeSlots = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await adminApiClient.get(`/venue/time-slot?${query}`)
  return res.data
}

export const fetchTimeSlot = async (id) => {
  const res = await adminApiClient.get(`/venue/time-slot/${id}`)
  return res.data
}

export const createTimeSlot = async (data) => {
  const res = await adminApiClient.post('/venue/time-slot', data)
  return res.data
}

export const deleteTimeSlot = async (deletedId) => {
  const res = await adminApiClient.delete(`/venue/time-slot/${deletedId}`)
  return res.data
}

export const updateTimeSlot = async (id, data) => {
  const res = await adminApiClient.put(`/venue/time-slot/${id}`, data)
  return res.data
}

export const deleteMultipleTimeSlots = async (checkedItems) => {
  const res = await adminApiClient.delete('/venue/time-slot/multi', {
    data: { checkedItems },
  })
  return res.data
}
