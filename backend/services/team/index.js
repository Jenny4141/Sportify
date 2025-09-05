import prisma from '../../lib/prisma.js'

// 取得運動類別
export async function getSports() {
  const sports = await prisma.sport.findMany({ orderBy: { id: 'asc' } })
  return { rows: sports }
}

// 取得階級程度
export async function getLevels() {
  const levels = await prisma.level.findMany({ orderBy: { id: 'asc' } })
  return { rows: levels }
}

// 根據運動ID取得場館
export async function getCentersBySport(sportId) {
  // 如果沒有 sportId，就查詢所有的 Center
  if (!sportId) {
    const allCenters = await prisma.center.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    })
    return { rows: allCenters }
  }

  // 如果有 sportId，維持原有的篩選邏輯
  const centers = await prisma.center.findMany({
    where: { courts: { some: { sportId: Number(sportId) } } },
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  })
  return { rows: centers }
}

// 建立隊伍
export async function createTeam(teamData) {
  const { name, levelId, centerId, sportId, schedules, creatorId } = teamData

  if (!name || !levelId || !centerId || !sportId || !creatorId) {
    return {
      success: false,
      error: '隊伍基本欄位或創建者資訊不完整。',
      code: 400,
    }
  }
  if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
    return { success: false, error: '請至少提供一個練習時段。', code: 400 }
  }

  try {
    // --- 新增的邏輯：開始 ---
    // 1. 根據 sportId 查找對應的運動，並只選取 iconKey 欄位
    const sport = await prisma.sport.findUnique({
      where: { id: Number(sportId) },
      select: { iconKey: true },
    })

    // 2. 如果找不到運動或 iconKey，回傳錯誤
    if (!sport || !sport.iconKey) {
      return {
        success: false,
        error: '找不到對應的運動資訊，無法設定封面圖片。',
        code: 404,
      }
    }

    const coverImageUrl = `${sport.iconKey}.jpg` // --- 新增的邏輯：結束 ---

    const firstMatchingCourt = await prisma.court.findFirst({
      where: { centerId: Number(centerId), sportId: Number(sportId) },
    })

    if (!firstMatchingCourt) {
      return {
        success: false,
        error: '在此場館中找不到符合所選運動的場地，請確認。',
        code: 404,
      }
    }

    // 舊的 placehold.co 邏輯已被上面的新邏輯取代

    const newTeam = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: name.trim(),
          levelId: Number(levelId),
          courtId: firstMatchingCourt.id,
          isFeatured: true,
          coverImageUrl: coverImageUrl, // <-- 現在這裡會寫入像 /team-imgs/basketball.jpg 這樣的路徑
        },
      })

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          memberId: creatorId,
          isCaptain: true,
        },
      })

      const schedulesWithTeamId = schedules.map((sch) => ({
        teamId: team.id,
        dayOfWeek: sch.dayOfWeek,
        startTime: new Date(`1970-01-01T${sch.startTime}:00Z`),
        endTime: new Date(`1970-01-01T${sch.endTime}:00Z`),
      }))

      await tx.practiceSchedule.createMany({
        data: schedulesWithTeamId,
      })

      return team
    })

    return { success: true, team: newTeam, code: 201 }
  } catch (error) {
    console.error('建立隊伍時發生錯誤:', error)
    if (error.code === 'P2002') {
      return { success: false, error: '此隊伍名稱已存在。', code: 409 }
    }
    return {
      success: false,
      error: '建立隊伍時發生未知伺服器錯誤。',
      code: 500,
    }
  }
}
// 取得隊伍列表
export async function listTeams({ page = 1, limit = 12, sortBy = 'newest' }) {
  try {
    const pageNum = Number(page)
    const limitNum = Number(limit)
    const offset = (pageNum - 1) * limitNum

    let orderBy = {}
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'members_desc':
        orderBy = { TeamMember: { _count: 'desc' } }
        break
      case 'members_asc':
        orderBy = { TeamMember: { _count: 'asc' } }
        break
      case 'level_desc':
        orderBy = { levelId: 'desc' }
        break
      case 'level_asc':
        orderBy = { levelId: 'asc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // 【日誌 2】
    const teams = await prisma.team.findMany({
      skip: offset,
      take: limitNum,
      orderBy: orderBy,
      include: {
        _count: {
          select: { TeamMember: true },
        },
        level: { select: { name: true } },
        court: {
          include: {
            sport: { select: { name: true, iconKey: true } },
            center: { select: { name: true } },
          },
        },
        // --- ★★★ 修改點 ★★★ ---
        // 將關聯的 schedules 資料一併查詢出來
        schedules: true,
      },
    })

    const totalTeams = await prisma.team.count()

    const totalPages = Math.ceil(totalTeams / limitNum)

    return { teams, totalPages, totalTeams }
  } catch (error) {
    // 【日誌 7】
    console.error(`[Service] listTeams: 執行查詢時發生錯誤:`, error)
    // 將錯誤拋出，讓路由層的 catch 可以捕捉到
    throw error
  }
}

// ===== 請用這段程式碼，完整覆蓋您檔案中現有的 getTeamDetailsById 函式 =====
export async function getTeamDetailsById(id) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: Number(id) },
      include: {
        level: true,
        court: {
          include: {
            sport: true,
            center: true,
          },
        },
        // 保持既有的 TeamMember 查詢
        TeamMember: {
          orderBy: { isCaptain: 'desc' }, // 確保隊長在第一位
          include: {
            member: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        // --- 【新增】一併查詢待處理的加入申請 ---
        joinRequests: {
          where: { status: 'PENDING' },
          include: {
            member: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        messages: {
          // <-- 將 orderBy 和 include 都放在 messages 物件內部
          orderBy: { createdAt: 'asc' },
          include: {
            member: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        calendarMarks: true, // 保持既有的 calendarMarks 查詢
      },
    })

    if (!team) {
      return { success: false, error: '找不到隊伍', code: 404 }
    }
    return { success: true, team }
  } catch (error) {
    console.error('獲取隊伍詳細資料時發生錯誤:', error)
    return { success: false, error: '伺服器內部錯誤', code: 500 }
  }
}

// ===== 【請將此函式新增到檔案的最後】 =====
/**
 * 取得特定使用者所屬的隊伍列表
 * @param {object} params - 包含 userId, page, limit
 * @returns {Promise<{teams: Array<object>, totalPages: number, totalTeams: number}>}
 */
export async function getMyTeams({ userId, page = 1, limit = 12 }) {
  const numericUserId = Number(userId)
  const numericPage = Number(page)
  const numericLimit = Number(limit)
  const skip = (numericPage - 1) * numericLimit

  // 直接查詢 TeamMember 紀錄，並一併 include 隊伍的詳細資訊
  const teamMemberships = await prisma.teamMember.findMany({
    where: { memberId: numericUserId },
    select: {
      isCaptain: true, // ★★★ 關鍵點：直接選取 isCaptain 欄位
      team: {
        // 包含關聯的 team 物件
        include: {
          level: true,
          court: {
            include: {
              center: true,
              sport: { select: { name: true, iconKey: true } }, // <-- 在此加入 iconKey
            },
          },
          _count: {
            // 計算目前成員數
            select: { TeamMember: true },
          },
        },
      },
    },
    take: numericLimit,
    skip: skip,
  })

  // 取得總數以利分頁
  const totalTeams = await prisma.teamMember.count({
    where: { memberId: numericUserId },
  })

  // 整理成前端期望的格式
  const teams = teamMemberships.map((tm) => ({
    ...tm.team, // 將隊伍的所有資訊展開
    memberCount: tm.team._count.TeamMember, // 整理成員數
    isCaptain: tm.isCaptain, // ★★★ 關鍵點：將 isCaptain 附加到隊伍物件上
  }))

  return {
    teams,
    totalPages: Math.ceil(totalTeams / numericLimit),
  }
}

/**
 * 獲取單一隊伍的管理頁面所需全部資料
 * @param {object} params - 包含 teamId 和請求者 requesterId
 * @returns {Promise<object>}
 */
export async function getTeamManagementData({ teamId, requesterId }) {
  try {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: Number(teamId),
        memberId: requesterId,
      },
    })

    if (!membership) {
      throw new Error('無權限存取此隊伍的管理資訊')
    }

    // 主要查詢
    const teamData = await prisma.team.findUnique({
      where: { id: Number(teamId) },
      include: {
        level: true,
        TeamMember: {
          orderBy: { isCaptain: 'desc' },
          include: {
            member: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        joinRequests: {
          where: { status: 'PENDING' },
          include: {
            member: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    if (!teamData) {
      throw new Error('找不到指定的隊伍')
    }

    return teamData
  } catch (error) {
    console.error('[服務層] getTeamManagementData 發生嚴重錯誤:', error)
    // 重新拋出錯誤，這樣路由層才能捕捉到
    throw error
  }
}

/**
 * 更新隊伍資訊 (限隊長)
 * @param {object} params - 包含 teamId, requesterId, 和要更新的 data
 * @returns {Promise<object>}
 */
export async function updateTeamDetails({ teamId, requesterId, data }) {
  const captainMembership = await prisma.teamMember.findFirst({
    where: {
      teamId: Number(teamId),
      memberId: requesterId,
      isCaptain: true, // 確認請求者是隊長
    },
  })

  if (!captainMembership) {
    throw new Error('只有隊長才能修改隊伍資訊')
  }

  const updatedTeam = await prisma.team.update({
    where: { id: Number(teamId) },
    data: {
      levelId: data.levelId ? Number(data.levelId) : undefined,
      description: data.description,
    },
  })

  return updatedTeam
}

/**
 * 建立加入隊伍的申請
 * @param {object} params - 包含 teamId 和申請者 memberId
 * @returns {Promise<object>}
 */
export async function createJoinRequest({ teamId, memberId }) {
  // 檢查是否已為成員
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      uk_tmember_team_member: {
        teamId: Number(teamId),
        memberId: memberId,
      },
    },
  })
  if (existingMember) {
    throw new Error('您已經是該隊伍的成員')
  }

  // 檢查是否已有待處理的申請
  const existingRequest = await prisma.teamJoinRequest.findUnique({
    where: {
      teamId_memberId: {
        teamId: Number(teamId),
        memberId: memberId,
      },
      status: 'PENDING',
    },
  })
  if (existingRequest) {
    throw new Error('您已提交過申請，請耐心等候審核')
  }

  // 建立新申請
  const newRequest = await prisma.teamJoinRequest.create({
    data: {
      teamId: Number(teamId),
      memberId: memberId,
      status: 'PENDING',
    },
  })
  return newRequest
}

/**
 * 審核加入隊伍的申請 (限隊長)
 * @param {object} params - 包含 requestId, requesterId, 和審核 status
 * @returns {Promise<object>}
 */
export async function reviewJoinRequest({ requestId, requesterId, status }) {
  const request = await prisma.teamJoinRequest.findUnique({
    where: { id: Number(requestId) },
  })
  if (!request) {
    throw new Error('找不到此申請紀錄')
  }

  // 驗證審核者是否為隊長
  const captainMembership = await prisma.teamMember.findFirst({
    where: {
      teamId: request.teamId,
      memberId: requesterId,
      isCaptain: true,
    },
  })
  if (!captainMembership) {
    throw new Error('只有隊長才能審核申請')
  }

  // 如果批准，則使用交易同時更新申請狀態並新增成員
  if (status === 'APPROVED') {
    return await prisma.$transaction(async (tx) => {
      // 1. 更新申請狀態
      const updatedRequest = await tx.teamJoinRequest.update({
        where: { id: Number(requestId) },
        data: { status: 'APPROVED' },
      })
      // 2. 新增成員
      await tx.teamMember.create({
        data: {
          teamId: request.teamId,
          memberId: request.memberId,
          isCaptain: false, // 新成員預設不是隊長
        },
      })
      return updatedRequest
    })
  } else {
    // 如果拒絕，僅更新申請狀態
    return await prisma.teamJoinRequest.update({
      where: { id: Number(requestId) },
      data: { status: 'REJECTED' },
    })
  }
}

/**
 * 從隊伍中踢除成員 (限隊長)
 * @param {object} params - 包含 teamId, memberIdToKick, 和請求者 requesterId
 * @returns {Promise<object>}
 */
export async function kickTeamMember({ teamId, memberIdToKick, requesterId }) {
  // 1. 驗證請求者是否為該隊隊長
  const captainMembership = await prisma.teamMember.findFirst({
    where: {
      teamId: Number(teamId),
      memberId: Number(requesterId),
      isCaptain: true,
    },
  })

  if (!captainMembership) {
    throw new Error('只有隊長才能踢除成員')
  }

  // 2. 隊長不能踢除自己
  if (Number(memberIdToKick) === Number(requesterId)) {
    // <--- 確保轉換為數字
    throw new Error('隊長不能踢除自己')
  }

  // 3. 找到要被踢除成員的 TeamMember 紀錄並刪除
  const result = await prisma.teamMember.delete({
    where: {
      uk_tmember_team_member: {
        teamId: Number(teamId),
        memberId: Number(memberIdToKick),
      },
    },
  })

  return result
}

/**
 * 新增或更新隊伍的日曆記事 (限隊長)
 * @param {object} params - 包含 teamId, requesterId, date, note
 * @returns {Promise<object>}
 */
export async function createOrUpdateCalendarMark({
  teamId,
  requesterId,
  date,
  note,
}) {
  // 1. 驗證請求者是否為該隊隊長
  const captainMembership = await prisma.teamMember.findFirst({
    where: {
      teamId: Number(teamId),
      memberId: Number(requesterId),
      isCaptain: true,
    },
  })

  if (!captainMembership) {
    throw new Error('只有隊長才能編輯行事曆')
  }

  // 2. 使用 upsert 進行新增或更新
  // upsert 會先嘗試尋找符合 where 條件的紀錄
  // - 如果找到，就執行 update
  // - 如果找不到，就執行 create
  const result = await prisma.teamCalendarMark.upsert({
    where: {
      // --- 【請修改這裡】 ---
      // 改用 Prisma 預設的複合鍵名稱 teamId_date
      teamId_date: {
        teamId: Number(teamId),
        date: new Date(date),
      },
    },
    update: {
      note: note,
    },
    create: {
      teamId: Number(teamId),
      date: new Date(date),
      note: note,
    },
  })

  return result
}

/**
 * 刪除隊伍的日曆記事 (限隊長)
 * @param {object} params - 包含 markId (TeamCalendarMark 的 id) 和請求者 requesterId
 * @returns {Promise<object>}
 */
export async function deleteCalendarMark({ markId, requesterId }) {
  // 1. 根據 markId 找到該筆紀錄，並取得其 teamId
  const mark = await prisma.teamCalendarMark.findUnique({
    where: { id: Number(markId) },
    select: { teamId: true },
  })

  if (!mark) {
    throw new Error('找不到指定的日曆記事')
  }

  // 2. 驗證請求者是否為該隊伍的隊長
  const captainMembership = await prisma.teamMember.findFirst({
    where: {
      teamId: mark.teamId,
      memberId: Number(requesterId),
      isCaptain: true,
    },
  })

  if (!captainMembership) {
    throw new Error('只有隊長才能刪除行事曆記事')
  }

  // 3. 驗證通過，執行刪除
  const result = await prisma.teamCalendarMark.delete({
    where: { id: Number(markId) },
  })

  return result
}

/**
 * 在隊伍留言板新增一則訊息
 * @param {object} params - 包含 teamId, requesterId (發送者), content
 * @returns {Promise<object>}
 */
export async function addTeamMessage({ teamId, requesterId, content }) {
  // 1. 驗證發送者是否為該隊伍成員
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId: Number(teamId),
      memberId: Number(requesterId),
    },
  })

  if (!membership) {
    throw new Error('只有隊伍成員才能留言')
  }

  // 2. 找到目前最大的 orderIndex，新的留言要 +1
  const latestMessage = await prisma.teamMessageLite.findFirst({
    where: { teamId: Number(teamId) },
    orderBy: { orderIndex: 'desc' },
  })

  const newOrderIndex = latestMessage ? latestMessage.orderIndex + 1 : 1

  // 3. 建立新留言
  const newMessage = await prisma.teamMessageLite.create({
    data: {
      teamId: Number(teamId),
      memberId: Number(requesterId), // 記錄留言者
      content: content,
      orderIndex: newOrderIndex,
    },
    // 一併回傳留言者的資訊，方便前端直接更新畫面
    include: {
      member: {
        select: { id: true, name: true, avatar: true },
      },
    },
  })

  return newMessage
}
