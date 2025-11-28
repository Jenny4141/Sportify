'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import BreadcrumbAuto from '@/components/breadcrumb-auto'
import Footer from '@/components/footer'

// ===================================================================
// 統一載入狀態組件 - 全站一致的加載體驗
// ===================================================================
/**
 * LoadingState - 統一的全頁面載入狀態組件
 *
 * 功能特色：
 * • 全頁面佈局：包含導航列、面包屑、頁尾
 * • 置中載入動畫：品牌一致的視覺設計
 * • 可自定義訊息：支援不同情景的加載提示
 * • 响應式設計：適配所有裝置尺寸
 * • 無障礙支援：支援螢幕閱讀器
 *
 * 使用場景：
 * • API 資料獲取中
 * • 頁面初始化中
 * • 表單提交處理中
 * • 路由跳轉中
 *
 * @param {Object} props 組件屬性
 * @param {string} props.message 載入提示訊息，預設為 '載入中...'
 */
export function LoadingState({ message = '載入中...' }) {
  return (
    <>
      {/* === 全頁面結構：保持與正常頁面一致的佈局 === */}
      <Navbar /> {/* 頂部導航列：維持導航一致性 */}
      <BreadcrumbAuto /> {/* 面包屑導航：顯示當前位置 */}
      {/* === 主內容區域：全高度佈局 === */}
      <div className="flex min-h-screen flex-col">
        {/* 全螢幕高度的 Flexbox 容器 */}
        <main className="flex-1 py-10">
          {/* 主內容區，自動擴展高度 */}
          <div className="container mx-auto px-4 md:px-6">
            {/* 响應式容器和外邊距 */}
            {/* === 載入動畫和訊息置中區域 === */}
            <div className="flex items-center justify-center min-h-[400px]">
              {/* 垂直水平置中 */}
              <div className="text-center max-w-md w-full">
                {/* 中心對齊的內容區 */}
                {/* 自定義載入動畫：使用 CSS 類名 loader */}
                <div className="loader mx-auto mb-4"></div>
                {/* 載入訊息：可自定義的提示文字 */}
                <p className="text-muted mb-4">{message}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer /> {/* 頁尾：維持頁面結構完整性 */}
    </>
  )
}

// ===================================================================
// 統一錯誤狀態組件 - 全站一致的錯誤處理
// ===================================================================
/**
 * ErrorState - 統一的全頁面錯誤狀態組件
 *
 * 功能特色：
 * • 全頁面錯誤顯示：保持頁面結構完整性
 * • 可自定義錯誤訊息：支援不同錯誤情景
 * • 操作按鈕：重試和返回功能
 * • 响應式設計：適配所有裝置尺寸
 * • 用戶友好：明確的錯誤說明和解決建議
 * • 無障礙支援：支援鍵盤導航和螢幕閱讀器
 *
 * 使用場景：
 * • API 調用失敗
 * • 網絡連線錯誤
 * • 權限不足錯誤
 * • 資料不存在 (404)
 * • 伺服器內部錯誤 (500)
 *
 * @param {Object} props 組件屬性
 * @param {string} props.title 錯誤標題，預設為 '載入失敗'
 * @param {string} props.message 錯誤詳細訊息
 * @param {Function} props.onRetry 重試回調函數 (可選)
 * @param {boolean} props.showBackButton 是否顯示返回按鈕
 * @param {string} props.backUrl 返回連結 URL (可選)
 * @param {string} props.backLabel 返回按鈕文字
 */
export function ErrorState({
  title = '載入失敗', // 錯誤標題，可自定義
  message = '發生未知錯誤', // 錯誤詳情，可自定義
  onRetry = null, // 重試函數，可選
  showBackButton = true, // 是否顯示返回按鈕
  backUrl = null, // 返回連結，可選
  backLabel = '返回', // 返回按鈕文字
}) {
  return (
    <>
      {/* === 全頁面結構：與正常頁面保持一致 === */}
      <Navbar /> {/* 頂部導航列 */}
      <BreadcrumbAuto /> {/* 面包屑導航 */}
      {/* === 主內容區域：全高度佈局 === */}
      <div className="flex min-h-screen flex-col">
        {/* 全螢幕高度容器 */}
        <main className="flex-1 py-10">
          {/* 主內容區，自動擴展 */}
          <div className="container mx-auto px-4 md:px-6">
            {/* 响應式容器 */}
            {/* === 錯誤訊息和操作按鈕置中區域 === */}
            <div className="flex items-center justify-center min-h-[400px]">
              {/* 置中對齊 */}
              <div className="text-center max-w-md">
                {/* 中心對齊的內容 */}
                {/* 錯誤圖示：使用警告圓圈圖示 */}
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                {/* 錯誤標題：主要錯誤說明 */}
                <h1 className="text-2xl font-bold mb-2">{title}</h1>
                {/* 錯誤詳情：更詳細的錯誤說明 */}
                <p className="text-muted mb-6">{message}</p>
                {/* === 操作按鈕區域：重試和返回 === */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* RWD: 手機垂直，桌面水平 */}
                  {/* 條件式渲染：只有當 onRetry 存在時才顯示重試按鈕 */}
                  {onRetry && (
                    <Button onClick={onRetry} variant="default">
                      {/* 主要按鈕風格 */}
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {/* 重新載入圖示 */}
                      重新載入
                    </Button>
                  )}
                  {/* 條件式渲染：根據設定顯示返回按鈕 */}
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
