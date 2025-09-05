import express from 'express'
import {
  getAllProducts,
  getProductById,
  getAllProductsOrders,
} from '../../services/shop/product.js'
import { optionalJwtMiddleware } from '../../utils/jwt-middleware.js'
const router = express.Router()
// 所有路由都加上 JWT 驗證
router.use(optionalJwtMiddleware)

// 商品列表
router.get('/', async (req, res) => {
  const userId = req.user?.id
  const result = await getAllProducts({
    ...req.query,
    userId,
  })
  res.status(result.code).json(result)
})
// 商品訂單列表
router.get('/list', async (req, res) => {
  const result = await getAllProductsOrders()
  res.status(result.code).json(result)
})
// 商品詳細頁
router.get('/:id', async (req, res) => {
  const userId = req.user?.id
  const result = await getProductById({
    id: parseInt(req.params.id),
    userId,
  })
  res.status(result.code).json(result)
})

export default router
