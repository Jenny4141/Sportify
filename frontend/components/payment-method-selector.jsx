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

// ===================================================================
// 付款方式子組件 - 模組化設計
// ===================================================================

/**
 * CreditCardForm - 信用卡付款表單組件
 *
 * 功能特色：
 * • 符合金融業標準的信用卡資訊收集
 * • 輸入欄長度限制和格式化
 * • RWD 响應式網格佈局
 * • 無障礙標籤和欄位關聯
 *
 * 注意：這是 UI 模組，實際付款處理由 ECPay 等第三方服務處理
 */
const CreditCardForm = () => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg mt-3">
    {/* 輕微背景色區分表單區域 */}
    <div className="grid grid-cols-1 gap-6">
      {/* 單欄佈局，適中間距 */}
      {/* 信用卡號碼輸入欄 */}
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="cardNumber">信用卡號碼</Label> {/* 無障礙標籤 */}
        <Input
          type="text" // 文字類型，避免數字類型的箭頭按鈕
          id="cardNumber" // 與 Label 關聯的 ID
          placeholder="1234 5678 9012 3456" // 示範格式
          maxLength="19" // 限制長度 (16 位數字 + 3 個空格)
        />
      </div>
      {/* 有效期限和安全碼：雙欄佈局 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 平均分割成兩欄 */}
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="expiry">有效期限</Label>
          <Input
            type="text"
            id="expiry"
            placeholder="MM/YY" // 標準月/年格式
            maxLength="5" // MM/YY = 5 個字元
          />
        </div>
        <div className="grid w-full items-center gap-3">
          <Label htmlFor="cvv">安全碼</Label>
          <Input
            type="text"
            id="cvv"
            placeholder="123" // 3 位數示範
            maxLength="3" // 限制 CVV 長度
          />
        </div>
      </div>
      {/* 持卡人姓名輸入欄 */}
      <div className="grid w-full items-center gap-3">
        <Label htmlFor="cardName">持卡人姓名</Label>
        <Input
          type="text"
          id="cardName"
          placeholder="請輸入持卡人姓名" // 中文提示文字
        />
      </div>
    </div>
  </div>
)

/**
 * ATMForm - ATM 轉帳付款資訊顯示組件
 *
 * 功能特色：
 * • 顯示銀行轉帳資訊 (銀行代碼、帳號)
 * • 提供明確的轉帳步驟說明
 * • 重要訊息的視覺強調
 * • 用戶友好的排版和說明
 *
 * 使用場景：當用戶選擇 ATM 轉帳付款時顯示
 */
const ATMForm = () => (
  <div className="space-y-4 p-4 bg-accent/50 rounded-lg mt-3">
    {/* 與信用卡表單相同的視覺風格 */}
    <div className="text-sm text-muted-foreground">
      {/* 較小的文字尺寸和淡化色彩 */}
      <p className="font-medium mb-2">轉帳資訊：</p> {/* 標題文字加粗 */}
      <p>銀行代碼：822</p>
      <p>帳號：123456789012</p>
      <p>戶名：運動場地預約系統</p>
      <p className="text-orange-600 mt-2">
        ※ 請在完成轉帳後，保留轉帳明細供核對
      </p>
    </div>
  </div>
)

// ===================================================================
// 付款方式選項配置 - 多元付款支援
// ===================================================================
/**
 * 支援的付款方式選項清單
 * 每個選項包含：
 * • 唯一 ID 識別符
 * • 顯示標題和說明文字
 * • 相應的輸入表單組件
 * • 支付系統整合 (ECPay)
 */
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

// ===================================================================
// 付款方式選擇器主組件
// ===================================================================
/**
 * PaymentMethodSelector - 購物流程中的付款方式選擇組件
 *
 * 功能特色：
 * • 多種付款方式支援 (信用卡/ATM/超商代確)
 * • 條件式表單顯示 (根據選擇顯示不同表單)
 * • 表單驗證和錯誤處理
 * • Choicebox UI 組件整合
 * • 無障礙設計和用戶體驗
 *
 * @param {Object} props 組件屬性
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
// ===================================================================
// 組件出口 - 供其他組件使用
// ===================================================================

// 出口付款方式配置供外部組件使用 (如訂單摘要計算)
export { paymentOptions }
