import express from 'express'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import {
  listTeams,
  createTeam,
  getTeamDetailsById,
  getMyTeams,
  getTeamManagementData, // <-- 新增
  updateTeamDetails, // <-- 新增
} from '../../services/team/index.js'

const router = express.Router()

// --- GET 請求 ---

// GET /api/team/teams (取得所有隊伍列表)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, sortBy = 'newest' } = req.query
    const result = await listTeams({ page, limit, sortBy })
    res.json(result)
  } catch (err) {
    console.error('GET /api/team/teams error:', err)
    res.status(500).json({ error: '載入隊伍列表失敗' })
  }
})

// GET /api/team/teams/ourteam (取得我的隊伍)
// (這個路徑比 /:id 更具體，所以要放在前面)
router.get('/ourteam', jwtMiddleware, async (req, res) => {
  try {
    // 從 req.user 中獲取由 jwtMiddleware 解碼出來的使用者 ID
    // req.user 是在 jwtMiddleware 成功驗證 token 後，附加到 req 物件上的
    const userId = req.user.id

    if (!userId) {
      return res.status(401).json({ error: '使用者未登入或 Token 無效' })
    }

    const { page = 1, limit = 12 } = req.query
    // 將動態獲取的 userId 傳遞給 service 函式
    const result = await getMyTeams({ userId, page, limit })
    res.json(result)
  } catch (err) {
    console.error('GET /api/team/teams/ourteam 發生錯誤:', err)
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '無效的 Token' })
    }
    res.status(500).json({ error: '載入我的隊伍列表失敗' })
  }
})

// GET /api/team/teams/test (測試路由)
router.get('/test', (req, res) => {
  res.status(200).json({ message: '測試成功，teams.js 路由檔案正常運作！' })
})

// --- 新增：GET /api/team/teams/:id/management ---
// (這個路徑比 /:id 更具體，所以要放在 /:id 的前面)
router.get('/:id/management', async (req, res) => {
  try {
    // 假設您有一個方法可以從 req 中獲取當前登入使用者的 ID
    const requesterId = 1 // 暫時寫死測試用的 user ID
    const { id: teamId } = req.params
    const result = await getTeamManagementData({ teamId, requesterId })
    res.json(result)
  } catch (err) {
    res.status(403).json({ error: err.message })
  }
})

// GET /api/team/teams/:id (取得單一隊伍詳情)
// (這個路徑是動態的，所以要放在所有具體 GET 路徑的最後面)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await getTeamDetailsById(id)
    if (result.success) {
      res.status(200).json(result)
    } else {
      res.status(result.code || 404).json(result)
    }
  } catch (err) {
    console.error(`[後端] GET /api/team/teams/${req.params.id} 發生錯誤:`, err)
    res.status(500).json({ error: '載入隊伍詳細資料失敗' })
  }
})

// --- POST 請求 ---

// POST /api/team/teams (建立新隊伍)
router.post('/', jwtMiddleware, async (req, res) => {
  try {
    // 從 req.user 中獲取由 jwtMiddleware 解碼出來的使用者 ID
    const creatorId = req.user.id

    // 將 creatorId 和 request body 一併傳遞給 service 函式
    const result = await createTeam({ ...req.body, creatorId })
    res.status(result.code || 201).json(result)
  } catch (err) {
    console.error('POST /api/team/teams error:', err)
    res.status(500).json({ error: '建立隊伍失敗' })
  }
})

// --- 新增：PUT /api/team/teams/:id (更新隊伍資訊) ---
router.put('/:id', async (req, res) => {
  try {
    const requesterId = 1 // 暫時寫死測試用的 user ID
    const { id: teamId } = req.params
    const result = await updateTeamDetails({
      teamId,
      requesterId,
      data: req.body,
    })
    res.json(result)
  } catch (err) {
    res.status(403).json({ error: err.message })
  }
})

export default router
