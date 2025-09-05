import { auth, googleProvider } from '@/app/firebase'
import { Button } from '@/components/ui/button'
import { signInWithPopup } from 'firebase/auth'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { GoogleIcon } from '@/components/icons/member-icons'
import { toast } from 'sonner'

export default function GoogleLoginButton() {
  const { googleLogin, user, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleGoogleLogin = async (e) => {
    // 阻止事件冒泡，避免觸發表單提交
    e.preventDefault()
    e.stopPropagation()

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      const idToken = await user.getIdToken()

      const response = await googleLogin(idToken)

      if (response.success) {
        toast.success('Google 登入成功！歡迎回來！')
        setTimeout(() => {
          router.push('/member')
        }, 100)
      } else {
        toast.error(`登入失敗: ${response.message || '未知錯誤'}`)
      }
    } catch (error) {
      // 處理用戶主動關閉彈窗的情況 - 靜默處理，不顯示錯誤
      if (error.code === 'auth/popup-closed-by-user') {
        return
      }

      // 處理彈窗被阻擋的情況
      if (error.code === 'auth/popup-blocked') {
        toast.error('登入視窗被瀏覽器阻擋，請允許彈出視窗後重試')
        return
      }

      // 處理彈窗請求被取消的情況
      if (error.code === 'auth/cancelled-popup-request') {
        return
      }

      // 處理網路錯誤
      if (error.code === 'auth/network-request-failed') {
        toast.error('網路連線失敗，請檢查網路連線後重試')
        return
      }

      // 處理配置錯誤
      if (error.code === 'auth/configuration-not-found') {
        toast.error('系統配置錯誤，請稍後再試')
        return
      }

      // 處理未授權網域
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('此網域未授權，請聯繫管理員')
        return
      }

      // 處理其他 Firebase 錯誤
      if (error.code && error.code.startsWith('auth/')) {
        toast.error('登入失敗，請稍後再試')
        return
      }

      // 處理後端 API 錯誤
      if (error.response) {
        const errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          '後端服務錯誤'
        toast.error(`登入失敗: ${errorMessage}`)
        return
      }

      // 處理其他未知錯誤
      toast.error('登入失敗，請稍後再試')
    }
  }

  // 監聽認證狀態變化
  useEffect(() => {
    // 移除認證狀態變化的日誌
  }, [user, isAuthenticated])

  return (
    <Button
      variant="ghost"
      type="button"
      onClick={handleGoogleLogin}
      className="transition-colors w-full shadow-sm border border-muted"
    >
      <div className="flex items-center justify-center">
        <div className="py-0.25 w-4 h-4 items-center justify-center">
          <GoogleIcon className="w-6 h-6" />
        </div>
        <div className="ml-2 text-center">使用 Google 登入</div>
      </div>
    </Button>
  )
}
