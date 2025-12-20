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

const CompanyReceiptForm = ({
  formData,
  onInputChange,
  onInputBlur,
  errors,
}) => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg mt-3">
    <div className="grid grid-cols-1 gap-3">
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="companyId">統一編號</Label>
        <Input
          type="text"
          id="companyId"
          placeholder="請輸入8位數統一編號"
          maxLength="8"
          value={formData.companyId || ''}
          onChange={(e) => onInputChange('companyId', e.target.value)}
          onBlur={(e) =>
            onInputBlur && onInputBlur('companyId', e.target.value)
          }
          className={`w-full ${errors.companyId ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
        />
        {errors.companyId && (
          <span className="text-destructive text-sm">{errors.companyId}</span>
        )}
      </div>
    </div>
  </div>
)

const ElectronicCarrierForm = ({
  formData, 
  onInputChange,
  onInputBlur,
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
