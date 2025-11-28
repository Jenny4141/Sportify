/**
 * 商品路由 - 處理商品相關的 HTTP 請求
 *
 * 主要功能：
 * - 商品列表查詢 (支援分頁、搜尋、篩選、排序)
 * - 單一商品詳情查詢 (含收藏狀態)
 * - 商品訂單列表 (管理用)
 *
 * 特色：
 * - 使用可選的 JWT 驗證 (未登入也可瀏覽商品)
 * - 如有登入會附加用戶ID來判斷收藏狀態
 * - 支援多種查詢參數 (關鍵字、品牌、運動類型等)
 */

import express from 'express'
import {
  getAllProducts, // 獲取商品列表 (支援分頁和篩選)
  getProductById, // 獲取單一商品詳情
  getAllProductsOrders, // 獲取所有商品的訂單統計 (管理功能)
} from '../../services/shop/product.js'
import { optionalJwtMiddleware } from '../../utils/jwt-middleware.js' // 可選的 JWT 驗證

const router = express.Router()

// === 全局中間件：可選的 JWT 驗證 ===
// 允許未登入用戶瀏覽商品，但如果有登入會提供更多個人化資訊 (如收藏狀態)
router.use(optionalJwtMiddleware)

/**
 * GET / - 獲取商品列表 (支援分頁、搜尋、篩選)
 *
 * 查詢參數：
 * - page: 頁碼 (預設 1)
 * - perPage: 每頁商品數量 (預設 12)
 * - keyword: 搜尋關鍵字 (商品名稱、品牌)
 * - brandId: 品牌篩選
 * - sportId: 運動類型篩選
 * - sort: 排序方式 (price_asc, price_desc, newest, popular)
 * - minPrice: 最低價格
 * - maxPrice: 最高價格
 *
 * 回傳格式：
 * - data: 商品陣列 (含品牌、運動類型、第一張圖片)
 * - pagination: 分頁資訊 (總頁數、目前頁數等)
 * - filters: 可用的篩選選項 (品牌列表、運動類型列表)
 */
router.get('/', async (req, res) => {
  const userId = req.user?.id // 從 JWT 取得用戶ID (可能為空)

  // 將查詢參數和用戶ID傳遞給服務層
  const result = await getAllProducts({
    ...req.query, // 包含所有查詢參數
    userId, // 用於判斷收藏狀態
  })

  res.status(result.code).json(result)
})

/**
 * GET /list - 獲取簡化的商品訂單列表 (管理用途)
 *
 * 主要用於：
 * - 後台管理系統的商品列表
 * - 訂單統計和分析
 * - 不包含完整的商品詳情，只有基本資訊
 *
 * 注意：此端點可能需要管理員權限，目前為測試用途
 */
router.get('/list', async (req, res) => {
  const result = await getAllProductsOrders()
  res.status(result.code).json(result)
})

/**
 * GET /:id - 獲取單一商品的完整詳情
 *
 * 路徑參數：
 * - id: 商品ID (必須是有效的正整數)
 *
 * 回傳內容：
 * - 商品完整資訊 (名稱、價格、庫存、材質、尺寸等)
 * - 品牌和運動類型資訊
 * - 所有商品圖片
 * - 收藏狀態 (如果用戶已登入)
 * - 推薦相關商品
 *
 * 用於：
 * - 商品詳情頁面的資料來源
 * - 購物車、收藏功能的基礎資料
 */
router.get('/:id', async (req, res) => {
  const userId = req.user?.id // 登入用戶ID (用於判斷收藏狀態)

  const result = await getProductById({
    id: parseInt(req.params.id), // 確保ID為數字
    userId, // 傳遞用戶ID以獲取個人化資訊
  })

  res.status(result.code).json(result)
})

export default router
