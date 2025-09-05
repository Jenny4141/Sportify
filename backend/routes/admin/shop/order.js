import express from 'express'
const router = express.Router()
import upload from '../../../utils/upload-imgs.js'
import {
  getAllOrders,
  getOrderById,
  createAdminOrder,
  updateOrder,
  deleteOrder,
} from '../../../services/shop/order.js'
import {
  getDeliveryData,
  getPaymentData,
  getInvoiceData,
  getStatusData,
} from '../../../services/common.js'

// 取得訂單資料
router.get('/', async (req, res) => {
  const result = await getAllOrders(req)
  res.status(result.code).json(result)
})
// 新增訂單
router.post('/', upload.none(), async (req, res) => {
  const result = await createAdminOrder(req)
  res.status(result.code).json(result)
})
// 取得物流方式
router.get('/delivery', async (req, res) => {
  const result = await getDeliveryData()
  res.status(result.code).json(result)
})
// 取得付款方式
router.get('/payment', async (req, res) => {
  const result = await getPaymentData()
  res.status(result.code).json(result)
})
// 取得發票類型
router.get('/invoice', async (req, res) => {
  const result = await getInvoiceData()
  res.status(result.code).json(result)
})
// 取得訂單狀態
router.get('/status', async (req, res) => {
  const result = await getStatusData()
  res.status(result.code).json(result)
})
// 取得單筆訂單 (後台管理)
router.get('/:id', async (req, res) => {
  const orderId = req.params.id

  // 驗證 ID 參數
  if (!orderId || isNaN(parseInt(orderId))) {
    return res.status(400).json({
      code: 400,
      success: false,
      message: '無效的訂單 ID',
    })
  }

  const result = await getOrderById({ id: orderId })
  res.status(result.code).json(result)
})
// 更新訂單 (後台管理)
router.put('/:id', async (req, res) => {
  const result = await updateOrder({
    id: parseInt(req.params.id),
    body: req.body,
  })
  res.status(result.code).json(result)
})
// 刪除訂單 (後台管理)
router.delete('/:id', async (req, res) => {
  const result = await deleteOrder({ orderId: parseInt(req.params.id) })
  res.status(result.code).json(result)
})

export default router
