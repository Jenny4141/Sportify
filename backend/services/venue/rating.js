import prisma from '../../lib/prisma.js'

// *** 新增評分
export const addRating = async (centerId, memberId, rating, comment = null) => {
  // 驗證評分範圍
  if (rating < 1 || rating > 5) {
    return { code: 400, success: false, message: '評分必須在1-5星之間' }
  }

  // 檢查運動中心是否存在
  const centerExists = await prisma.center.findUnique({
    where: { id: +centerId },
  })
  if (!centerExists) {
    return { code: 404, success: false, message: '運動中心不存在' }
  }

  try {
    // 使用 upsert 來更新或新增評分（每個會員對每個中心只能評分一次）
    const newRating = await prisma.centerRating.upsert({
      where: {
        centerId_memberId: {
          centerId: +centerId,
          memberId: BigInt(memberId),
        },
      },
      update: {
        rating: +rating,
        comment,
        updatedAt: new Date(),
      },
      create: {
        centerId: +centerId,
        memberId: BigInt(memberId),
        rating: +rating,
        comment,
      },
    })

    return {
      code: 200,
      success: true,
      message: '評分成功',
      rating: newRating,
    }
  } catch (error) {
    console.error('新增評分錯誤:', error)
    return { code: 500, success: false, message: '評分失敗' }
  }
}

// *** 取得運動中心的所有評分
export const getCenterRatings = async (centerId, page = 1, perPage = 10) => {
  const validPerPage = Math.min(Math.max(parseInt(perPage) || 10, 1), 50)

  const totalRows = await prisma.centerRating.count({
    where: { centerId: +centerId },
  })

  if (totalRows === 0) {
    return {
      code: 200,
      success: true,
      page,
      perPage: validPerPage,
      totalRows: 0,
      totalPages: 0,
      ratings: [],
    }
  }

  const totalPages = Math.ceil(totalRows / validPerPage)
  const ratings = await prisma.centerRating.findMany({
    where: { centerId: +centerId },
    skip: (page - 1) * validPerPage,
    take: validPerPage,
    include: {
      member: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    code: 200,
    success: true,
    page,
    perPage: validPerPage,
    totalRows,
    totalPages,
    ratings,
  }
}

// *** 取得會員對特定運動中心的評分
export const getMemberRating = async (centerId, memberId) => {
  const rating = await prisma.centerRating.findUnique({
    where: {
      centerId_memberId: {
        centerId: +centerId,
        memberId: BigInt(memberId),
      },
    },
  })

  return rating
    ? { code: 200, success: true, rating }
    : { code: 404, success: false, message: '尚未評分' }
}

// *** 刪除評分
export const deleteRating = async (centerId, memberId) => {
  try {
    const rating = await prisma.centerRating.findUnique({
      where: {
        centerId_memberId: {
          centerId: +centerId,
          memberId: BigInt(memberId),
        },
      },
    })

    if (!rating) {
      return { code: 404, success: false, message: '評分不存在' }
    }

    await prisma.centerRating.delete({
      where: {
        centerId_memberId: {
          centerId: +centerId,
          memberId: BigInt(memberId),
        },
      },
    })

    return {
      code: 200,
      success: true,
      message: '評分已刪除',
    }
  } catch (error) {
    console.error('刪除評分錯誤:', error)
    return { code: 500, success: false, message: '刪除評分失敗' }
  }
}

// *** 取得評分統計資訊
export const getRatingStats = async (centerId) => {
  const ratings = await prisma.centerRating.findMany({
    where: { centerId: +centerId },
    select: { rating: true },
  })

  if (ratings.length === 0) {
    return {
      code: 200,
      success: true,
      stats: {
        totalCount: 0,
        averageRating: null,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    }
  }

  // 計算平均評分
  const total = ratings.reduce((sum, r) => sum + r.rating, 0)
  const averageRating = (total / ratings.length).toFixed(1)

  // 計算評分分布
  const distribution = ratings.reduce(
    (dist, r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1
      return dist
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  )

  return {
    code: 200,
    success: true,
    stats: {
      totalCount: ratings.length,
      averageRating,
      distribution,
    },
  }
}
