import express from 'express'
import {
  addRating,
  getCenterRatings,
  getMemberRating,
  deleteRating,
  getRatingStats,
} from '../../../services/venue/rating.js'

const router = express.Router()

// *** 管理員新增/更新評分
router.post('/centers/:centerId/members/:memberId', async (req, res) => {
  const { centerId, memberId } = req.params
  const { rating, comment } = req.body

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

// *** 管理員取得特定會員對運動中心的評分
router.get('/centers/:centerId/members/:memberId', async (req, res) => {
  const { centerId, memberId } = req.params

  const result = await getMemberRating(centerId, memberId)
  res.status(result.code === 200 ? 200 : result.code).json(result)
})

// *** 管理員刪除評分
router.delete('/centers/:centerId/members/:memberId', async (req, res) => {
  const { centerId, memberId } = req.params

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
