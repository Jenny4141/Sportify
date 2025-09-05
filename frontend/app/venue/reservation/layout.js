'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

function AuthGuard({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // 未登入，重導向到登入頁
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router])

  if (isLoading) return null // 或 return <LoadingSpinner />
  if (!isAuthenticated) return null

  return children
}

export default function ReservationLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>
}
