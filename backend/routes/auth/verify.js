import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import { getItemData } from '../../services/member.js'
const router = express.Router()

router.get('/', jwtMiddleware, async (req, res) => {
  try {
    // 使用 getItemData 取得完整的用戶資料
    const result = await getItemData(req.user.id)

    if (result.success) {
      res.json({ success: true, user: result.record })
    } else {
      res.json({ success: true, user: req.user })
    }
  } catch (error) {
    console.error('取得用戶資料錯誤:', error)
    // 如果發生錯誤，回傳 JWT 中的基本資料
    res.json({ success: true, user: req.user })
  }
})

export default router
