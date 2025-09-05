// ... 您原有的 fetchMemberOptions, fetchStatusOptions 等函式
import { apiClient } from '@/api/axios'
/**
 * 取得運動選項
 * 對應後端 GET /api/team/sports
 */
export const fetchTeamSportOptions = async () => {
  const res = await apiClient.get('/team/sports')
  return res.data
}

/**
 * 取得等級選項
 * 對應後端 GET /api/team/levels
 */
export const fetchTeamLevelOptions = async () => {
  const res = await apiClient.get('/team/levels')
  return res.data
}

/**
 * 取得"所有"場館選項
 * 對應後端 GET /api/team/centers (不帶 sportId)
 */
export const fetchAllTeamCenterOptions = async () => {
  // 直接呼叫 API，不帶任何參數
  const res = await apiClient.get('/team/centers')
  return res.data
}
