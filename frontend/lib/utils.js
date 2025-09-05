import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getAuthHeader() {
  const storageKey = 'sportify-auth'
  let token = ''
  try {
    token = localStorage.getItem(storageKey) || ''
  } catch (e) {
    token = ''
  }
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 簡單驗證函數
export function validateField(
  field,
  value,
  showFormatError = false,
  deliveryType = '',
  receiptType = ''
) {
  switch (field) {
    case 'recipient':
      if (!value.trim()) return '收件人姓名為必填'
      return ''
    case 'name':
      if (!value.trim()) return '訂購人姓名為必填'
      return ''
    case 'phone':
      if (!value.trim()) return '手機號碼為必填'
      // 只有在明確要求顯示格式錯誤，或者值看起來像是完整輸入時才顯示格式錯誤
      if (showFormatError || (value.length >= 10 && !/^09\d{8}$/.test(value))) {
        if (!/^09\d{8}$/.test(value))
          return '手機號碼格式錯誤，請輸入09開頭的10位數字'
      }
      return ''
    case 'address':
      // 只有選擇宅配時才需要驗證地址
      if (deliveryType === '3') {
        if (!value.trim()) return '收件地址為必填'
        if (showFormatError && value.trim().length < 5)
          return '收件地址至少5個字'
      }
      return ''
    case 'storeName':
      if (
        deliveryType === '1' && // 7-11 門市
        (!value || value.trim() === '')
      ) {
        return '請選擇門市'
      }
      return ''
    case 'delivery':
      return !value ? '請選擇配送方式' : ''
    case 'payment':
      return !value ? '請選擇付款方式' : ''
    case 'receipt':
      return !value ? '請選擇發票類型' : ''
    case 'carrierId':
      // 只有選擇電子載具時才需要驗證
      if (receiptType === '3') {
        if (!value.trim()) return '載具號碼為必填'
        // 只有在明確要求或輸入看起來完整時才顯示格式錯誤
        if (
          showFormatError ||
          (value.length >= 8 && !/^\/[A-Z0-9.\-+]{7}$/.test(value))
        ) {
          if (!/^\/[A-Z0-9.\-+]{7}$/.test(value))
            return '載具號碼格式錯誤，請輸入正確格式 (例：/A12345B)'
        }
      }
      return ''
    case 'companyId':
      // 只有選擇統一編號時才需要驗證
      if (receiptType === '2') {
        if (!value.trim()) return '統一編號為必填'
        // 只有在明確要求或輸入看起來完整時才顯示格式錯誤
        if (showFormatError || (value.length >= 8 && !/^\d{8}$/.test(value))) {
          if (!/^\d{8}$/.test(value)) return '統一編號格式錯誤，請輸入8位數字'
        }
      }
      return ''
    default:
      return ''
  }
}

// 預約資訊驗證函數
export function validateVenueField(field, value, timeSlots = []) {
  switch (field) {
    case 'center':
      return !value ? '請選擇運動中心' : ''
    case 'sport':
      return !value ? '請選擇運動項目' : ''
    case 'selectedDate':
      return !value ? '請選擇預約日期' : ''
    case 'timeSlots':
      return !timeSlots || timeSlots.length === 0 ? '請選擇場地時段' : ''
    default:
      return ''
  }
}
