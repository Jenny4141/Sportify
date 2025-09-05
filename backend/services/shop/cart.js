import prisma from '../../lib/prisma.js'
import { cartItemSchema, updateCartItemSchema } from '../../utils/zod-schema.js'
import { getPaymentData, getDeliveryData, getInvoiceData } from '../common.js'
import { calculateShippingFee } from './order.js'

// 獲取用戶購物車
export const getCart = async ({ memberId }) => {
  try {
    // 查找或創建購物車
    let cart = await prisma.cart.findFirst({
      where: { memberId: BigInt(memberId) },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
                brand: true,
                sport: true,
              },
            },
          },
        },
      },
    })

    // 如果沒有購物車，創建一個新的
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          memberId: BigInt(memberId),
        },
        include: {
          cartItems: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { order: 'asc' },
                    take: 1,
                  },
                  brand: true,
                  sport: true,
                },
              },
            },
          },
        },
      })
    }

    // 計算總價格
    const totalPrice = cart.cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity
    }, 0)

    return {
      code: 200,
      success: true,
      data: {
        cart,
        totalPrice,
        itemCount: cart.cartItems.length,
      },
    }
  } catch (error) {
    console.error('獲取購物車錯誤:', error)
    return {
      code: 500,
      success: false,
      message: '獲取購物車失敗',
    }
  }
}
// 添加商品到購物車
export const addToCart = async ({ memberId, body }) => {
  try {
    // 驗證輸入資料
    const validation = cartItemSchema.safeParse(body)
    if (!validation.success) {
      const errors = {}
      validation.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message
      })
      return {
        code: 400,
        success: false,
        errors,
      }
    }

    const { productId, quantity } = validation.data

    // 檢查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    })

    if (!product) {
      return {
        code: 404,
        success: false,
        message: '商品不存在',
      }
    }

    // 檢查庫存
    if (product.stock < quantity) {
      return {
        code: 400,
        success: false,
        message: '庫存不足',
      }
    }

    // 查找或創建購物車
    let cart = await prisma.cart.findFirst({
      where: { memberId: BigInt(memberId) },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          memberId: BigInt(memberId),
        },
      })
    }

    // 檢查商品是否已經在購物車中
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: parseInt(productId),
      },
    })

    if (existingItem) {
      // 更新數量
      const newQuantity = existingItem.quantity + parseInt(quantity)

      // 再次檢查庫存
      if (product.stock < newQuantity) {
        return {
          code: 400,
          success: false,
          message: '庫存不足',
        }
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      })
    } else {
      // 創建新的購物車項目
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: parseInt(productId),
          quantity: parseInt(quantity),
        },
      })
    }

    return {
      code: 200,
      success: true,
      message: '商品已加入購物車',
    }
  } catch (error) {
    console.error('添加到購物車錯誤:', error)
    return {
      code: 500,
      success: false,
      message: '添加到購物車失敗',
    }
  }
}
// 更新購物車項目數量
export const updateCartItem = async ({ memberId, cartItemId, body }) => {
  try {
    // 驗證輸入資料
    const validation = updateCartItemSchema.safeParse(body)
    if (!validation.success) {
      const errors = {}
      validation.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message
      })
      return {
        code: 400,
        success: false,
        errors,
      }
    }

    const { quantity } = validation.data

    // 驗證購物車項目是否屬於該用戶
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: parseInt(cartItemId),
        cart: {
          memberId: BigInt(memberId),
        },
      },
      include: {
        product: true,
      },
    })

    if (!cartItem) {
      return {
        code: 404,
        success: false,
        message: '購物車項目不存在',
      }
    }

    // 檢查庫存
    if (cartItem.product.stock < quantity) {
      return {
        code: 400,
        success: false,
        message: '庫存不足',
      }
    }

    // 如果數量為0，則刪除項目
    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: parseInt(cartItemId) },
      })

      return {
        code: 200,
        success: true,
        message: '商品已從購物車移除',
      }
    }

    // 更新數量
    await prisma.cartItem.update({
      where: { id: parseInt(cartItemId) },
      data: { quantity: parseInt(quantity) },
    })

    return {
      code: 200,
      success: true,
      message: '購物車已更新',
    }
  } catch (error) {
    console.error('更新購物車項目錯誤:', error)
    return {
      code: 500,
      success: false,
      message: '更新購物車失敗',
    }
  }
}
// 從購物車移除商品
export const removeFromCart = async ({ memberId, cartItemId }) => {
  try {
    // 驗證購物車項目是否屬於該用戶
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: parseInt(cartItemId),
        cart: {
          memberId: BigInt(memberId),
        },
      },
    })

    if (!cartItem) {
      return {
        code: 404,
        success: false,
        message: '購物車項目不存在',
      }
    }

    await prisma.cartItem.delete({
      where: { id: parseInt(cartItemId) },
    })

    return {
      code: 200,
      success: true,
      message: '商品已從購物車移除',
    }
  } catch (error) {
    console.error('移除購物車項目錯誤:', error)
    return {
      code: 500,
      success: false,
      message: '移除商品失敗',
    }
  }
}
// 清空購物車
export const clearCart = async ({ memberId }) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: { memberId: BigInt(memberId) },
    })

    if (!cart) {
      return {
        code: 404,
        success: false,
        message: '購物車不存在',
      }
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    return {
      code: 200,
      success: true,
      message: '購物車已清空',
    }
  } catch (error) {
    console.error('清空購物車錯誤:', error)
    return {
      code: 500,
      success: false,
      message: '清空購物車失敗',
    }
  }
}
// 購物車結帳準備 - 驗證庫存並計算總價
export const prepareCheckout = async ({ memberId }) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: { memberId: BigInt(memberId) },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
                brand: true,
              },
            },
          },
        },
      },
    })

    if (!cart || cart.cartItems.length === 0) {
      return {
        code: 400,
        success: false,
        message: '購物車是空的',
      }
    }

    // 驗證所有商品的庫存
    const stockErrors = []
    let totalPrice = 0

    for (const item of cart.cartItems) {
      if (item.product.stock < item.quantity) {
        stockErrors.push({
          productName: item.product.name,
          requestedQuantity: item.quantity,
          availableStock: item.product.stock,
        })
      } else {
        totalPrice += item.product.price * item.quantity
      }
    }

    if (stockErrors.length > 0) {
      return {
        code: 400,
        success: false,
        message: '部分商品庫存不足',
        data: { stockErrors },
      }
    }

    return {
      code: 200,
      success: true,
      data: {
        cart,
        totalPrice,
        itemCount: cart.cartItems.length,
      },
    }
  } catch (error) {
    console.error('準備結帳錯誤:', error)
    return {
      code: 500,
      success: false,
      message: '準備結帳失敗',
    }
  }
}
// 執行結帳 - 創建訂單
export const getCheckoutData = async ({ memberId }) => {
  try {
    // 準備購物車資料
    const cartResult = await prepareCheckout({ memberId })
    if (!cartResult.success) {
      return cartResult
    }

    // 準備付款方式、物流選項和發票類型資料
    const [paymentResult, deliveryResult, invoiceResult] = await Promise.all([
      getPaymentData(),
      getDeliveryData(),
      getInvoiceData(),
    ])

    if (paymentResult.code !== 200) {
      return paymentResult
    }

    if (deliveryResult.code !== 200) {
      return deliveryResult
    }

    if (invoiceResult.code !== 200) {
      return invoiceResult
    }

    // 計算各種配送方式的運費選項
    const deliveryOptionsWithFee = (
      deliveryResult.success ? deliveryResult.rows : []
    ).map((option) => ({
      ...option,
      fee: calculateShippingFee(option.id), // 添加運費資訊
    }))

    // 組合所有資料返回
    return {
      code: 200,
      success: true,
      data: {
        cart: cartResult.data.cart,
        totalPrice: cartResult.data.totalPrice, // 商品總金額
        itemCount: cartResult.data.itemCount,
        paymentMethods: paymentResult.success ? paymentResult.rows : [],
        deliveryOptions: deliveryOptionsWithFee, // 包含運費的配送選項
        invoiceTypes: invoiceResult.success ? invoiceResult.rows : [],
      },
    }
  } catch (error) {
    console.error('獲取結帳資料錯誤:', error)
    return {
      code: 500,
      success: false,
      message: '獲取結帳資料失敗',
    }
  }
}
