import express from 'express'
import {
  getListData,
  getItemData,
  createLesson,
  updateLesson,
  deleteLesson,
  deleteMultipleLessons,
} from '../../services/course/lesson.js'

const router = express.Router()

// ========================= API 的路由 =========================

// *** 取得列表資料
router.get('/', async (req, res) => {
  const { page, keyword, orderby, perPage, sportId, coachId } = req.query
  const result = await getListData({
    page: +page || 1,
    keyword,
    orderby,
    perPage: +perPage || 6,
    sportId: sportId ? +sportId : null,
    coachId: coachId ? +coachId : null,
  })
  res.status(result.code).json(result)
})

// *** 取得單筆 Lesson 資料
router.get('/:id', async (req, res) => {
  const id = req.params.id
  const result = await getItemData(id)
  res.status(result.code).json(result)
})

// *** 新增 Lesson 資料的 API
router.post('/', async (req, res) => {
  const result = await createLesson(req.body)
  res.status(result.code).json(result)
})

// *** 編輯 Lesson 資料的 API
router.put('/:id', async (req, res) => {
  const id = req.params.id
  const result = await updateLesson(id, req.body)
  res.status(result.code).json(result)
})

// *** 多選刪除 Lesson 資料的 API
router.delete('/multi', async (req, res) => {
  const result = await deleteMultipleLessons(req.body.checkedItems)
  res.status(result.code).json(result)
})

// *** 刪除 Lesson 資料的 API
router.delete('/:id', async (req, res) => {
  const id = req.params.id
  const result = await deleteLesson(id)
  res.status(result.code).json(result)
})

export default router
