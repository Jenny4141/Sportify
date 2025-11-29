import prisma from '../../lib/prisma.js'
import { productSchema, editProductSchema } from '../../utils/zod-schema.js'
import moment from 'moment-timezone'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url) // 取得當前檔案的絕對路徑
const __dirname = path.dirname(__filename) // 取得當前目錄的絕對路徑

/**
 * 取得商品列表 - 支援分頁、搜尋、篩選、排序
 * @param {Object} params - 查詢參數
 * @param {string} keyword - 搜尋關鍵字 (商品名稱/品牌名稱/運動類型)
 * @param {number} page - 頁碼，預設為第1頁
 * @param {string|null} userId - 使用者ID，用來判斷商品收藏狀態
 * @param {string} sportId - 運動類型ID，支援逗號分隔的多重選擇
 * @param {string} brandId - 品牌ID，支援逗號分隔的多重選擇
 * @param {string} sort - 排序方式：'price-asc'(價格低到高) | 'price-desc'(價格高到低)
 * @param {number} minPrice - 最低價格
 * @param {number} maxPrice - 最高價格
 * @returns {Object} 包含商品列表、分頁資訊的結果物件
 */
export const getAllProducts = async ({
  keyword = '',
  page = 1,
  userId = null,
  sportId,
  brandId,
  sort,
  minPrice,
  maxPrice,
}) => {
  try {
    // === 取得使用者收藏清單 ===
    // 如果有傳入使用者ID，先查詢該使用者的收藏商品ID列表
    // 這樣在回傳商品時可以標示 favorite: true/false
    let favoritedids = []
    if (userId) {
      const memberId = BigInt(userId) // 轉換為BigInt，因為Member.id是BigInt類型
      const favorites = await prisma.productFavorite.findMany({
        where: { memberId: memberId },
        select: { productId: true }, // 只取商品ID，提升查詢效能
      })
      favoritedids = favorites.map((fav) => fav.productId)
    }

    // === 處理分頁參數 ===
    const pageNum = parseInt(page) || 1 // 確保頁碼為正整數，預設第1頁
    const perPage = 16 // 每頁顯示16筆商品
    const offset = (pageNum - 1) * perPage // 計算資料庫查詢的偏移量

    // === 動態建立 Prisma 查詢條件 ===
    const whereCondition = {} // 初始化空的查詢條件物件

    // 關鍵字搜尋：使用 OR 邏輯搜尋商品名稱、品牌名稱、運動類型名稱
    if (keyword) {
      whereCondition.OR = [
        { name: { contains: keyword } }, // 模糊搜尋商品名稱
        { brand: { name: { contains: keyword } } }, // 透過關聯搜尋品牌名稱
        { sport: { name: { contains: keyword } } }, // 透過關聯搜尋運動類型名稱
      ]
    }
    // 運動和品牌：AND的作法
    if (sportId) {
      const sportIds = sportId
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id))
      if (sportIds.length > 0) {
        whereCondition.sportId = { in: sportIds }
      }
    }

    if (brandId) {
      const brandIds = brandId
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id))
      if (brandIds.length > 0) {
        whereCondition.brandId = { in: brandIds }
      }
    }

    // === 價格區間篩選 ===
    const min = Number(minPrice)
    const max = Number(maxPrice)
    // 防呆處理：如果最小價格大於最大價格，自動互換避免查無資料
    // Number.isNaN(NaN) => 檢查是否非特殊值
    if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      const temp = minPrice // 使用更清楚的變數名稱
      minPrice = max
      maxPrice = temp
    }
    const _min = Number(minPrice)
    const _max = Number(maxPrice)
    // 只有當價格參數有效時才加入查詢條件
    if (!Number.isNaN(_min) || !Number.isNaN(_max)) {
      whereCondition.price = {} // 初始化價格查詢物件
      if (!Number.isNaN(_min)) whereCondition.price.gte = _min // 價格大於等於最小價格 (>=)
      if (!Number.isNaN(_max)) whereCondition.price.lte = _max // 價格小於等於最大價格 (<=)
    }

    // === 排序條件設定 ===
    let orderByCondition = { id: 'asc' } // 預設排序：按ID升序
    if (sort === 'price-asc') {
      orderByCondition = { price: 'asc' } // 價格低到高
    } else if (sort === 'price-desc') {
      orderByCondition = { price: 'desc' } // 價格高到低
    }

    // 計算總數和查詢分頁資料
    const [totalRows, products] = await prisma.$transaction([
      prisma.product.count({ where: whereCondition }),
      prisma.product.findMany({
        where: whereCondition,
        include: {
          sport: true,
          brand: true,
          images: {
            where: { order: 1 },
            select: { url: true, order: true },
          },
        },
        orderBy: orderByCondition,
        skip: offset,
        take: perPage,
      }),
    ])

    const totalPages = Math.ceil(totalRows / perPage)

    // 格式化資料
    const formattedData = products.map((product) => ({
      id: product.id,
      name: product.name,
      sport_name: product.sport.name,
      brand_name: product.brand.name,
      price: product.price,
      stock: product.stock,
      image_url: product.images.length > 0 ? product.images[0].url : null,
      created_at: moment(product.createdAt)
        .tz('Asia/Taipei')
        .format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment(product.updatedAt)
        .tz('Asia/Taipei')
        .format('YYYY-MM-DD HH:mm:ss'),
      favorite: favoritedids.includes(product.id),
    }))

    return {
      code: 200,
      data: formattedData,
      page: pageNum,
      perPage,
      totalPages,
      totalRows,
    }
  } catch (error) {
    console.error('查詢商品失敗：', error)
    return { code: 500, error: '伺服器錯誤' }
  }
}
// 無分頁(for 後台訂單管理)
export const getAllProductsOrders = async () => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        sport: {
          select: {
            name: true,
          },
        },
        brand: {
          select: {
            name: true,
          },
        },
      },
    })

    const formattedData = products.map((product) => ({
      id: product.id,
      name: product.name,
      sport_name: product.sport.name,
      brand_name: product.brand.name,
      price: product.price,
      stock: product.stock,
    }))

    return { code: 200, data: formattedData }
  } catch (error) {
    console.error('查詢所有商品失敗：', error)
    return { code: 500, error: '伺服器錯誤' }
  }
}
// 新增商品
export const createProduct = async ({ body, files }) => {
  try {
    const dataToValidate = { ...body, images: files || [] }
    const result = productSchema.safeParse(dataToValidate)
    if (!result.success) {
      const errors = {}
      result.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message
      })
      return { code: 400, errors }
    }

    const {
      name,
      sport_id,
      brand_id,
      price,
      stock,
      material,
      size,
      weight,
      origin,
    } = body

    const newProduct = await prisma.product.create({
      data: {
        name,
        brandId: parseInt(brand_id),
        sportId: parseInt(sport_id),
        price: parseInt(price),
        stock: parseInt(stock),
        material,
        size,
        weight: parseInt(weight) || null,
        origin,
        images: {
          create: files
            ? files.map((file, index) => ({
                url: file.filename,
                order: index,
              }))
            : [],
        },
      },
    })

    return { code: 200, message: '新增成功', product_id: newProduct.id }
  } catch (error) {
    console.error('新增商品失敗:', error)
    return { code: 500, error: '新增商品失敗' }
  }
}
// 用 ID 查詢單一商品
export const getProductById = async ({ id, userId = null }) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: +id,
      },
      include: {
        images: true,
      },
    })

    if (!product) {
      return { code: 404, error: '找不到該商品' }
    }

    let favorite = false
    if (userId) {
      const memberId = BigInt(userId)
      const fav = await prisma.productFavorite.findFirst({
        where: {
          memberId: memberId,
          productId: parseInt(id),
        },
      })
      favorite = !!fav
    }

    return { code: 200, data: { ...product, favorite } }
  } catch (error) {
    console.error('查詢商品失敗', error)
    return { code: 500, error: '伺服器錯誤' }
  }
}
// 更新商品
export const updateProduct = async ({ id, body, files }) => {
  const dataToValidate = {
    ...body,
    images: files || [],
    existingImageCount: body.existingImageCount || '0',
  }
  const result = editProductSchema.safeParse(dataToValidate)
  if (!result.success) {
    const errors = {}
    result.error.errors.forEach((err) => {
      errors[err.path[0]] = err.message
    })
    return { code: 400, errors }
  }

  // 取得表單欄位資料
  const {
    name,
    brand_id,
    sport_id,
    price,
    stock,
    material,
    size,
    weight,
    origin,
    deleteImageIds, // 要刪除的圖片 ID 列表
  } = body

  try {
    // 檢查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: id },
    })

    if (!existingProduct) {
      return { code: 404, error: '找不到該商品' }
    }

    // 處理要刪除的圖片
    if (deleteImageIds && deleteImageIds.length > 0) {
      // 將字串轉換為數字陣列
      const imageIdsToDelete = Array.isArray(deleteImageIds)
        ? deleteImageIds.map((id) => parseInt(id))
        : deleteImageIds
            .split(',')
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id))

      if (imageIdsToDelete.length > 0) {
        // 先取得要刪除的圖片檔案名稱
        const imagesToDelete = await prisma.productImage.findMany({
          where: {
            id: { in: imageIdsToDelete },
            productId: id, // 確保只能刪除屬於這個商品的圖片
          },
          select: { id: true, url: true },
        })

        // 從資料庫刪除圖片記錄
        await prisma.productImage.deleteMany({
          where: {
            id: { in: imageIdsToDelete },
            productId: id,
          },
        })

        // 刪除實體檔案
        for (const img of imagesToDelete) {
          const filepath = path.join(
            __dirname,
            '../../public/product-imgs/',
            img.url
          )
          try {
            await fs.promises.unlink(filepath)
          } catch (err) {
            console.error('圖片實體檔案刪除失敗:', filepath, err)
          }
        }
      }
    }

    // 更新商品資料
    await prisma.product.update({
      where: { id: id },
      data: {
        name,
        brandId: parseInt(brand_id),
        sportId: parseInt(sport_id),
        price: parseInt(price),
        stock: parseInt(stock),
        material,
        size,
        weight: parseInt(weight) || null,
        origin,
      },
    })

    // 處理圖片上傳
    if (files && files.length > 0) {
      // 查詢現有的最大 order 值
      const maxOrderResult = await prisma.productImage.aggregate({
        where: { productId: id },
        _max: {
          order: true,
        },
      })

      // 如果商品還沒有任何圖片, maxOrder 會是 null, 預設為 -1
      const maxOrder = maxOrderResult._max.order ?? -1

      // 新增圖片，並計算新的 order 值
      await prisma.productImage.createMany({
        data: files.map((f, index) => ({
          productId: id,
          url: f.filename,
          order: maxOrder + 1 + index, // 從 (最大值 + 1) 開始排序
        })),
      })
    }

    return {
      code: 200,
      message: '更新成功',
      addedImages: files ? files.map((f) => f.filename) : [],
    }
  } catch (err) {
    console.error('更新失敗', err)
    return { code: 500, error: '更新失敗' }
  }
}
// 刪除商品
export const deleteProduct = async ({ id }) => {
  // 檢查 id 是否存在且為有效數字
  if (!id || isNaN(id)) {
    return { code: 400, error: '缺少或無效的商品 ID' }
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: id },
      include: {
        images: true, // 包含關聯的圖片
      },
    })

    if (!product) {
      return { code: 404, error: '找不到該商品' }
    }

    // 先刪除實體圖片檔案
    for (const image of product.images) {
      const filepath = path.join(
        __dirname,
        '../../public/product-imgs/',
        image.url
      )
      try {
        await fs.promises.unlink(filepath)
      } catch (err) {
        // 即使檔案刪除失敗，也繼續執行，只記錄錯誤
        console.error('刪除圖片檔案失敗:', filepath, err)
      }
    }

    // 使用交易確保資料一致性
    await prisma.$transaction(async (tx) => {
      // 1. 先更新所有相關的 OrderItem 狀態為 'product_removed' 並將 productId 設為 null
      await tx.orderItem.updateMany({
        where: { productId: id },
        data: {
          status: 'product_removed',
          productId: null,
        },
      })

      // 2. 再刪除商品（資料庫會自動級聯刪除相關的圖片記錄和收藏記錄）
      await tx.product.delete({
        where: { id: id },
      })
    })

    return { code: 200, message: '刪除成功' }
  } catch (error) {
    console.error('刪除商品失敗：', error)
    return { code: 500, error: '伺服器錯誤' }
  }
}
// 取得品牌資料
export const getBrandData = async () => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    })
    return { code: 200, data: brands }
  } catch (err) {
    console.error('讀取品牌失敗:', err)
    return { code: 500, error: '伺服器錯誤' }
  }
}
// 取得運動種類資料
export const getSportData = async () => {
  try {
    const sports = await prisma.sport.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    })
    return { code: 200, data: sports }
  } catch (err) {
    console.error('讀取運動種類失敗:', err)
    return { code: 500, error: '伺服器錯誤' }
  }
}
