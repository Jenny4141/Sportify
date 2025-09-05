import express from 'express'
import {
  getListData,
  getItemData,
  createCenter,
  updateCenter,
  deleteCenter,
  deleteMultipleCenters,
} from '../../../services/venue/center.js'
import {
  addRating,
  getCenterRatings,
  getMemberRating,
  deleteRating,
  getRatingStats,
} from '../../../services/venue/rating.js'
import { jwtMiddleware } from '../../../utils/jwt-middleware.js'
import uploadCenterImgs from '../../../utils/upload-center-imgs.js'

const router = express.Router()

// ========================= API 的路由 =========================

// #region 取得列表資料
router.get('/', async (req, res) => {
  const { page, keyword, orderby, perPage, locationId, sportId, minRating } =
    req.query
  const result = await getListData({
    page: +page || 1,
    keyword,
    orderby,
    perPage: +perPage || 10,
    locationId: locationId ? +locationId : null,
    sportId: sportId ? +sportId : null,
    minRating: minRating ? +minRating : null,
  })
  res.status(result.code).json(result)
})

// #region 取得單筆資料
router.get('/:id', async (req, res) => {
  const id = +req.params.id
  const result = await getItemData(id)
  res.status(result.code).json(result)
})

// #region 新增資料的 API (支援圖片上傳)
router.post('/', uploadCenterImgs.array('images', 10), async (req, res) => {
  try {
    // 處理上傳的圖片
    const images = req.files
      ? req.files.map((file) => ({
          filename: file.filename,
          url: `/center-imgs/${file.filename}`,
        }))
      : []

    // 處理運動項目ID
    let sportIds = []
    if (req.body.sportIds) {
      try {
        sportIds = Array.isArray(req.body.sportIds)
          ? req.body.sportIds.map((id) => +id)
          : JSON.parse(req.body.sportIds)
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '運動項目格式錯誤',
        })
      }
    }

    const centerData = {
      ...req.body,
      locationId: +req.body.locationId,
      latitude: req.body.latitude ? +req.body.latitude : undefined,
      longitude: req.body.longitude ? +req.body.longitude : undefined,
      sportIds,
      images,
    }

    const result = await createCenter(centerData)
    res.status(result.code).json(result)
  } catch (error) {
    console.error('Upload center error:', error)
    res.status(500).json({ success: false, message: '上傳失敗' })
  }
})

// #region 編輯資料的 API (支援圖片上傳)
router.put('/:id', uploadCenterImgs.array('images', 10), async (req, res) => {
  try {
    const id = +req.params.id

    // 處理上傳的圖片
    const images =
      req.files && req.files.length > 0
        ? req.files.map((file) => ({
            filename: file.filename,
            url: `/center-imgs/${file.filename}`,
          }))
        : []

    // 處理運動項目ID
    let sportIds = []
    if (req.body.sportIds) {
      try {
        sportIds = Array.isArray(req.body.sportIds)
          ? req.body.sportIds.map((id) => +id)
          : JSON.parse(req.body.sportIds)
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '運動項目格式錯誤',
        })
      }
    }

    const centerData = {
      ...req.body,
      locationId: +req.body.locationId,
      latitude: req.body.latitude ? +req.body.latitude : undefined,
      longitude: req.body.longitude ? +req.body.longitude : undefined,
      sportIds,
      images,
      keepExistingImages: req.body.keepExistingImages === 'true',
    }

    const result = await updateCenter(id, centerData)
    res.status(result.code).json(result)
  } catch (error) {
    console.error('Update center error:', error)
    res.status(500).json({ success: false, message: '更新失敗' })
  }
})

// #region 多選刪除資料的 API
router.delete('/multi', async (req, res) => {
  const result = await deleteMultipleCenters(req.body.checkedItems)
  res.status(result.code).json(result)
})

// #region 刪除資料的 API
router.delete('/:id', async (req, res) => {
  const result = await deleteCenter(+req.params.id)
  res.status(result.code).json(result)
})

// ========================= 評分相關 API =========================

// #region 新增/更新評分 (需要登入)
router.post('/:centerId/rating', jwtMiddleware, async (req, res) => {
  const { centerId } = req.params
  const { rating, comment } = req.body
  const memberId = req.user.id

  const result = await addRating(centerId, memberId, rating, comment)
  res.status(result.code).json(result)
})

// #region 取得運動中心的所有評分
router.get('/:centerId/ratings', async (req, res) => {
  const { centerId } = req.params
  const { page = 1, perPage = 10 } = req.query

  const result = await getCenterRatings(centerId, page, perPage)
  res.status(result.code).json(result)
})

// #region 取得會員對特定運動中心的評分 (需要登入)
router.get('/:centerId/my-rating', jwtMiddleware, async (req, res) => {
  const { centerId } = req.params
  const memberId = req.user.id

  const result = await getMemberRating(centerId, memberId)
  res.status(result.code).json(result)
})

// #region 刪除評分 (需要登入)
router.delete('/:centerId/rating', jwtMiddleware, async (req, res) => {
  const { centerId } = req.params
  const memberId = req.user.id

  const result = await deleteRating(centerId, memberId)
  res.status(result.code).json(result)
})

// #region 取得運動中心評分統計
router.get('/:centerId/rating-stats', async (req, res) => {
  const { centerId } = req.params

  const result = await getRatingStats(centerId)
  res.status(result.code).json(result)
})

export default router
