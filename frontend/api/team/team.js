import { apiClient } from '@/api/axios'

export const teamService = {
  /**
   * 取得隊伍列表 (含分頁、排序)
   * 對應後端 GET /api/team/teams
   */
  fetchAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const res = await apiClient.get(`/team/teams?${query}`)
    return res.data
  },

  /**
   * 取得單一隊伍詳細資料
   * 對應後端 GET /api/team/teams/:id
   */
  fetchById: async (id) => {
    const res = await apiClient.get(`/team/teams/${id}`)
    return res.data
  },

  /**
   * 建立新隊伍
   * 對應後端 POST /api/team/teams
   */
  create: async (data) => {
    // 修正：POST 請求的網址是資源的根路徑
    const res = await apiClient.post('/team/teams', data);
    return res.data;
  },

  // --- 請確認這一段 fetchMyTeams 函式存在 ---
  /**
   * 取得我加入的隊伍
   * 對應後端 GET /api/team/teams/ourteam
   */
  fetchMyTeams: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    // 將路徑從 /team/ourteam 改為 /team/teams/ourteam
    const res = await apiClient.get(`/team/teams/ourteam?${query}`)
    return res.data
  },
  /**
   * 審核加入隊伍的申請 (限隊長)
   * 對應後端 PUT /api/team/join-requests/:id
   * @param {string} requestId - 申請紀錄的 ID
   * @param {object} data - 包含狀態的物件, e.g., { status: 'APPROVED' }
   */
  reviewRequest: async (requestId, data) => {
    const res = await apiClient.put(`/team/join-requests/${requestId}`, data)
    return res.data
  },

  /**
   * 從隊伍中踢除成員 (限隊長)
   * 對應後端 DELETE /api/team/members/:memberId
   * @param {string} teamMemberId - "TeamMember" 紀錄的 ID
   */
  kickMember: async (teamId, memberId) => {
    // --- 【修改這裡的函式】 ---
    // 現在需要傳入 teamId 和 memberId
    const res = await apiClient.delete(`/team/members/${teamId}/${memberId}`)
    return res.data
  },
  /**
   * 儲存或更新日曆記事
   * 對應後端 POST /api/team/calendar-marks
   * @param {object} data - e.g., { teamId, date, note }
   */
  saveCalendarMark: async (data) => {
    const res = await apiClient.post('/team/calendar-marks', data);
    return res.data;
  },
  /**
   * 刪除日曆記事
   * 對應後端 DELETE /api/team/calendar-marks/:markId
   * @param {string} markId - TeamCalendarMark 的 ID
   */
  deleteCalendarMark: async (markId) => {
    const res = await apiClient.delete(`/team/calendar-marks/${markId}`);
    return res.data;
  },

   /**
   * 新增一則隊伍留言
   * 對應後端 POST /api/team/messages
   * @param {object} data - e.g., { teamId, content }
   */
  addMessage: async (data) => {
    const res = await apiClient.post('/team/messages', data);
    return res.data;
  },
   /**
   * 建立加入隊伍的申請
   * 對應後端 POST /api/team/join-requests
   * @param {string} teamId - 要申請加入的隊伍 ID
   */
  createJoinRequest: async (teamId) => {
    const res = await apiClient.post('/team/join-requests', { teamId })
    return res.data
  },
}

