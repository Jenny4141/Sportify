import prisma from '../../lib/prisma.js'

// 切換收藏狀態
export const toggleFavorite = async ({ productId, userId }) => {
  try {
    if (!userId) {
      return { code: 401, error: '請先登入' }
    }
    const memberId = BigInt(userId)
    // 檢查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: +productId },
    })
    if (!product) {
      return { code: 404, error: '找不到該商品' }
    }
    const existingFavorite = await prisma.productFavorite.findFirst({
      where: {
        memberId: memberId,
        productId: +productId,
      },
    })
    if (existingFavorite) {
      // 如果已存在，就刪除
      await prisma.productFavorite.delete({
        where: { id: existingFavorite.id },
      })
      return { code: 200, message: '已從收藏移除', favorited: false }
    } else {
      // 如果不存在，就新增
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
// 取得某會員所有收藏商品
export const getFavoritesOfMember = async (memberId) => {
  try {
    if (!memberId) {
      return { code: 400, error: '缺少會員編號' }
    }
    const favorites = await prisma.productFavorite.findMany({
      where: { memberId: BigInt(memberId) },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: {
              where: { order: 1 },
              select: { url: true },
            },
          },
        },
      },
    })
    // 整理回傳格式
    const productList = favorites.map((fav) => ({
      id: fav.product.id,
      name: fav.product.name,
      price: fav.product.price,
      image_url: fav.product.images[0]?.url || null,
    }))
    return { code: 200, data: productList }
  } catch (error) {
    console.error('取得收藏商品失敗:', error)
    return { code: 500, error: '伺服器錯誤' }
  }
}
