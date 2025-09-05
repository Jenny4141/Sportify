// routes/team/calendarMarks.js

import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import {
  createOrUpdateCalendarMark,
  deleteCalendarMark,
} from '../../services/team/index.js'

const router = express.Router()

// POST /api/team/calendar-marks (新增或更新一筆日曆記事)
router.post('/', jwtMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.id
    // 從 request body 中獲取 teamId, date, note
    const { teamId, date, note } = req.body

    if (!teamId || !date) {
      return res
        .status(400)
        .json({ success: false, error: '缺少 teamId 或 date' })
    }

    const result = await createOrUpdateCalendarMark({
      teamId,
      requesterId,
      date,
      note,
    })
    res.status(200).json({ success: true, data: result })
  } catch (err) {
    res.status(403).json({ success: false, error: err.message })
  }
})
// --- 【新增這條 DELETE 路由】 ---
// DELETE /api/team/calendar-marks/:markId (刪除一筆日曆記事)
router.delete('/:markId', jwtMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.id
    const { markId } = req.params

    const result = await deleteCalendarMark({ markId, requesterId })
    res.status(200).json({ success: true, message: '記事已刪除', data: result })
  } catch (err) {
    res.status(403).json({ success: false, error: err.message })
  }
})
export default router
