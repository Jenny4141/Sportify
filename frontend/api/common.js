import { apiClient } from '@/api/axios'

export const fetchMemberOptions = async () => {
  const res = await apiClient.get('/common/member')
  return res.data
}

export const fetchStatusOptions = async () => {
  const res = await apiClient.get('/common/status')
  return res.data
}

export const fetchLocationOptions = async () => {
  const res = await apiClient.get('/common/location')
  return res.data
}

export const fetchTimePeriodOptions = async () => {
  const res = await apiClient.get('/common/time-period')
  return res.data
}

export const fetchCenterOptions = async (params = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
  ).toString()
  const url = query ? `/common/center?${query}` : '/common/center'
  const res = await apiClient.get(url)
  return res.data
}

export const fetchSportOptions = async (params = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
  ).toString()
  const url = query ? `/common/sport?${query}` : '/common/sport'
  const res = await apiClient.get(url)
  return res.data
}

export const fetchCourtOptions = async (params = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
  ).toString()
  const url = query ? `/common/court?${query}` : '/common/court'
  const res = await apiClient.get(url)
  return res.data
}

export const fetchTimeSlotOptions = async (params = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
  ).toString()
  const url = query ? `/common/time-slot?${query}` : '/common/time-slot'
  const res = await apiClient.get(url)
  return res.data
}

export const fetchCourtTimeSlotOptions = async (params = {}) => {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
    )
  ).toString()
  const url = query
    ? `/common/court-time-slot?${query}`
    : '/common/court-time-slot'
  const res = await apiClient.get(url)
  return res.data
}
export const fetchBrandOptions = async () => {
  const res = await apiClient.get('/common/brand')
  return res.data
}

// 獲取物流方式選項
export const fetchDeliveryOptions = async () => {
  const res = await apiClient.get('/common/delivery')
  return res.data
}

// 獲取付款方式選項
export const fetchPaymentOptions = async () => {
  const res = await apiClient.get('/common/payment')
  return res.data
}

// 獲取發票類型選項
export const fetchInvoiceOptions = async () => {
  const res = await apiClient.get('/common/invoice')
  return res.data
}

// 獲取教練選項
export const fetchCoachOptions = async () => {
  const res = await apiClient.get('/common/coach')
  return res.data
}

// Firebase Google 登入
export const firebaseLogin = async (idToken) => {
  const res = await apiClient.post('/auth/firebase-login', { idToken })
  return res.data
}
