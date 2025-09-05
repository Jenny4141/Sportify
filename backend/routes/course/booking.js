import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import {
  getListData,
  getItemData,
  createBooking,
  updateBooking,
  deleteBooking,
  deleteMultipleBookings,
  getDataOfMember,
} from '../../services/course/booking.js'

const router = express.Router()
// 所有路由都加上 JWT 驗證
router.use(jwtMiddleware)

// ========================= API 的路由 =========================

// *** 取得列表資料
router.get('/', async (req, res) => {
  const { page, keyword, orderby, perPage } = req.query
  const result = await getListData({
    page: +page || 1,
    keyword,
    orderby,
    perPage: +perPage || 6,
  })
  res.status(result.code).json(result)
})

// 取得某會員所有 Booking 資料
router.get('/member', async (req, res) => {
  const memberId = req.user.id
  const result = await getDataOfMember(memberId)
  res.status(result.code).json(result)
})

// *** 取得單筆 Booking 資料
router.get('/:id', async (req, res) => {
  const id = req.params.id
  const result = await getItemData(id)
  res.status(result.code).json(result)
})

// *** 新增 Booking 資料的 API
router.post('/', async (req, res) => {
  const result = await createBooking(req.body)
  res.status(result.code).json(result)
})

// *** 編輯 Booking 資料的 API
router.put('/:id', async (req, res) => {
  const id = req.params.id
  const result = await updateBooking(id, req.body)
  res.status(result.code).json(result)
})

// *** 多選刪除 Booking 資料的 API
router.delete('/multi', async (req, res) => {
  const result = await deleteMultipleBookings(req.body.checkedItems)
  res.status(result.code).json(result)
})

// *** 刪除 Booking 資料的 API
router.delete('/:id', async (req, res) => {
  const id = req.params.id
  const result = await deleteBooking(id)
  res.status(result.code).json(result)
})

export default router
