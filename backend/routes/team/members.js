import express from 'express'
import { kickTeamMember } from '../../services/team/index.js'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'

const router = express.Router()

// DELETE /api/team/members/:teamId/:memberId
router.delete('/:teamId/:memberId', jwtMiddleware, async (req, res) => {
  try {
    // 從 JWT 中獲取當前登入者的資訊
    const requester = req.user
   
    if (!requester || !requester.id) {
      return res
        .status(401)
        .json({ success: false, error: '無效的 Token 或缺少使用者 ID' })
    }

    const { teamId, memberId: memberIdToKick } = req.params

    const result = await kickTeamMember({
      teamId,
      memberIdToKick,
      requesterId: requester.id,
    })
    res
      .status(200)
      .json({ success: true, message: '成員已成功踢除', data: result })
  } catch (err) {
    res.status(403).json({ success: false, error: err.message })
  }
})

export default router
