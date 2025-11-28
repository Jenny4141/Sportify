'use client'

/**
 * 步驟指示器組件 - 用於顯示多步驟流程的進度
 *
 * 主要用途：
 * - 購物流程 (購物車 → 結帳 → 完成)
 * - 訂單流程 (選擇場館 → 選擇時間 → 確認訂單)
 * - 表單填寫流程
 *
 * 特色：
 * - 支援水平和垂直两種佈局
 * - 支援已完成/當前/未完成狀態
 * - 支援點擊事件處理
 * - 響應式設計
 * - 自動加入步驟間分隔線
 */

import * as React from 'react'
import { FaCheck } from 'react-icons/fa' // 完成狀態的勾選圖示
import { Badge } from '@/components/ui/badge' // 步驟數字徽章
import { Separator } from '@/components/ui/separator' // 步驟間分隔線
import { cn } from '@/lib/utils' // 類名合併工具

/**
 * 步驟指示器組件
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.steps - 步驟陣列，每個步驟包含 { id, title, completed, active }
 * @param {string} props.orientation - 佈局方向 'horizontal'(水平) 或 'vertical'(垂直) 預設為水平
 * @param {string} props.className - 額外的 CSS 類名
 * @param {Function} props.onStepClick - 步驟點擊事件回調函數
 */
export function Step({
  steps = [], // 步驟陣列，預設為空陣列
  orientation = 'horizontal', // 佈局方向，預設為水平
  className, // 額外的 CSS 類名
  onStepClick, // 步驟點擊事件處理函數
  ...props // 其他 HTML 屬性
}) {
  // === 佈局判斷 ===
  const isHorizontal = orientation === 'horizontal'

  return (
    // === 主容器：根據佈局方向設定不同的 flexbox 屬性 ===
    <div
      className={cn(
        'flex', // 基本 flexbox 佈局
        isHorizontal
          ? 'items-center space-x-4' // 水平佈局：置中對齊 + 水平間距
          : 'flex-col space-y-4', // 垂直佈局：垂直排列 + 垂直間距
        className // 用戶自定義的額外類名
      )}
      {...props} // 其他 HTML 屬性 (如 id, data-* 等)
    >
      {/* === 遍歷所有步驟並渲染 === */}
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* === 單個步驟組件 === */}
          <div
            className={cn(
              'flex items-center', // 基本佈局
              isHorizontal
                ? 'flex-col' // 水平佈局時，步驟內部垂直排列 (徽章在上，文字在下)
                : 'flex-row space-x-3', // 垂直佈局時，步驟內部水平排列 (徽章在左，文字在右)
              onStepClick && 'cursor-pointer' // 如果有點擊事件，加上指針游標樣式
            )}
            onClick={() => onStepClick?.(step, index)} // 可選的點擊事件處理
          >
            {/* === 步驟數字/完成圖示 === */}
            <Badge
              // 根據步驟狀態選擇不同的視覺風格
              variant={
                step.completed
                  ? 'default' // 已完成：主要風格
                  : step.active
                    ? 'default' // 當前步驟：主要風格
                    : 'secondary' // 未開始：次要風格
              }
              className={cn(
                'flex items-center justify-center rounded-full transition-colors', // 基本樣式
                step.completed || step.active
                  ? 'bg-highlight text-highlight-foreground' // 活躍/完成狀態的色彩
                  : 'bg-muted text-muted-foreground', // 未開始狀態的色彩
                'w-8 h-8 text-sm font-medium' // 尺寸和字體設定
              )}
            >
              {/* 根據步驟狀態顯示不同內容：完成時顯示勾選，其他時候顯示步驟數字 */}
              {step.completed ? <FaCheck className="w-4 h-4" /> : step.id}
            </Badge>

            {/* === 步驟標題 === */}
            <span
              className={cn(
                'text-sm font-medium transition-colors', // 基本文字樣式
                isHorizontal
                  ? 'mt-2 text-center' // 水平佈局：上方間距 + 置中對齊
                  : 'ml-0', // 垂直佈局：無左間距
                step.completed || step.active
                  ? 'text-foreground' // 活躍/完成狀態：主色彩
                  : 'text-muted-foreground' // 未開始狀態：淡化色彩
              )}
            >
              {step.title} {/* 步驟標題文字 */}
            </span>
          </div>

          {/* === 步驟間分隔線 === */}
          {/* 只有不是最後一個步驟時才顯示分隔線 */}
          {index < steps.length - 1 && (
            <Separator
              // 根據佈局方向設定分隔線的方向
              orientation={isHorizontal ? 'horizontal' : 'vertical'}
              className={cn(
                isHorizontal
                  ? 'flex-1 h-px' // 水平佈局：水平線，充滿容器寬度
                  : 'w-px h-8 ml-4' // 垂直佈局：垂直線，固定高度 + 左間距
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * Example usage:
 *
 * const steps = [
 *   { id: 1, title: "選擇場館", completed: true },
 *   { id: 2, title: "選擇時間", completed: true },
 *   { id: 3, title: "填寫資料", active: true },
 *   { id: 4, title: "付款確認", completed: false }
 * ]
 *
 * <Step
 *   steps={steps}
 *   orientation="horizontal"
 *   onStepClick={(step, index) => console.log('Clicked step:', step)}
 * />
 */

export default Step
