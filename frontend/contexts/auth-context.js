'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { API_SERVER } from '@/lib/api-path'
import { toast } from 'sonner'

const AuthContext = createContext()

AuthContext.displayName = 'sportifyAuthContext'
const storageKey = 'sportify-auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)

  const login = async ({ email, password }) => {
    try {
      const res = await fetch(`${API_SERVER}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        localStorage.setItem(storageKey, result.token)

        // 登入成功後，立即獲取完整的用戶資料
        try {
          const verifyRes = await fetch(`${API_SERVER}/auth/verify`, {
            headers: {
              Authorization: `Bearer ${result.token}`,
            },
          })

          const verifyResult = await verifyRes.json()

          if (verifyRes.ok && verifyResult.success) {
            setUser(verifyResult.user)
            toast.success('登入成功！歡迎回來！', {
              className: 'bg-green-500 text-white border-green-600 shadow-lg',
              style: {
                backgroundColor: '#ff671e',
                color: '#fff',
                border: 'none',
                width: '250px',
              },
            })
            return { success: true, user: verifyResult.user }
          } else {
            setUser(result.user)
            toast.success('登入成功！歡迎回來！', {
              className: 'bg-green-500 text-white border-green-600 shadow-lg',
              style: {
                backgroundColor: '#ff671e',
                color: '#fff',
                border: 'none',
                width: '250px',
              },
            })
            return { success: true, user: result.user }
          }
        } catch (verifyError) {
          console.error('獲取完整用戶資料時發生錯誤:', verifyError)
          setUser(result.user)
          toast.success('登入成功！歡迎回來！', {
            className: 'bg-green-500 text-white border-green-600 shadow-lg',
            style: {
              backgroundColor: '#ff671e',
              color: '#fff',
              border: 'none',
              width: '250px',
            },
          })
          return { success: true, user: result.user }
        }
      } else {
        return {
          success: false,
          issues: result.issues || [],
          message: result.message || '登入失敗',
        }
      }
    } catch (error) {
      console.error('登入發生錯誤:', error)
      return {
        success: false,
        issues: [],
        message: '網路錯誤，請稍後再試',
      }
    }
  }

  const register = async ({
    email,
    password,
    name,
    phone,
    confirmPassword,
  }) => {
    try {
      const res = await fetch(`${API_SERVER}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phone, confirmPassword }),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        localStorage.setItem(storageKey, result.token)

        // 註冊成功後，立即獲取完整的用戶資料
        try {
          const verifyRes = await fetch(`${API_SERVER}/auth/verify`, {
            headers: {
              Authorization: `Bearer ${result.token}`,
            },
          })
          const verifyResult = await verifyRes.json()
          if (verifyRes.ok && verifyResult.success) {
            setUser(verifyResult.user)
            toast.success('註冊成功！歡迎加入我們！', {
              className: 'bg-blue-500 text-white border-blue-600 shadow-lg',
              style: {
                backgroundColor: '#ff671e',
                color: '#fff',
                border: 'none',
                width: '250px',
              },
            })
            return { success: true, user: verifyResult.user }
          } else {
            setUser(result.user)
            toast.success('註冊成功！歡迎加入我們！', {
              className: 'bg-blue-500 text-white border-blue-600 shadow-lg',
              style: {
                backgroundColor: '#ff671e',
                color: '#fff',
                border: 'none',
                width: '250px',
              },
            })
            return { success: true, user: result.user }
          }
        } catch (verifyError) {
          console.error('獲取完整用戶資料時發生錯誤:', verifyError)
          setUser(result.user)
          toast.success('註冊成功！歡迎加入我們！', {
            className: 'bg-blue-500 text-white border-blue-600 shadow-lg',
            style: {
              backgroundColor: '#ff671e',
              color: '#fff',
              border: 'none',
              width: '250px',
            },
          })
          return { success: true, user: result.user }
        }
      } else {
        return {
          success: false,
          issues: result.issues || [],
          message: result.message || '註冊失敗',
        }
      }
    } catch (error) {
      console.error('註冊發生錯誤:', error)
      return {
        success: false,
        issues: [],
        message: '網路錯誤，請稍後再試',
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(storageKey)
  }

  const checkAuth = async () => {
    if (hasInitialized) {
      return
    }

    setIsLoading(true)
    const token = localStorage.getItem(storageKey)
    if (!token) {
      setUser(null)
      setIsLoading(false)
      setHasInitialized(true)
      return
    }
    try {
      const res = await fetch(`${API_SERVER}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await res.json()
      if (res.ok && result.success) {
        setUser(result.user)
      } else {
        setUser(null)
        localStorage.removeItem(storageKey)
      }
    } catch (error) {
      setUser(null)
      localStorage.removeItem(storageKey)
    }
    setIsLoading(false)
    setHasInitialized(true)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const updateUserProfile = async (userData) => {
    try {
      const token = localStorage.getItem(storageKey)
      if (!token) {
        return { success: false, message: '未登入' }
      }

      const res = await fetch(`${API_SERVER}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        // 後端現在會回傳更新後的用戶資料
        if (result.user) {
          setUser(result.user)
          return { success: true, user: result.user }
        } else {
          // 如果後端沒有回傳用戶資料，手動更新本地狀態
          const updatedUser = {
            ...user,
            ...userData,
          }
          setUser(updatedUser)
          return { success: true, user: updatedUser }
        }
      } else {
        return {
          success: false,
          issues: result.issues || [],
          message: result.message || '更新失敗',
        }
      }
    } catch (error) {
      console.error('更新用戶資料發生錯誤:', error)
      return {
        success: false,
        issues: [],
        message: '網路錯誤，請稍後再試',
      }
    }
  }

  const uploadAvatar = async (file) => {
    try {
      const token = localStorage.getItem(storageKey)
      if (!token) {
        return { success: false, message: '未登入' }
      }

      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch(`${API_SERVER}/auth/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await res.json()

      if (res.ok && result.success) {
        // 如果後端沒有回傳 avatar 欄位，我們手動添加
        let updatedUser = result.user
        if (!updatedUser.avatar) {
          // 假設後端將圖片存儲為檔案名稱
          const fileName = file.name
          updatedUser = {
            ...result.user,
            avatar: fileName,
          }
        }

        setUser(updatedUser)
        return { success: true, user: updatedUser }
      } else {
        return {
          success: false,
          message: result.message || '上傳失敗',
        }
      }
    } catch (error) {
      console.error('上傳頭像發生錯誤:', error)
      return {
        success: false,
        message: '網路錯誤，請稍後再試',
      }
    }
  }

  // Google 登入函數
  const googleLogin = async (idToken) => {
    try {
      const res = await fetch(`${API_SERVER}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        localStorage.setItem(storageKey, result.token)
        setUser(result.user)
        return { success: true, user: result.user }
      } else {
        return {
          success: false,
          message: result.message || 'Google 登入失敗',
        }
      }
    } catch (error) {
      console.error('Google 登入發生錯誤:', error)
      return {
        success: false,
        message: '網路錯誤，請稍後再試',
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateUserProfile,
        uploadAvatar,
        googleLogin,
        setUser,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 自訂 hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 中使用')
  }
  return context
}
