import express from 'express'
import {
  getListData,
  getAvailableTimeSlotsDate,
  getAvailableTimeSlotsRange,
  getItemData,
  createCourtTimeSlot,
  updateCourtTimeSlot,
  deleteCourtTimeSlot,
  deleteMultipleCourtTimeSlots,
  batchSetCourtTimeSlotPrice,
} from '../../services/venue/court-time-slot.js'

const router = express.Router()

// ========================= API 的路由 =========================

// *** 取得列表資料
router.get('/', async (req, res) => {
  const {
    page,
    keyword,
    orderby,
    perPage,
    locationId,
    centerId,
    sportId,
    timePeriodId,
  } = req.query

  const result = await getListData({
    page: +page || 1,
    keyword,
    orderby,
    perPage: +perPage || 10,
    locationId: locationId ? +locationId : null,
    centerId: centerId ? +centerId : null,
    sportId: sportId ? +sportId : null,
    timePeriodId: timePeriodId ? +timePeriodId : null,
  })
  res.status(result.code).json(result)
})

// #region 透過場館與運動篩選，取得列表資料
router.get('/date', async (req, res) => {
  const { centerId, sportId, date, excludeReservationId } = req.query
  if (!centerId || !sportId) {
    return res
      .status(400)
      .json({ success: false, message: '缺少 centerId 或 sportId' })
  }
  const result = await getAvailableTimeSlotsDate(
    centerId,
    sportId,
    date,
    excludeReservationId
  )
  res.status(result.code).json(result)
})

// #region 查詢從 today 起算 N 天的可預約 CourtTimeSlots
router.get('/range', async (req, res) => {
  const { centerId, sportId, today, days } = req.query
  if (!centerId || !sportId || !today) {
    return res.status(400).json({ success: false, message: '缺少參數' })
  }
  const result = await getAvailableTimeSlotsRange({
    centerId: Number(centerId),
    sportId: Number(sportId),
    today,
    days: days ? Number(days) : 30,
  })
  res.status(result.code).json(result)
})

// *** 取得單筆 CourtTimeSlot 資料
router.get('/:id', async (req, res) => {
  const id = req.params.id
  const result = await getItemData(id)
  res.status(result.code).json(result)
})

// *** 新增 CourtTimeSlot 資料的 API
router.post('/', async (req, res) => {
  const result = await createCourtTimeSlot(req.body)
  res.status(result.code).json(result)
})

// *** 編輯 CourtTimeSlot 資料的 API
router.put('/:id', async (req, res) => {
  const id = req.params.id
  const result = await updateCourtTimeSlot(id, req.body)
  res.status(result.code).json(result)
})

// *** 多選刪除 CourtTimeSlot 資料的 API
router.delete('/multi', async (req, res) => {
  const result = await deleteMultipleCourtTimeSlots(req.body.checkedItems)
  res.status(result.code).json(result)
})

// *** 刪除 CourtTimeSlot 資料的 API
router.delete('/:id', async (req, res) => {
  const id = req.params.id
  const result = await deleteCourtTimeSlot(id)
  res.status(result.code).json(result)
})

// *** 批次設定價格（依條件）的 API
router.post('/batch-set-price', async (req, res) => {
  const result = await batchSetCourtTimeSlotPrice(req.body)
  res.status(result.code).json(result)
})

export default router
