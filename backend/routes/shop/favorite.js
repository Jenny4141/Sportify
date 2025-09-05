import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import {
  toggleFavorite,
  getFavoritesOfMember,
} from '../../services/shop/favorite.js'

const router = express.Router()

// 所有路由都加上 JWT 驗證
router.use(jwtMiddleware)

// 切換收藏狀態
router.post('/:productId/toggle', async (req, res) => {
  const userId = req.user.id
  const result = await toggleFavorite({
    productId: parseInt(req.params.productId),
    userId,
  })
  res.status(result.code).json(result)
})
// 取得某會員所有收藏商品
router.get('/member', async (req, res) => {
  const memberId = req.user.id
  const result = await getFavoritesOfMember(memberId)
  res.status(result.code).json(result)
})

export default router
