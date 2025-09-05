import express from 'express'
import {
  getListData,
  getItemData,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  deleteMultipleTimeSlots,
} from '../../../services/venue/time-slot.js'

const router = express.Router()

// ========================= API 的路由 =========================

// 取得時段列表
router.get('/', async (req, res) => {
  const { page, keyword, orderby, perPage } = req.query
  const result = await getListData({
    page: +page || 1,
    keyword,
    orderby,
    perPage: +perPage,
  })
  res.status(result.code).json(result)
})

// 取得單筆時段
router.get('/:id', async (req, res) => {
  const id = +req.params.id
  const result = await getItemData(id)
  res.status(result.code).json(result)
})

// 新增時段
router.post('/', async (req, res) => {
  const result = await createTimeSlot(req.body)
  res.status(result.code).json(result)
})

// 編輯時段
router.put('/:id', async (req, res) => {
  const id = +req.params.id
  const result = await updateTimeSlot(id, req.body)
  res.status(result.code).json(result)
})

// 多選刪除時段
router.delete('/multi', async (req, res) => {
  const result = await deleteMultipleTimeSlots(req.body.checkedItems)
  res.status(result.code).json(result)
})

// 刪除單筆時段
router.delete('/:id', async (req, res) => {
  const result = await deleteTimeSlot(+req.params.id)
  res.status(result.code).json(result)
})

export default router
