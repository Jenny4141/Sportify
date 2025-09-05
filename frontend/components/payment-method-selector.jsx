'use client'

import React from 'react'
import Image from 'next/image'
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

// 付款選項組件
const CreditCardForm = () => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg mt-3">
    <div className="grid grid-cols-1 gap-6">
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="cardNumber">信用卡號碼</Label>
        <Input
          type="text"
          id="cardNumber"
          placeholder="1234 5678 9012 3456"
          maxLength="19"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="expiry">有效期限</Label>
          <Input type="text" id="expiry" placeholder="MM/YY" maxLength="5" />
        </div>
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="cvv">安全碼</Label>
          <Input type="text" id="cvv" placeholder="123" maxLength="3" />
        </div>
      </div>
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="cardName">持卡人姓名</Label>
        <Input type="text" id="cardName" placeholder="請輸入持卡人姓名" />
      </div>
    </div>
  </div>
)

const ATMForm = () => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg mt-3">
    <div className="text-sm text-muted-foreground">
      <p className="font-medium mb-2">轉帳資訊：</p>
      <p>銀行代碼：822</p>
      <p>帳號：123456789012</p>
      <p>戶名：運動場地預約系統</p>
      <p className="text-orange-600 mt-2">
        ※ 請在完成轉帳後，保留轉帳明細供核對
      </p>
    </div>
  </div>
)

const paymentOptions = [
  {
    id: '1',
    label: '綠界金流',
    subtitle: (
      <Image
        src="/payment-pic/ecpay.svg"
        alt="ECPay"
        width={80}
        height={24}
        style={{ display: 'inline-block' }}
      />
    ),
    component: null, // 不顯示額外選項
  },
  {
    id: '2',
    label: 'LINE Pay',
    subtitle: (
      <Image
        src="/payment-pic/linepay.svg"
        alt="LINE Pay"
        width={80}
        height={24}
        style={{ display: 'inline-block' }}
      />
    ),
    component: null, // 不顯示額外選項
  },
  {
    id: '3',
    label: '貨到付款',
    // subtitle: (
    //   <Image
    //     src="/payment-pic/applepay.svg"
    //     alt="Apple Pay"
    //     width={80}
    //     height={24}
    //     style={{ display: 'inline-block' }}
    //   />
    // ),
    component: null, // 不顯示額外選項
  },
  {
    id: '4',
    label: 'ATM轉帳',
    subtitle: '銀行轉帳付款',
    component: <ATMForm />,
  },
  {
    id: '5',
    label: '超商代碼',
    subtitle: '超商代碼繳費',
    component: null, // 不顯示額外選項
  },
  {
    id: '99',
    label: '信用卡付款',
    subtitle: (
      <div>
        <Image
          src="/payment-pic/visa.svg"
          alt="信用卡圖示-visa"
          width={40}
          height={24}
          style={{ display: 'inline-block' }}
        />
        <Image
          src="/payment-pic/mastercard.svg"
          alt="信用卡圖示-mastercard"
          width={40}
          height={24}
          style={{ display: 'inline-block' }}
        />
        <Image
          src="/payment-pic/jcb.svg"
          alt="信用卡圖示-jcb"
          width={40}
          height={24}
          style={{ display: 'inline-block' }}
        />
      </div>
    ),
    component: <CreditCardForm />,
  },
]

/**
 * 付款方式選擇元件
 * @param {Object} props
 * @param {string} props.selectedPayment - 當前選中的付款方式ID
 * @param {function} props.onPaymentChange - 付款方式變更回調函數
 * @param {Object} props.errors - 驗證錯誤物件
 * @param {string} props.className - 自定義樣式類名
 * @returns {JSX.Element}
 */

export default function PaymentMethodSelector({
  selectedPayment,
  onPaymentChange,
  errors = {},
  className = '',
  options = paymentOptions,
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium">選擇付款方式</Label>
        {errors.payment && (
          <span className="text-destructive text-sm">{errors.payment}</span>
        )}
      </div>
      <div className="space-y-2">
        <Choicebox value={selectedPayment} onValueChange={onPaymentChange}>
          {options.map((option) => (
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
              {selectedPayment === option.id && option.component && (
                <div className="md:ml-6">{option.component}</div>
              )}
            </div>
          ))}
        </Choicebox>
      </div>
    </div>
  )
}

// 匯出付款選項資料供其他地方使用
export { paymentOptions }
