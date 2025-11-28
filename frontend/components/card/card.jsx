// ===================================================================
// 基礎卡片組件系統 - 全站通用的卡片 UI 組件
// ===================================================================
import * as React from 'react'

import { cn } from '@/lib/utils' // 工具函數：用於合併 CSS 類名

/**
 * Card - 基礎卡片容器組件
 *
 * 功能特色：
 * • 响應式設計：適配所有裝置尺寸
 * • 可定制樣式：支援 className 覆盖預設樣式
 * • 無障礙支援：遵循 Web 標準和最佳實踐
 * • 主題系統整合：使用 CSS 變數支援深淺色主題
 * • 組件系統：支援多個子組件的嵌套使用
 *
 * 使用場景：
 * • 商品卡片展示
 * • 資訊結構化呈現
 * • 表單分組和容器
 * • 面板和儀表板
 *
 * @param {Object} props 組件屬性
 * @param {string} props.className 額外的 CSS 類名，用於覆盖預設樣式
 * @param {React.ReactNode} props.children 子組件內容
 */
function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        `
          flex flex-col gap-6 rounded-xl border bg-card py-6
          text-card-foreground shadow-sm
        `,
        // 預設樣式解釋：
        // - flex flex-col: 垂直方向的 Flexbox 佈局
        // - gap-6: 子元素間 24px 間距
        // - rounded-xl: 大圓角邊框 (12px)
        // - border: 淡色邊框
        // - bg-card: 主題系統的卡片背景色
        // - py-6: 上下 24px 內邊距
        // - text-card-foreground: 主題系統的卡片文字色
        // - shadow-sm: 輕微陰影效果
        className // 用戶自定義的額外樣式
      )}
      data-slot="card" // 組件標識符，用於 CSS 選擇器和測試
      {...props} // 传遞所有其他 HTML 屬性
    />
  )
}

/**
 * CardAction - 卡片操作按鈕區域組件
 *
 * 功能特色：
 * • 定位在卡片右上角：適合放置操作按鈕
 * • Grid 佈局系統：精確控制位置和尺寸
 * • 非侵入性設計：不影響卡片主要內容的佈局
 *
 * 使用場景：愛心、更多選項、關閉按鈕等
 *
 * @param {Object} props 組件屬性
 * @param {string} props.className 額外 CSS 類名
 */
function CardAction({ className, ...props }) {
  return (
    <div
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        // Grid 佈局解釋：
        // - col-start-2: 從第 2 列開始
        // - row-span-2: 橫跨 2 列
        // - row-start-1: 從第 1 列開始
        // - self-start: 垂直對齊到頂部
        // - justify-self-end: 水平對齊到右側
        className
      )}
      data-slot="card-action" // 組件標識符
      {...props}
    />
  )
}

/**
 * CardContent - 卡片主要內容區域組件
 *
 * 功能特色：
 * • 標準內邊距：提供一致的內容邊距
 * • 彈性設計：可容納任意內容類型
 * • 要素化設計：保持組件的簡潔性
 *
 * 使用場景：包裝卡片的主要內容，如文字、圖片、表單等
 *
 * @param {Object} props 組件屬性
 * @param {string} props.className 額外 CSS 類名
 * @param {React.ReactNode} props.children 卡片內容
 */
function CardContent({ className, ...props }) {
  return (
    <div
      className={cn(
        'px-6', // 水平內邊距 24px，與卡片的 py-6 相配套
        className // 用戶自定義樣式
      )}
      data-slot="card-content" // 組件標識符
      {...props} // HTML 屬性传遞
    />
  )
}

function CardDescription({ className, ...props }) {
  return (
    <div
      className={cn('text-sm text-muted-foreground', className)}
      data-slot="card-description"
      {...props}
    />
  )
}

function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        `
          flex items-center px-6
          [.border-t]:pt-6
        `,
        className
      )}
      data-slot="card-footer"
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        `
          @container/card-header grid auto-rows-min grid-rows-[auto_auto]
          items-start gap-1.5 px-6
          has-data-[slot=card-action]:grid-cols-[1fr_auto]
          [.border-b]:pb-6
        `,
        className
      )}
      data-slot="card-header"
      {...props}
    />
  )
}

function CardTitle({ className, ...props }) {
  return (
    <div
      className={cn('leading-none font-semibold', className)}
      data-slot="card-title"
      {...props}
    />
  )
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
}
