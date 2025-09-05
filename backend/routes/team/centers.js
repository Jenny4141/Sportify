// routes/team/centers.js
// 這個新檔案專門用來提供場館列表

import express from 'express'
import { getCentersBySport } from '../../services/team/index.js'

const router = express.Router()

// 處理 GET /api/team/centers 請求
router.get('/', async (req, res) => {
  try {
    // 從查詢參數中取得 sportId，以便篩選
    const sportId = req.query.sportId ? parseInt(req.query.sportId, 10) : null
    const rows = await getCentersBySport(sportId)
    res.json({ rows })
  } catch (err) {
    console.error('GET /api/team/centers 發生錯誤:', err)
    res.status(500).json({ error: '載入場館列表失敗' })
  }
})

export default router
