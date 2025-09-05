import express from 'express'
import {
  getListData,
  getItemData,
  createCourt,
  updateCourt,
  deleteCourt,
  deleteMultipleCourts,
} from '../../../services/venue/court.js'

const router = express.Router()

// ========================= API 的路由 =========================

// *** 取得列表資料
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

// *** 取得單筆資料
router.get('/:id', async (req, res) => {
  const id = +req.params.id
  const result = await getItemData(id)
  res.status(result.code).json(result)
})

// *** 新增資料的 API
router.post('/', async (req, res) => {
  const result = await createCourt(req.body)
  res.status(result.code).json(result)
})

// *** 編輯資料的 API
router.put('/:id', async (req, res) => {
  const id = +req.params.id
  const result = await updateCourt(id, req.body)
  res.status(result.code).json(result)
})

// *** 多選刪除資料的 API
router.delete('/multi', async (req, res) => {
  const result = await deleteMultipleCourts(req.body.checkedItems)
  res.status(result.code).json(result)
})

// *** 刪除資料的 API
router.delete('/:id', async (req, res) => {
  const result = await deleteCourt(+req.params.id)
  res.status(result.code).json(result)
})

export default router
