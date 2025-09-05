// routes/team/messages.js

import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import { addTeamMessage } from '../../services/team/index.js'

const router = express.Router()

// POST /api/team/messages (新增一則留言)
router.post('/', jwtMiddleware, async (req, res) => {
  try {
    const requesterId = req.user.id
    const { teamId, content } = req.body

    if (!teamId || !content) {
      return res
        .status(400)
        .json({ success: false, error: '缺少 teamId 或 content' })
    }

    const result = await addTeamMessage({ teamId, requesterId, content })
    res.status(201).json({ success: true, data: result })
  } catch (err) {
    res.status(403).json({ success: false, error: err.message })
  }
})

export default router
