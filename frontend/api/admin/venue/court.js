import { adminApiClient } from '@/api/axios'

export const fetchCourts = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await adminApiClient.get(`/venue/court?${query}`)
  return res.data
}

export const fetchCourt = async (id) => {
  const res = await adminApiClient.get(`/venue/court/${id}`)
  return res.data
}

export const createCourt = async (data) => {
  const res = await adminApiClient.post('/venue/court', data)
  return res.data
}

export const updateCourt = async (id, data) => {
  const res = await adminApiClient.put(`/venue/court/${id}`, data)
  return res.data
}

export const deleteCourt = async (deletedId) => {
  const res = await adminApiClient.delete(`/venue/court/${deletedId}`)
  return res.data
}

export const deleteMultipleCourts = async (checkedItems) => {
  const res = await adminApiClient.delete('/venue/court/multi', {
    data: { checkedItems },
  })
  return res.data
}
