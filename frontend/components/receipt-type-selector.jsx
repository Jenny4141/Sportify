'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Choicebox,
  ChoiceboxItem,
  ChoiceboxItemContent,
  ChoiceboxItemHeader,
  ChoiceboxItemIndicator,
  ChoiceboxItemSubtitle,
  ChoiceboxItemTitle,
} from '@/components/ui/choicebox'

// ===================================================================
// 發票類型子組件 - 模組化表單設計
// ===================================================================

/**
 * CompanyReceiptForm - 統一編號發票表單組件
 *
 * 功能特色：
 * • 符合台灣稅法規定的 8 位數統一編號輸入
 * • 即時驗證和錯誤訊息顯示
 * • 無障礙設計 (Label 與 Input 關聯)
 * • 視覺一致性 (與其他表單相同的色彩和樣式)
 *
 * 使用場景：當用戶選擇公司發票時顯示
 *
 * @param {Object} props.formData 表單資料物件
 * @param {Function} props.onInputChange 輸入值改變回調
 * @param {Function} props.onInputBlur 輸入欄失焦回調 (用於驗證)
 * @param {Object} props.errors 驗證錯誤訊息物件
 */
const CompanyReceiptForm = ({
  formData, // 表單資料 (包含 companyId 等)
  onInputChange, // 輸入變更回調函數
  onInputBlur, // 輸入欄失焦回調 (可選, 用於觸發驗證)
  errors, // 驗證錯誤訊息
}) => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg mt-3">
    {/* 輕微背景色區分表單區域 */}
    <div className="grid grid-cols-1 gap-3">
      {/* 單欄網格佈局 */}
      {/* 統一編號輸入欄 */}
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="companyId">統一編號</Label> {/* 無障礙標籤 */}
        {/* 主要輸入欄：支援驗證和錯誤狀態 */}
        <Input
          type="text" // 文字類型輸入
          id="companyId" // 與 Label 關聯的 ID
          placeholder="請輸入8位數統一編號" // 用戶提示文字
          maxLength="8" // 限制輸入長度 (符合台灣規定)
          value={formData.companyId || ''} // 控制式輸入，預設為空字串
          onChange={(e) => onInputChange('companyId', e.target.value)} // 即時更新狀態
          onBlur={(
            e // 失焦時觸發驗證 (可選)
          ) => onInputBlur && onInputBlur('companyId', e.target.value)}
          // 條件式 CSS: 有錯誤時顯示紅色邊框
          className={`w-full ${errors.companyId ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
        />
        {/* 錯誤訊息顯示：條件式渲染 */}
        {errors.companyId && (
          <span className="text-destructive text-sm">{errors.companyId}</span>
        )}
      </div>
    </div>
  </div>
)

/**
 * ElectronicCarrierForm - 電子載具發票表單組件
 *
 * 功能特色：
 * • 支援台灣電子發票系統的載具號碼輸入
 * • 支援多種載具格式 (手機條碼、市民數位憑等)
 * • 即時驗證和格式檢查
 * • 用戶友好的錯誤提示
 *
 * 使用場景：當用戶選擇電子發票時顯示
 *
 * @param {Object} props 組件屬性
 * @param {Object} props.formData 表單資料 (包含 carrierId)
 * @param {Function} props.onInputChange 輸入變更回調函數
 * @param {Function} props.onInputBlur 輸入欄失焦回調函數
 * @param {Object} props.errors 驗證錯誤訊息物件
 */
const ElectronicCarrierForm = ({
  formData, // 表單資料狀態
  onInputChange, // 輸入變更事件處理
  onInputBlur, // 輸入欄失焦事件處理
  errors,
}) => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg mt-3">
    <div className="grid grid-cols-1 gap-3">
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="carrierId">載具號碼</Label>
        <Input
          type="text"
          id="carrierId"
          placeholder="請輸入載具號碼 (例：/A123.5-+)"
          value={formData.carrierId || ''}
          onChange={(e) => onInputChange('carrierId', e.target.value)}
          onBlur={(e) =>
            onInputBlur && onInputBlur('carrierId', e.target.value)
          }
          className={`w-full ${errors.carrierId ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
        />
        {errors.carrierId && (
          <span className="text-destructive text-sm">{errors.carrierId}</span>
        )}
      </div>
    </div>
  </div>
)

const getReceiptOptions = (formData, onInputChange, onInputBlur, errors) => [
  {
    id: '1',
    label: '一般發票',
    subtitle: '個人發票，無需額外資訊',
    component: null, // 不顯示額外選項
  },
  {
    id: '2',
    label: '統一編號',
    subtitle: '公司發票，需填寫統編',
    component: (
      <CompanyReceiptForm
        formData={formData}
        onInputChange={onInputChange}
        onInputBlur={onInputBlur}
        errors={errors}
      />
    ),
  },
  {
    id: '3',
    label: '電子載具',
    subtitle: '存入電子載具',
    component: (
      <ElectronicCarrierForm
        formData={formData}
        onInputChange={onInputChange}
        onInputBlur={onInputBlur}
        errors={errors}
      />
    ),
  },
]

/**
 * 發票類型選擇元件
 * @param {Object} props
 * @param {string} props.selectedReceipt - 當前選中的發票類型ID
 * @param {function} props.onReceiptChange - 發票類型變更回調函數
 * @param {Object} props.formData - 表單資料物件
 * @param {function} props.onInputChange - 輸入欄位變更回調函數
 * @param {function} props.onInputBlur - 輸入欄位失焦回調函數
 * @param {Object} props.errors - 驗證錯誤物件
 * @param {string} props.className - 自定義樣式類名
 * @returns {JSX.Element}
 */
export default function ReceiptTypeSelector({
  selectedReceipt,
  onReceiptChange,
  formData = {},
  onInputChange = () => {},
  onInputBlur = () => {},
  errors = {},
  className = '',
}) {
  const receiptOptions = getReceiptOptions(
    formData,
    onInputChange,
    onInputBlur,
    errors
  )

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium">選擇發票類型</Label>
        {errors.receipt && (
          <span className="text-destructive text-sm">{errors.receipt}</span>
        )}
      </div>
      <div className="space-y-2">
        <Choicebox value={selectedReceipt} onValueChange={onReceiptChange}>
          {receiptOptions.map((option) => (
            <div key={option.id}>
              <ChoiceboxItem value={option.id}>
                <ChoiceboxItemHeader>
                  <ChoiceboxItemTitle>
                    {option.label}
                    <ChoiceboxItemSubtitle>
                      {option.subtitle}
                    </ChoiceboxItemSubtitle>
                  </ChoiceboxItemTitle>
                </ChoiceboxItemHeader>
                <ChoiceboxItemContent>
                  <ChoiceboxItemIndicator />
                </ChoiceboxItemContent>
              </ChoiceboxItem>
              {/* 動態顯示選中選項的組件 */}
              {selectedReceipt === option.id && option.component && (
                <div className="md:ml-6">{option.component}</div>
              )}
            </div>
          ))}
        </Choicebox>
      </div>
    </div>
  )
}

// 匯出基本發票選項資料供其他地方使用
export const receiptOptions = [
  {
    id: '1',
    label: '一般發票',
    subtitle: '個人發票，無需額外資訊',
  },
  {
    id: '2',
    label: '統一編號',
    subtitle: '公司發票，需填寫統編',
  },
  {
    id: '3',
    label: '電子載具',
    subtitle: '存入電子載具',
  },
]
