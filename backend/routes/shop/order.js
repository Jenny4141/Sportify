/**
 * 訂單路由 - 處理用戶訂單查詢的 HTTP 請求
 *
 * 主要功能：
 * - 查詢用戶的所有訂單 (按時間倒序)
 * - 查詢單一訂單的完整詳情
 * - 提供訂單狀態追蹤資訊
 *
 * 安全性：
 * - 強制要求 JWT 身份驗證
 * - 只能查詢自己的訂單 (透過 memberId 限制)
 * - 防止跨用戶的訂單資料洩漏
 *
 * 使用場景：
 * - 會員中心的「我的訂單」頁面
 * - 訂單詳情頁面
 * - 訂單狀態追蹤
 */

import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js' // 強制 JWT 驗證
import {
  getOrderById, // 獲取單一訂單詳情 (含商品資訊)
  getOrdersOfMember, // 獲取會員的所有訂單列表
} from '../../services/shop/order.js'

const router = express.Router()

// === 全局中間件：強制 JWT 驗證 ===
// 訂單資料屬於敏感資訊，只允許已登入用戶存取
// 未登入用戶會收到 401 Unauthorized 錯誤
router.use(jwtMiddleware)

/**
 * GET /orders - 獲取當前用戶的所有訂單列表
 *
 * 回傳內容：
 * - 訂單基本資訊 (訂單編號、日期、總金額、狀態)
 * - 按建立時間倒序排列 (最新訂單在前)
 * - 訂單狀態資訊 (待付款、已付款、配送中、已完成等)
 * - 付款和配送方式的簡要資訊
 *
 * 分頁處理：
 * - 目前回傳所有訂單，未來可考慮加入分頁
 * - 對於訂單量大的用戶需要效能優化
 *
 * 使用場景：
 * - 會員中心的訂單歷史頁面
 * - 訂單列表的概覽展示
 */
router.get('/orders', async (req, res) => {
  // 從 JWT token 取得已驗證的會員ID
  const memberId = req.user.id

  const result = await getOrdersOfMember(memberId)
  res.status(result.code).json(result)
})

/**
 * GET /member - 獲取會員訂單列表 (與 /orders 相同功能)
 *
 * 注意：這是一個重複的端點，與 GET /orders 功能相同
 * 可能是為了向後兼容性而保留，或是不同前端頁面的不同調用方式
 *
 * 建議：未來可考慮統一為單一端點以避免混淆
 */
router.get('/member', async (req, res) => {
  const memberId = req.user.id

  const result = await getOrdersOfMember(memberId)
  res.status(result.code).json(result)
})

/**
 * GET /:id - 獲取指定訂單的完整詳細資訊
 *
 * 路徑參數：
 * - id: 訂單ID (必須是有效的正整數)
 *
 * 安全檢查：
 * - 驗證訂單屬於當前登入用戶
 * - 不允許查看他人的訂單資料
 *
 * 回傳內容：
 * - 訂單完整資訊 (編號、日期、收件人、地址等)
 * - 所有訂單項目 (商品名稱、數量、價格)
 * - 商品詳細資訊 (圖片、品牌、規格等)
 * - 付款狀態和付款方式詳情
 * - 配送狀態和物流資訊
 * - 發票資訊
 *
 * 使用場景：
 * - 訂單詳情頁面
 * - 訂單確認頁面
 * - 客服查詢和問題處理
 */
router.get('/:id', async (req, res) => {
  const memberId = req.user.id // 當前登入用戶ID

  const result = await getOrderById({
    id: parseInt(req.params.id), // 確保訂單ID為數字
    memberId, // 用於安全驗證，確保只能查看自己的訂單
    dataOptions: {
      includeProductDetails: true, // 前台需要完整的商品資訊 (圖片、品牌等)
    },
  })

  res.status(result.code).json(result)
})

export default router
