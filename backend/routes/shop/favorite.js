/**
 * 商品收藏路由 - 處理用戶收藏功能的 HTTP 請求
 *
 * 核心功能：
 * - 切換商品收藏狀態 (收藏/取消收藏)
 * - 查詢用戶的收藏商品列表
 *
 * 特色：
 * - 所有操作都需要登入 (強制 JWT 驗證)
 * - 支援愛心按鈕的快速切換
 * - 提供完整的收藏商品資訊供前端展示
 *
 * 使用場景：
 * - 商品詳情頁的愛心按鈕
 * - 商品卡片的收藏功能
 * - 會員中心的「我的收藏」頁面
 */

import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js' // 強制 JWT 驗證
import {
  toggleFavorite, // 切換收藏狀態 (收藏 ↔ 取消收藏)
  getFavoritesOfMember, // 獲取會員的所有收藏商品
} from '../../services/shop/favorite.js'

const router = express.Router()

// === 全局中間件：強制 JWT 驗證 ===
// 收藏功能只對已登入的用戶開放
// 未登入用戶訪問時會收到 401 錯誤
router.use(jwtMiddleware)

/**
 * POST /:productId/toggle - 切換指定商品的收藏狀態
 *
 * 路徑參數：
 * - productId: 商品ID (必須是有效的正整數)
 *
 * 功能行為：
 * - 如果商品未收藏 → 加入收藏
 * - 如果商品已收藏 → 移除收藏
 * - 自動檢查商品是否存在
 * - 防止重複收藏同一商品
 *
 * 回傳格式：
 * - favorited: boolean (目前的收藏狀態)
 * - message: 操作結果訊息
 *
 * 前端使用：
 * - 愛心按鈕的點擊事件
 * - 商品卡片的收藏切換
 * - 即時更新 UI 狀態 (紅心 ↔ 空心)
 */
router.post('/:productId/toggle', async (req, res) => {
  const userId = req.user.id // 從 JWT token 獲取已驗證的用戶ID

  const result = await toggleFavorite({
    productId: parseInt(req.params.productId), // 確保商品ID為數字
    userId, // 用戶ID
  })

  res.status(result.code).json(result)
})

/**
 * GET /member - 獲取當前登入用戶的所有收藏商品
 *
 * 回傳內容：
 * - 收藏商品的完整資訊 (名稱、價格、圖片等)
 * - 按收藏時間倒序排列 (最新收藏在前)
 * - 包含商品的品牌和運動類型資訊
 * - 庫存狀態 (用於判斷是否可購買)
 *
 * 使用場景：
 * - 會員中心的「我的收藏」頁面
 * - 用戶的個人收藏清單
 * - 收藏商品的批量操作 (移除、加入購物車等)
 *
 * 分頁考量：
 * - 目前回傳全部收藏，未來可考慮加入分頁功能
 * - 對於收藏數量龐大的用戶可能需要優化
 */
router.get('/member', async (req, res) => {
  const memberId = req.user.id // 從 JWT token 獲取會員ID

  const result = await getFavoritesOfMember(memberId)

  res.status(result.code).json(result)
})

export default router
