/**
 * 購物車路由 - 處理所有與購物車相關的 HTTP 請求
 *
 * 功能涵蓋：
 * - 查詢購物車內容 (GET /)
 * - 新增商品到購物車 (POST /add)
 * - 更新購物車項目數量 (PUT /item/:id)
 * - 移除購物車項目 (DELETE /item/:id)
 * - 清空購物車 (DELETE /clear)
 * - 獲取結帳資訊 (GET /checkout)
 * - 執行結帳 (POST /checkout)
 *
 * 所有路由都需要 JWT 身份驗證，確保只有登入用戶才能操作購物車
 */

import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import {
  getCart, // 獲取購物車內容
  addToCart, // 新增商品到購物車
  updateCartItem, // 更新購物車項目數量
  removeFromCart, // 移除購物車項目
  clearCart, // 清空購物車
  prepareCheckout, // 結帳前的準備工作
  getCheckoutData, // 獲取結帳所需資訊
} from '../../services/shop/cart.js'
import { createUserOrder } from '../../services/shop/order.js' // 創建訂單

const router = express.Router()

// === 全局中間件：所有路由都加上 JWT 驗證 ===
// 確保只有已登入的用戶才能存取購物車功能
router.use(jwtMiddleware)

/**
 * GET / - 獲取當前用戶的購物車內容
 * 回傳所有購物車項目、商品資訊、圖片、總價格等
 * 用於購物車頁面的初始化資料載入
 */
router.get('/', async (req, res) => {
  // 從 JWT token 中獲取已驗證的會員ID
  const memberId = req.user.id
  const result = await getCart({ memberId })
  res.status(result.code).json(result)
})

/**
 * POST /add - 新增商品到購物車
 * 請求主體: { productId: number, quantity: number }
 * 如果商品已存在於購物車，會累加數量
 * 會自動檢查庫存是否足夠
 */
router.post('/add', async (req, res) => {
  const memberId = req.user.id
  const result = await addToCart({
    memberId,
    body: req.body, // { productId, quantity }
  })
  res.status(result.code).json(result)
})

/**
 * PUT /item/:id - 更新購物車中特定項目的數量
 * 路徑參數: id - 購物車項目ID (非商品ID)
 * 請求主體: { quantity: number }
 * 如果 quantity 為 0 或負數，會刪除該項目
 */
router.put('/item/:id', async (req, res) => {
  const memberId = req.user.id
  const result = await updateCartItem({
    memberId,
    cartItemId: req.params.id, // 購物車項目ID
    body: req.body, // { quantity }
  })
  res.status(result.code).json(result)
})

/**
 * DELETE /item/:id - 從購物車移除特定商品
 * 路徑參數: id - 購物車項目ID
 * 用於購物車頁面的刪除按鈕或 X 按鈕
 */
router.delete('/item/:id', async (req, res) => {
  const memberId = req.user.id
  const result = await removeFromCart({
    memberId,
    cartItemId: req.params.id,
  })
  res.status(result.code).json(result)
})

/**
 * DELETE /clear - 清空整個購物車
 * 刪除當前用戶的所有購物車項目
 * 用於購物車頁面的「清空購物車」按鈕
 */
router.delete('/clear', async (req, res) => {
  const memberId = req.user.id
  const result = await clearCart({ memberId })
  res.status(result.code).json(result)
})

/**
 * GET /checkout - 獲取結帳頁面所需的完整資訊
 * 回傳內容包括：
 * - 購物車內容和總價格
 * - 付款方式選項
 * - 配送方式選項 (包含運費計算)
 * - 發票類型選項
 * 用於結帳頁面的初始化
 */
router.get('/checkout', async (req, res) => {
  const memberId = req.user.id
  const result = await getCheckoutData({ memberId })
  res.status(result.code).json(result)
})

/**
 * POST /checkout - 執行結帳並創建訂單
 * 這是整個電商系統最複雜的操作，包含：
 * 1. 最終庫存檢查
 * 2. 創建訂單和訂單項目
 * 3. 更新商品庫存
 * 4. 清空購物車
 * 5. 生成訂單編號和發票
 *
 * 請求主體: { orderData: {...} }
 * orderData 包含收件人資訊、付款方式、配送方式等
 */
router.post('/checkout', async (req, res) => {
  const memberId = req.user.id

  // === 步驟1：結帳前的最後檢查 ===
  // 驗證購物車狀態和庫存
  const cartResult = await prepareCheckout({ memberId })
  if (!cartResult.success) {
    return res.status(cartResult.code).json(cartResult)
  }

  // === 步驟2：整理購物車項目資訊 ===
  // 從完整的購物車資訊中提取出訂單所需的簡單資訊
  const cartItems = cartResult.data.cart.cartItems.map((item) => ({
    productId: item.productId, // 商品ID
    quantity: item.quantity, // 購買數量
  }))

  // === 步驟3：創建訂單 ===
  const result = await createUserOrder({
    memberId: parseInt(memberId),
    orderData: req.body.orderData, // 收件人、付款、配送資訊
    cartItems, // 購買的商品列表
  })
  res.status(result.code).json(result)
})

export default router
