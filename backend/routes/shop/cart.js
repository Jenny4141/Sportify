import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  prepareCheckout,
  getCheckoutData,
} from '../../services/shop/cart.js'
import { createUserOrder } from '../../services/shop/order.js'

const router = express.Router()

// 所有路由都加上 JWT 驗證
router.use(jwtMiddleware)

// 獲取用戶購物車
router.get('/', async (req, res) => {
  // 取得登入會員ID
  const memberId = req.user.id
  const result = await getCart({ memberId })
  res.status(result.code).json(result)
})
// 添加商品到購物車
router.post('/add', async (req, res) => {
  const memberId = req.user.id
  const result = await addToCart({
    memberId,
    body: req.body,
  })
  res.status(result.code).json(result)
})
// 更新購物車項目數量
router.put('/item/:id', async (req, res) => {
  const memberId = req.user.id
  const result = await updateCartItem({
    memberId,
    cartItemId: req.params.id,
    body: req.body,
  })
  res.status(result.code).json(result)
})
// 從購物車移除商品
router.delete('/item/:id', async (req, res) => {
  const memberId = req.user.id
  const result = await removeFromCart({
    memberId,
    cartItemId: req.params.id,
  })
  res.status(result.code).json(result)
})
// 清空購物車
router.delete('/clear', async (req, res) => {
  const memberId = req.user.id
  const result = await clearCart({ memberId })
  res.status(result.code).json(result)
})
// 取得結帳頁面所需的完整資料
router.get('/checkout', async (req, res) => {
  const memberId = req.user.id
  const result = await getCheckoutData({ memberId })
  res.status(result.code).json(result)
})
// 執行結帳 - 創建訂單
router.post('/checkout', async (req, res) => {
  const memberId = req.user.id
  const cartResult = await prepareCheckout({ memberId })
  if (!cartResult.success) {
    return res.status(cartResult.code).json(cartResult)
  }

  const cartItems = cartResult.data.cart.cartItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }))

  const result = await createUserOrder({
    memberId: parseInt(memberId),
    orderData: req.body.orderData,
    cartItems,
  })
  res.status(result.code).json(result)
})

export default router
