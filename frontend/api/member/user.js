import { apiClient } from '@/api/axios'
import { SERVER } from '@/lib/api-path'

// 獲取用戶資料
export const getUserProfile = async () => {
  const res = await apiClient.get('/auth/profile')
  return res.data
}

// 更新用戶資料
export const updateUserProfile = async (userData) => {
  const res = await apiClient.put('/auth/profile', userData)
  return res.data
}

// 上傳用戶頭像
export const uploadUserAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await apiClient.post('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

/**
 * 取得用戶頭像的完整 URL
 * @param {string} avatarName - 頭像檔案名稱或路徑 (例如: "avatar-102-1755764880653-66934344.jpg" 或 "/api/auth/avatar/avatar-102-1755764880653-66934344.jpg")
 * @returns {string} 完整的頭像 URL
 */
export const getAvatarUrl = (avatarName) => {
  if (!avatarName) return '${SERVER}/avatars/default.png' // 預設頭像

  // 如果已經是完整 URL，直接使用
  if (avatarName.startsWith('http')) {
    return avatarName
  }

  // 如果是完整路徑（如 /api/auth/avatar/filename.jpg），提取檔案名稱
  let fileName = avatarName
  if (avatarName.includes('/')) {
    fileName = avatarName.split('/').pop() // 取得最後一部分作為檔案名稱
  }

  // 直接從後端靜態檔案目錄取得頭像（avatars 資料夾）
  return `${SERVER}/avatars/${fileName}`
}
