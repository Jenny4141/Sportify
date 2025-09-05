import express from 'express'

import {
  getSportData,
  getMemberData,
  getStatusData,
  getDeliveryData,
  getPaymentData,
  getInvoiceData,
  getLocationData,
  getTimePeriodData,
  getCenterData,
  getCourtData,
  getTimeSlotData,
  getCourtTimeSlotData,
  getBrandData,
  getCoachData,
} from '../services/common.js'

const router = express.Router()

// *** 取得運動類型 sport 資料
router.get('/sport', async (req, res) => {
  const { centerId } = req.query
  const result = await getSportData({ centerId })
  res.status(result.code).json(result)
})

// *** 取得會員 member 資料
router.get('/member', async (req, res) => {
  const result = await getMemberData()
  res.status(result.code).json(result)
})

// *** 取得訂單狀態 status 資料
router.get('/status', async (req, res) => {
  const result = await getStatusData()
  res.status(result.code).json(result)
})

// *** 取得物流方式 delivery 資料
router.get('/delivery', async (req, res) => {
  const result = await getDeliveryData()
  res.status(result.code).json(result)
})

// *** 取得付款方式 payment 資料
router.get('/payment', async (req, res) => {
  const result = await getPaymentData()
  res.status(result.code).json(result)
})

// *** 取得發票類型 invoice 資料
router.get('/invoice', async (req, res) => {
  const result = await getInvoiceData()
  res.status(result.code).json(result)
})

// *** 取得地區 location 資料
router.get('/location', async (req, res) => {
  const result = await getLocationData()
  res.status(result.code).json(result)
})

// *** 取得中心 center 資料
router.get('/center', async (req, res) => {
  const { locationId } = req.query
  const result = await getCenterData({ locationId })
  res.status(result.code).json(result)
})

// *** 取得球場 court 資料
router.get('/court', async (req, res) => {
  const { centerId, sportId } = req.query
  const result = await getCourtData({ centerId, sportId })
  res.status(result.code).json(result)
})

// 取得所有時段 time-period 區間
router.get('/time-period', async (req, res) => {
  const result = await getTimePeriodData()
  res.status(result.code).json(result)
})

// *** 取得時段 timeSlot 資料
router.get('/time-slot', async (req, res) => {
  const { timePeriodId } = req.query
  const result = await getTimeSlotData({ timePeriodId })
  res.status(result.code).json(result)
})

// *** 取得場地時段組合 court, timeSlot 資料
router.get('/court-time-slot', async (req, res) => {
  const { courtId, timeSlotId } = req.query
  const result = await getCourtTimeSlotData({ courtId, timeSlotId })
  res.status(result.code).json(result)
})

// *** 取得品牌 brand 資料
router.get('/brand', async (req, res) => {
  const result = await getBrandData()
  res.status(result.code).json(result)
})

// *** 取得教練 coach 資料
router.get('/coach', async (req, res) => {
  const result = await getCoachData()
  res.status(result.code).json(result)
})

export default router
