import { apiClient } from '@/api/axios'

export const fetchLessons = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await apiClient.get(`/course/lesson?${query}`)
  return res.data
}

export const fetchLesson = async (id) => {
  const res = await apiClient.get(`/course/lesson/${id}`)
  return res.data
}
