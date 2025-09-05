import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import {
  addRating,
  getCenterRatings,
  getMemberRating,
  deleteRating,
  getRatingStats,
} from '../../services/venue/rating.js'

const router = express.Router()

// *** 新增/更新評分 (需要登入)
router.post('/:id', jwtMiddleware, async (req, res) => {
  const centerId = req.params.id
  const { rating, comment } = req.body
  const memberId = req.user.id

  const result = await addRating(centerId, memberId, rating, comment)
  res.status(result.code === 200 ? 200 : result.code).json(result)
})

// *** 取得運動中心的所有評分
router.get('/centers/:centerId/ratings', async (req, res) => {
  const { centerId } = req.params
  const { page = 1, perPage = 5 } = req.query

  const result = await getCenterRatings(centerId, page, perPage)
  res.status(result.code === 200 ? 200 : result.code).json(result)
})

// *** 取得會員對特定運動中心的評分 (需要登入)
router.get('/centers/:centerId/my-rating', jwtMiddleware, async (req, res) => {
  const { centerId } = req.params
  const memberId = req.user.id

  const result = await getMemberRating(centerId, memberId)
  res.status(result.code === 200 ? 200 : result.code).json(result)
})

// *** 刪除評分 (需要登入)
router.delete('/centers/:centerId/rating', jwtMiddleware, async (req, res) => {
  const { centerId } = req.params
  const memberId = req.user.id

  const result = await deleteRating(centerId, memberId)
  res.status(result.code).json(result)
})

// *** 取得運動中心評分統計
router.get('/centers/:centerId/stats', async (req, res) => {
  const { centerId } = req.params

  const result = await getRatingStats(centerId)
  res.status(result.code).json(result)
})

export default router
