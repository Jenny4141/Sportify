import express from 'express'
import {
  getListData,
  getItemData,
  createReservation,
  updateReservation,
  deleteReservation,
  deleteMultipleReservations,
} from '../../../services/venue/reservation.js'

const router = express.Router()

// ========================= API 的路由 =========================

// *** 取得 Reservation 列表資料
router.get('/', async (req, res) => {
  const {
    page,
    keyword,
    orderby,
    perPage,
    memberId,
    date,
    locationId,
    centerId,
    sportId,
    timePeriodId,
  } = req.query
  const result = await getListData({
    page: +page || 1,
    keyword,
    orderby,
    perPage: +perPage,
    memberId,
    date,
    locationId,
    centerId,
    sportId,
    timePeriodId,
  })
  res.status(result.code).json(result)
})

// *** 取得單筆 Reservation 資料
router.get('/:id', async (req, res) => {
  const id = req.params.id
  const result = await getItemData(id)
  res.status(result.code).json(result)
})

// *** 新增 Reservation 資料的 API
router.post('/', async (req, res) => {
  const result = await createReservation(req.body)
  res.status(result.code).json(result)
})

// *** 編輯 Reservation 資料的 API
router.put('/:id', async (req, res) => {
  const id = req.params.id
  const result = await updateReservation(id, req.body)
  res.status(result.code).json(result)
})

// *** 多選刪除 Reservation 資料的 API
router.delete('/multi', async (req, res) => {
  const result = await deleteMultipleReservations(req.body.checkedItems)
  res.status(result.code).json(result)
})

// *** 刪除 Reservation 資料的 API
router.delete('/:id', async (req, res) => {
  const id = req.params.id
  const result = await deleteReservation(id)
  res.status(result.code).json(result)
})

export default router
