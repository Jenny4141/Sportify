import express from 'express'
import upload from '../../../utils/upload-imgs.js'
import {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProductsOrders,
  getBrandData,
  getSportData,
} from '../../../services/shop/product.js'
import { deleteImage } from '../../../services/shop/image.js'
const router = express.Router()

// 取得商品資料(分頁、搜尋)
router.get('/', async (req, res) => {
  // 從JWT token中取得使用者ID (如果有登入的話)
  const userId = req.user ? req.user.id : null
  const result = await getAllProducts({ ...req.query, userId })
  res.status(result.code).json(result)
})
// 取得商品資料(for 訂單管理)
router.get('/list', async (req, res) => {
  const result = await getAllProductsOrders()
  res.status(result.code).json(result)
})
// 取得品牌資料
router.get('/sport', async (req, res) => {
  const result = await getSportData()
  res.status(result.code).json(result)
})
// 取得運動種類資料
router.get('/brand', async (req, res) => {
  const result = await getBrandData()
  res.status(result.code).json(result)
})
// 新增商品
router.post('/', upload.array('images'), async (req, res) => {
  const result = await createProduct({ body: req.body, files: req.files })
  res.status(result.code).json(result)
})
// 用 ID 查詢單一商品
router.get('/:id', async (req, res) => {
  const result = await getProductById({ id: parseInt(req.params.id) })
  res.status(result.code).json(result)
})
// 更新商品
router.put('/:id', upload.array('images'), async (req, res) => {
  const result = await updateProduct({
    id: parseInt(req.params.id),
    body: req.body,
    files: req.files,
  })
  res.status(result.code).json(result)
})
// 刪除商品
router.delete('/:id', async (req, res) => {
  const result = await deleteProduct({ id: parseInt(req.params.id) })
  res.status(result.code).json(result)
})
// 刪除商品圖片
router.delete('/image/:id', async (req, res) => {
  const result = await deleteImage({ imageId: +req.params.id })
  res.status(result.code).json(result)
})

export default router
