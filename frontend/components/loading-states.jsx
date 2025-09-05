'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Footer from '@/components/footer'

// 統一的載入組件
export function LoadingState({ message = '載入中...' }) {
  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md w-full">
                <div className="loader mx-auto mb-4"></div>
                <p className="text-muted mb-4">{message}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}

// 統一的錯誤組件
export function ErrorState({
  title = '載入失敗',
  message = '發生未知錯誤',
  onRetry = null,
  showBackButton = true,
  backUrl = null,
  backLabel = '返回',
}) {
  return (
    <>
      <Navbar />
      <BreadcrumbAuto />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 py-10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">{title}</h1>
                <p className="text-muted mb-6">{message}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {onRetry && (
                    <Button onClick={onRetry} variant="default">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新載入
                    </Button>
                  )}
                  {showBackButton && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (backUrl) {
                          window.location.href = backUrl
                        } else {
                          window.history.back()
                        }
                      }}
                    >
                      {backLabel}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}

// 統一的載入狀態文字
export function SimpleLoadingText({ message = '載入中...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="loader mx-auto mb-4"></div>
      <span className="text-muted">{message}</span>
    </div>
  )
}

// 統一的錯誤狀態文字
export function SimpleErrorText({ message = '載入錯誤', onRetry = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
      <p className="text-destructive mb-3">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          重試
        </Button>
      )}
    </div>
  )
}
