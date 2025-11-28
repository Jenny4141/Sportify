'use client'

// react
import React, { useState, useEffect } from 'react'
// ui components
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Choicebox,
  ChoiceboxItem,
  ChoiceboxItemContent,
  ChoiceboxItemHeader,
  ChoiceboxItemIndicator,
  ChoiceboxItemSubtitle,
  ChoiceboxItemTitle,
} from '@/components/ui/choicebox'
import { API_SERVER } from '@/lib/api-path'

// ===================================================================
// 配送方式選項配置 - 商業邏輯設定
// ===================================================================
/**
 * 配送方式的主要選項，包含便利商店和宅配服務
 * 每個選項包含：
 * • 唯一 ID 識別
 * • 顯示標籤和副標題
 * • 運費設定 (用於訂單計算)
 * • 可擴展的額外組件 (未來功能)
 */
const DeliveryOptions = [
  {
    id: '1',
    label: '7-11取貨', // 主要顯示文字
    subtitle: '運費$60', // 副標題資訊
    fee: 60, // 運費金額 (用於總價計算)
    component: null, // 未來擴展：可嵌入其他 UI 組件
  },
  {
    id: '2',
    label: '全家取貨', // 全家便利商店服務
    subtitle: '運費$60',
    fee: 60, // 與 7-11 相同的運費結構
    component: null,
  },
  {
    id: '3',
    label: '宅配', // 宅配到家服務
    subtitle: '運費$100',
    fee: 100, // 宅配運費較高 (商業邏輯)
    component: null,
  },
]

// ===================================================================
// 配送方式選擇器主組件
// ===================================================================
/**
 * DeliveryMethodSelector - 購物流程中的配送方式選擇組件
 *
 * 功能特色：
 * • 多種配送選項 (便利商店/宅配)
 * • 動態運費計算和顯示
 * • 表單驗證和錯誤顯示
 * • 條件式輸入欄 (如宅配地址)
 * • 未來擴展性 (門市選擇器)
 *
 * @param {Object} props 組件屬性
 * @param {string} props.selectedDelivery 當前選中的配送方式 ID
 * @param {Function} props.onDeliveryChange 配送方式改變時的回調函數
 * @param {Object} props.errors 表單驗證錯誤訊息物件
 * @param {string} props.className 額外的 CSS 類名
 * @param {Object} props.formData 表單資料物件 (包含地址等)
 * @param {Function} props.onInputChange 輸入欄變更時的回調函數
 * @param {Function} props.onInputBlur 輸入欄失去焦點時的回調函數
 */
export default function DeliveryMethodSelector({
  selectedDelivery, // 當前選中的配送方式 ID
  onDeliveryChange, // 配送方式改變回調
  errors = {}, // 驗證錯誤，預設為空物件
  className = '', // 額外 CSS 類名
  formData = {}, // 表單資料 (地址等)
  onInputChange, // 輸入欄變更回調
  onInputBlur, // 輸入欄失焦回調
}) {
  // ===== 組件狀態管理 =====
  const [store, setStore] = useState(null)
  const popupRef = React.useRef(null)

  const sevenStore = () => {
    // 記錄 popup window 參考，收到 message 時可檢查來源
    popupRef.current = window.open(
      'https://emap.presco.com.tw/c2cemap.ashx?eshopid=870&&servicetype=1&url=' +
        encodeURIComponent(`${API_SERVER}/shop/shipment`),
      '',
      'width=900,height=600'
    )
  }

  // 接收後端傳回的門市資料
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        // 若你知道 popup 的 origin，可驗證 event.origin 避免被其它來源覆寫
        // const allowed = ['https://emap.presco.com.tw', window.location.origin];
        // if (!allowed.includes(event.origin)) return;

        // 若有 popupRef，優先檢查來源窗體相同
        if (popupRef.current && event.source !== popupRef.current) return

        const data = event.data
        // 只接受物件且包含 storename 的訊息
        if (!data || typeof data !== 'object' || !data.storename) return

        setStore(data)
        if (onInputChange) {
          onInputChange('storeName', data.storename)
        }
      } catch (err) {
        // 忽略不合法訊息
        console.warn('unexpected postMessage', err)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onInputChange])

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium">選擇物流方式</Label>
        {errors.delivery && (
          <span className="text-destructive text-sm">{errors.delivery}</span>
        )}
      </div>
      <div className="space-y-2">
        <Choicebox value={selectedDelivery} onValueChange={onDeliveryChange}>
          {DeliveryOptions.map((option) => (
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
              {selectedDelivery === option.id && option.id === '1' && (
                <div
                  id="storeName"
                  className="ml-6 mt-3 flex gap-3 items-center"
                >
                  <Button variant="highlight" onClick={sevenStore}>
                    選擇門市
                  </Button>
                  {store && <div className="text-sm">{store.storename}</div>}
                  {errors.storeName && (
                    <span className="text-destructive text-sm">
                      {errors.storeName}
                    </span>
                  )}
                </div>
              )}
              {selectedDelivery === option.id && option.id === '3' && (
                <div className="ml-6 mt-3 space-y-2">
                  <Label htmlFor="address" className="text-sm">
                    收件地址
                  </Label>
                  <Input
                    type="text"
                    id="address"
                    placeholder="請填寫收件地址"
                    className={`w-full text-sm ${errors.address ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''}`}
                    value={formData.address || ''}
                    onChange={(e) =>
                      onInputChange && onInputChange('address', e.target.value)
                    }
                    onBlur={(e) =>
                      onInputBlur && onInputBlur('address', e.target.value)
                    }
                  />
                  {errors.address && (
                    <span className="text-destructive text-sm">
                      {errors.address}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </Choicebox>
      </div>
    </div>
  )
}

// 匯出物流選項資料供其他地方使用
export { DeliveryOptions }
