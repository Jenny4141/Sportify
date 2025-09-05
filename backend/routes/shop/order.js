import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import {
  getOrderById,
  getOrdersOfMember,
} from '../../services/shop/order.js'

const router = express.Router()

// 所有路由都加上 JWT 驗證
router.use(jwtMiddleware)

// 獲取用戶訂單列表
router.get('/orders', async (req, res) => {
  // 取得登入會員ID
  const memberId = req.user.id
  const result = await getOrdersOfMember(memberId)
  res.status(result.code).json(result)
})
// 取得某會員所有收藏訂單
router.get('/member', async (req, res) => {
  const memberId = req.user.id
  const result = await getOrdersOfMember(memberId)
  res.status(result.code).json(result)
})
// 獲取用戶單一訂單詳情
router.get('/:id', async (req, res) => {
  const memberId = req.user.id
  const result = await getOrderById({
    id: parseInt(req.params.id),
    memberId,
    dataOptions: { includeProductDetails: true }, // 前台需要商品詳細資訊
  })
  res.status(result.code).json(result)
})

export default router
