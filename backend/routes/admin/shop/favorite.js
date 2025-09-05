import express from 'express'
import { toggleFavorite } from '../../../services/shop/favorite.js'

const router = express.Router()
router.post('/:productId/toggle', async (req, res) => {
  // 從JWT token中取得使用者ID
  const userId = req.user ? req.user.id : null
  if (!userId) {
    return res.status(401).json({ error: '請先登入' })
  }
  const result = await toggleFavorite({
    productId: parseInt(req.params.productId),
    userId,
  })
  res.status(result.code).json(result)
})

export default router
