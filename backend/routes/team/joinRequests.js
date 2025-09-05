import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js' // 引入 JWT 中介軟體
import {
  createJoinRequest,
  reviewJoinRequest,
} from '../../services/team/index.js'

const router = express.Router()

router.get('/test', (req, res) => {
  res.status(200).json({ message: '測試成功，joinRequests.js 路由檔案正常運作！' });
});

// POST /api/team/join-requests (使用者發送加入申請)
router.post('/', jwtMiddleware, async (req, res) => {
  // <-- 加入 jwtMiddleware
  try {
    const memberId = req.user.id // <-- 從 JWT 動態獲取 ID
    const { teamId } = req.body
    const result = await createJoinRequest({ teamId, memberId })
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/team/join-requests/:id (隊長審核申請)
router.put('/:id', jwtMiddleware, async (req, res) => {
  // <-- 加入 jwtMiddleware
  try {
    const requesterId = req.user.id // <-- 從 JWT 動態獲取 ID
    const { id: requestId } = req.params
    const { status } = req.body
    const result = await reviewJoinRequest({ requestId, requesterId, status })
    res.json(result)
  } catch (err) {
    res.status(403).json({ error: err.message })
  }
})

export default router
