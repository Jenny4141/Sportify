import prisma from '../../lib/prisma.js'
import { centerSchema, updateCenterSchema } from '../../utils/zod-schema.js'

// *** 定義排序的類型 Order By
const orderByMapping = {
  id_asc: { id: 'asc' },
  id_desc: { id: 'desc' },
}

// #region 取得列表資料
export const getListData = async ({
  page = 1,
  keyword = '',
  orderby = '',
  perPage = 10,
  locationId = null,
  sportId = null,
  minRating = null,
}) => {
  // 確保 perPage 在合理範圍內，避免惡意請求
  const validPerPage = Math.min(Math.max(parseInt(perPage) || 10, 1), 100)
  const where = {}

  // 關鍵字搜尋
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { location: { name: { contains: keyword } } },
    ]
  }

  // 地區篩選
  if (locationId) {
    where.locationId = +locationId
  }

  // 運動種類篩選
  if (sportId) {
    where.centerSports = {
      some: { sportId: +sportId },
    }
  }

  // 先查出所有符合條件的場館
  let centers = await prisma.center.findMany({
    where,
    include: {
      location: true,
      centerSports: { include: { sport: true } },
      images: { select: { url: true } },
      ratings: { select: { rating: true } },
    },
  })

  // 評分篩選（在 JS 層處理）
  if (minRating) {
    centers = centers.filter((c) => {
      if (c.ratings.length === 0) return false
      const avg =
        c.ratings.reduce((sum, r) => sum + r.rating, 0) / c.ratings.length
      return avg >= minRating
    })
  }

  const totalRows = centers.length
  if (totalRows === 0) {
    return {
      code: 200,
      success: true,
      page,
      perPage: validPerPage,
      totalRows: 0,
      totalPages: 0,
      rows: [],
    }
  }
  const totalPages = Math.ceil(totalRows / validPerPage)
  if (page > totalPages && totalPages > 0)
    return { code: 400, success: false, redirect: `?page=${totalPages}` }

  // 分頁
  const rows = centers.slice((page - 1) * validPerPage, page * validPerPage)

  return {
    code: 200,
    success: true,
    page,
    perPage: validPerPage,
    totalRows,
    totalPages,
    rows: rows.map((r) => ({
      ...r,
      sports: r.centerSports.map((cs) => cs.sport),
      images: r.images.map((img) => img.url),
      averageRating:
        r.ratings.length > 0
          ? (
              r.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
              r.ratings.length
            ).toFixed(1)
          : null,
      ratingCount: r.ratings.length,
    })),
  }
}

