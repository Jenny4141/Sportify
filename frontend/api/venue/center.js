import { apiClient } from '@/api/axios'

export const fetchCenters = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await apiClient.get(`/venue/center?${query}`)
  return res.data
}

export const fetchCenter = async (id) => {
  const res = await apiClient.get(`/venue/center/${id}`)
  return res.data
}

export const createCenter = async (data) => {
  const res = await apiClient.post('/venue/center', data)
  return res.data
}

export const deleteCenter = async (deletedId) => {
  const res = await apiClient.delete(`/venue/center/${deletedId}`)
  return res.data
}

export const updateCenter = async (id, data) => {
  const res = await apiClient.put(`/venue/center/${id}`, data)
  return res.data
}

export const deleteMultipleCenters = async (checkedItems) => {
  const res = await apiClient.delete('/venue/center/multi', {
    data: { checkedItems },
  })
  return res.data
}
