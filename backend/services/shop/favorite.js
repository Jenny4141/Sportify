import prisma from '../../lib/prisma.js'

/**
 * 切換商品收藏狀態 - 實現愛心按鈕的新增/移除收藏功能
 * 這是一個切換型 API，如果已收藏則移除，未收藏則新增
 *
 * 商業邏輯流程：
 * 1. 驗證用戶登入狀態
 * 2. 檢查商品是否存在
 * 3. 查詢當前收藏狀態
 * 4. 執行相反操作 (收藏→取消 或 未收藏→收藏)
 *
 * @param {Object} params - 參數物件
 * @param {number} productId - 商品ID
 * @param {string|number} userId - 用戶ID
 * @returns {Object} 包含操作結果和新收藏狀態的回應物件
 */
export const toggleFavorite = async ({ productId, userId }) => {
  try {
    // === 步驟1：驗證用戶登入狀態 ===
    if (!userId) {
      return { code: 401, error: '請先登入' }
    }
    const memberId = BigInt(userId) // 轉換為BigInt配合資料庫欄位類型

    // === 步驟2：驗證商品是否存在 ===
    // 防止對不存在的商品進行收藏操作
    const product = await prisma.product.findUnique({
      where: { id: +productId }, // +productId 將字串轉為數字
    })
    if (!product) {
      return { code: 404, error: '找不到該商品' }
    }

    // === 步驟3：查詢當前收藏狀態 ===
    // 檢查該用戶是否已經收藏此商品
    const existingFavorite = await prisma.productFavorite.findFirst({
      where: {
        memberId: memberId, // 當前用戶ID
        productId: +productId, // 目標商品ID
      },
    })

    // === 步驟4：根據當前狀態執行相反操作 ===
    if (existingFavorite) {
      // 情況A：已收藏 → 移除收藏
      await prisma.productFavorite.delete({
        where: { id: existingFavorite.id },
      })
      return { code: 200, message: '已從收藏移除', favorited: false }
    } else {
      // 情況B：未收藏 → 新增收藏
      await prisma.productFavorite.create({
        data: {
          memberId: memberId,
          productId: +productId,
        },
      })
      return { code: 200, message: '已加入收藏', favorited: true }
    }
  } catch (error) {
    console.error('切換收藏狀態失敗:', error)
    return { code: 500, error: '伺服器錯誤' }
  }
}
/**
 * 取得某會員的所有收藏商品列表
 * 用於會員中心的「我的收藏」頁面，顯示用戶收藏的所有商品
 *
 * 查詢邏輯：
 * 1. 驗證會員ID是否提供
 * 2. 查詢該會員的所有收藏記錄
 * 3. 透過關聯查詢取得商品詳細資訊
 * 4. 格式化回傳資料供前端使用
 *
 * @param {string|BigInt} memberId - 會員ID
 * @returns {Object} 包含收藏商品列表的回應物件
 */
export const getFavoritesOfMember = async (memberId) => {
  try {
    // === 步驟1：參數驗證 ===
    if (!memberId) {
      return { code: 400, error: '缺少會員編號' }
    }

    // === 步驟2：查詢會員的所有收藏記錄 ===
    // 使用 include 進行關聯查詢，同時取得商品資訊
    const favorites = await prisma.productFavorite.findMany({
      where: { memberId: BigInt(memberId) }, // 篩選特定會員的收藏
      include: {
        product: {
          // 關聯查詢商品資訊
          select: {
            id: true, // 商品ID
            name: true, // 商品名稱
            price: true, // 商品價格
            images: {
              // 商品圖片 (只取第一張作為縮圖)
              where: { order: 1 }, // 只取順序為1的圖片
              select: { url: true },
            },
          },
        },
      },
    })

    // === 步驟3：格式化回傳資料 ===
    // 將資料庫的複雜結構轉換為前端需要的簡潔格式
    const productList = favorites.map((fav) => ({
      id: fav.product.id,
      name: fav.product.name,
      price: fav.product.price,
      image_url: fav.product.images[0]?.url || null, // 安全取值，沒有圖片時為null
    }))

    return { code: 200, data: productList }
  } catch (error) {
    console.error('取得收藏商品失敗:', error)
    return { code: 500, error: '伺服器錯誤' }
  }
}
