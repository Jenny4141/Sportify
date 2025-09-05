'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function MemberLayout({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    // 等待認證檢查完成
    if (!isLoading) {
      setHasCheckedAuth(true)

      // 如果沒有用戶資料，重導向到首頁
      if (!user) {
        router.replace('/')
      }
    }
  }, [user, isLoading, router])

  // 如果正在載入認證狀態，顯示載入中
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  // 如果沒有用戶資料，不顯示內容（會自動重導向）
  if (!user) {
    return null
  }

  // 如果已登入且有用戶資料，顯示子組件
  return <>{children}</>
}