// #region 取得單筆資料
export const getItemData = async (id) => {
  const record = await prisma.center.findUnique({
    where: { id: +id },
    include: {
      location: true,
      centerSports: {
        include: {
          sport: true,
        },
      },
      images: {
        select: {
          url: true,
        },
      },
      ratings: {
        select: {
          member: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  })
  return record
    ? {
        code: 200,
        success: true,
        record: {
          ...record,
          sports: record.centerSports.map((cs) => cs.sport),
          images: record.images.map((img) => img.url),
          averageRating:
            record.ratings.length > 0
              ? (
                  record.ratings.reduce(
                    (sum, rating) => sum + rating.rating,
                    0
                  ) / record.ratings.length
                ).toFixed(1)
              : null,
          ratingCount: record.ratings.length,
        },
      }
    : { code: 404, success: false, message: '沒有該筆資料', record: {} }
}

// #region 新增資料
export const createCenter = async (data) => {
  const output = { success: false, insertId: 0, issues: [] }

  try {
    // *** zod 使用 safeParse 驗證表單
    const result = centerSchema.safeParse(data)
    if (!result.success) {
      output.issues = result.error.issues
      return { code: 400, ...output }
    }

    const { sportIds, images, ...centerData } = result.data

    // 驗證至少要有圖片（新增時必須）
    if (!images || images.length === 0) {
      return { code: 400, success: false, message: '至少要上傳一張圖片' }
    }

    // 使用 transaction 確保資料一致性
    const record = await prisma.$transaction(async (tx) => {
      // 1. 新增場館基本資料
      const center = await tx.center.create({
        data: centerData,
      })

      // 2. 新增場館運動項目關聯
      if (sportIds && sportIds.length > 0) {
        await tx.centerSport.createMany({
          data: sportIds.map((sportId) => ({
            centerId: center.id,
            sportId: sportId,
          })),
        })
      }

      // 3. 新增場館圖片
      if (images && images.length > 0) {
        await tx.centerImage.createMany({
          data: images.map((image, index) => ({
            centerId: center.id,
            url: image.filename || image.url || image,
            order: index + 1,
          })),
        })
      }

      return center
    })

    return { code: 200, success: true, insertId: record.id }
  } catch (error) {
    console.error('Create center error:', error)
    return { code: 500, success: false, message: '新增場館失敗' }
  }
}

// #region 編輯資料
export const updateCenter = async (id, data) => {
  try {
    const exists = await prisma.center.findUnique({ where: { id: +id } })
    if (!exists) return { code: 404, success: false, message: '找不到資料' }

    // *** 表單驗證
    const result = updateCenterSchema.safeParse(data)
    if (!result.success)
      return { code: 400, success: false, issues: result.error.issues }

    const { sportIds, images, keepExistingImages, ...centerData } = result.data

    // 使用 transaction 確保資料一致性
    await prisma.$transaction(async (tx) => {
      // 1. 更新場館基本資料
      await tx.center.update({
        where: { id: +id },
        data: centerData,
      })

      // 2. 更新場館運動項目關聯
      if (sportIds && sportIds.length > 0) {
        // 先刪除原有的運動項目關聯
        await tx.centerSport.deleteMany({
          where: { centerId: +id },
        })

        // 新增新的運動項目關聯
        await tx.centerSport.createMany({
          data: sportIds.map((sportId) => ({
            centerId: +id,
            sportId: sportId,
          })),
        })
      }

      // 3. 更新場館圖片
      if (images && images.length > 0) {
        // 如果不保留現有圖片，先刪除原有的圖片
        if (!keepExistingImages) {
          await tx.centerImage.deleteMany({
            where: { centerId: +id },
          })
        }

        // 新增新的圖片
        await tx.centerImage.createMany({
          data: images.map((image, index) => ({
            centerId: +id,
            url: image.filename || image.url || image,
            order: index + 1,
          })),
        })
      } else if (!keepExistingImages) {
        // 如果沒有新圖片且不保留現有圖片，刪除所有圖片
        await tx.centerImage.deleteMany({
          where: { centerId: +id },
        })
      }
    })

    return { code: 200, success: true }
  } catch (error) {
    console.error('Update center error:', error)
    return { code: 500, success: false, message: '更新場館失敗' }
  }
}

// #region 多選刪除資料
export const deleteMultipleCenters = async (ids = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 400, success: false, message: '未提供要刪除的項目' }
  }

  // 先查要刪除的資料內容
  const toBeDeleted = await prisma.center.findMany({
    where: { id: { in: ids.map((id) => +id) } },
    select: { id: true, name: true },
  })

  // 執行刪除
  const result = await prisma.center.deleteMany({
    where: { id: { in: ids.map((id) => +id) } },
  })

  return {
    code: 200,
    success: !!result.count,
    affectedRows: result.count,
    deleted: toBeDeleted,
  }
}

// #region 刪除資料
export const deleteCenter = async (id) => {
  const exists = await prisma.center.findUnique({ where: { id: +id } })
  if (!exists) return { code: 404, success: false, message: '沒有該筆資料' }

  const deleted = await prisma.center.delete({ where: { id: +id } })

  return {
    code: 200,
    success: true,
    deletedId: deleted.id,
    deletedName: deleted.name, // 如果要給使用者看
  }
}
