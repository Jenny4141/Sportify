import { adminApiClient } from '@/api/axios'

export const fetchCenters = async (params = {}) => {
  const query = new URLSearchParams(params).toString()
  const res = await adminApiClient.get(`/venue/center?${query}`)
  return res.data
}

export const fetchCenter = async (id) => {
  const res = await adminApiClient.get(`/venue/center/${id}`)
  return res.data
}

export const createCenter = async (data) => {
  const formData = new FormData()

  // 添加基本欄位
  if (data.name) formData.append('name', data.name)
  if (data.locationId) formData.append('locationId', data.locationId)
  if (data.address) formData.append('address', data.address)
  if (data.latitude) formData.append('latitude', data.latitude)
  if (data.longitude) formData.append('longitude', data.longitude)

  // 添加運動項目ID
  if (data.sportIds && Array.isArray(data.sportIds)) {
    formData.append('sportIds', JSON.stringify(data.sportIds))
  }

  // 添加圖片檔案
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((image) => {
      formData.append('images', image)
    })
  }

  const res = await adminApiClient.post('/venue/center', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

export const deleteCenter = async (deletedId) => {
  const res = await adminApiClient.delete(`/venue/center/${deletedId}`)
  return res.data
}

export const updateCenter = async (id, data) => {
  const formData = new FormData()

  // 添加基本欄位
  if (data.name) formData.append('name', data.name)
  if (data.locationId) formData.append('locationId', data.locationId)
  if (data.address) formData.append('address', data.address)
  if (data.latitude) formData.append('latitude', data.latitude)
  if (data.longitude) formData.append('longitude', data.longitude)

  // 添加運動項目ID
  if (data.sportIds && Array.isArray(data.sportIds)) {
    formData.append('sportIds', JSON.stringify(data.sportIds))
  }

  // 添加是否保留現有圖片的標記
  if (data.keepExistingImages !== undefined) {
    formData.append('keepExistingImages', data.keepExistingImages.toString())
  }

  // 添加新圖片檔案
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((image) => {
      formData.append('images', image)
    })
  }

  const res = await adminApiClient.put(`/venue/center/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

export const deleteMultipleCenters = async (checkedItems) => {
  const res = await adminApiClient.delete('/venue/center/multi', {
    data: { checkedItems },
  })
  return res.data
}
