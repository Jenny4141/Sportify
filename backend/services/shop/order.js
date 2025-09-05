import prisma from '../../lib/prisma.js'
import { orderSchema } from '../../utils/zod-schema.js'
import moment from 'moment-timezone'
import { createInvoiceNumber } from '../../utils/createInvoiceNumber.js'

// 創建訂單 (前台用戶結帳)
export const createUserOrder = async ({ memberId, orderData, cartItems }) => {
  try {
    // 驗證訂單資料
    const validation = orderSchema.safeParse(orderData)
    if (!validation.success) {
      const errors = {}
      validation.error.errors.forEach((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root'
        errors[path] = err.message
      })
      return {
        code: 400,
        success: false,
        message: '資料驗證失敗',
        errors,
      }
    }

    const {
      recipient,
      phone,
      address,
      storeName,
      deliveryId,
      paymentId,
      invoiceData,
    } = validation.data

    // 並行執行所有準備工作以加快速度
    const [invoiceNumber, { totalPrice, orderItems }, fee] = await Promise.all([
      // 生成發票號碼（如果需要發票）
      invoiceData ? createInvoiceNumber() : Promise.resolve(null),
      // 驗證購物車和庫存，計算訂單項目
      validateAndCalculateOrderItems(cartItems),
      // 計算運費（同步轉異步）
      Promise.resolve(calculateShippingFee(parseInt(deliveryId))),
    ])

    // 先更新商品庫存（移到交易外）
    await updateProductStock(cartItems)

    // 開始交易（只做必須原子性的操作）
    const result = await prisma.$transaction(
      async (prisma) => {
        // 1. 創建訂單
        const order = await prisma.order.create({
          data: {
            memberId: BigInt(memberId),
            total: totalPrice + fee, // 總金額 = 商品金額 + 運費
            fee: fee,
            recipient,
            storeName: parseInt(deliveryId) === 1 ? storeName : null, // 只有 7-11 才儲存門市名稱
            phone,
            address: parseInt(deliveryId) === 3 ? address : null, // 只有宅配才儲存地址
            deliveryId: parseInt(deliveryId),
            paymentId: parseInt(paymentId),
            statusId: 2, // 預設為待出貨狀態（商城專用）
            invoiceId: parseInt(invoiceData?.invoiceId || 1), // 預設發票類型
            invoiceNumber: invoiceNumber || '',
            carrier: invoiceData?.carrier || null,
            tax: invoiceData?.tax || null,
            orderItems: {
              create: orderItems,
            },
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            payment: true,
            status: true,
            delivery: true,
            invoice: true,
          },
        })
        // 產生 orderNumber
        const year = new Date().getFullYear()
        const orderNumber = `${year}${order.id.toString().padStart(4, '0')}`
        await prisma.order.update({
          where: { id: order.id },
          data: { orderNumber },
        })

        // 2. 清空購物車
        await clearUserCart(memberId)

        // 回傳 order 並加上 orderNumber
        return { ...order, orderNumber }
      },
      {
        timeout: 15000, // 設置 15 秒超時時間
      }
    )

    return {
      code: 200,
      success: true,
      data: result,
      message: '訂單建立成功',
    }
  } catch (error) {
    console.error('創建訂單錯誤:', error)

    // 如果是在庫存更新後發生錯誤，嘗試回滾庫存
    if (error.message && error.message.includes('Transaction')) {
      try {
        const rollbackPromises = cartItems.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity, // 回滾：增加庫存
              },
            },
          })
        )
        await Promise.all(rollbackPromises)
      } catch (rollbackError) {
        console.error('庫存回滾失敗:', rollbackError)
      }
    }

    return {
      code: 500,
      success: false,
      message: error.message || '創建訂單失敗',
    }
  }
}
// 計算運費的共用函數
export const calculateShippingFee = (deliveryId) => {
  // 1: 7-11, 2: 全家, 3: 宅配 (根據 seeds 數據推斷)
  if (deliveryId === 1 || deliveryId === 2) {
    return 60
  } else if (deliveryId === 3) {
    return 100
  }
  return 0
}
// 驗證庫存和計算訂單項目
export const validateAndCalculateOrderItems = async (cartItems) => {
  // 並行查詢所有商品資訊
  const productPromises = cartItems.map((item) =>
    prisma.product.findUnique({
      where: { id: item.productId },
      select: { id: true, name: true, price: true, stock: true },
    })
  )

  const products = await Promise.all(productPromises)

  let totalPrice = 0
  const orderItems = []

  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i]
    const product = products[i]

    if (!product) {
      throw new Error(`商品 ID ${item.productId} 不存在`)
    }

    if (product.stock < item.quantity) {
      throw new Error(`商品 ${product.name} 庫存不足`)
    }

    totalPrice += product.price * item.quantity
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
      productName: product.name,
    })
  }

  return { totalPrice, orderItems }
}
// 更新商品庫存
export const updateProductStock = async (cartItems) => {
  // 批量更新庫存，而不是逐一更新
  const updatePromises = cartItems.map((item) =>
    prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    })
  )

  await Promise.all(updatePromises)
}
// 清空購物車
export const clearUserCart = async (memberId) => {
  const cart = await prisma.cart.findFirst({
    where: { memberId: BigInt(memberId) },
  })

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    })
  }
}
// 獲取所有訂單 (分頁與搜尋)
export const getAllOrders = async (req) => {
  try {
    const keyword = req.query.keyword || ''
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const offset = (page - 1) * perPage

    // 初始化一個空的 where 條件物件
    let whereClause = {}

    // 只有在 keyword 存在 (不是空字串) 的情況下，才加上 OR 搜尋條件
    if (keyword) {
      const searchConditions = []

      // 物流方式模糊搜尋 - 直接查詢關聯的 Delivery 表
      searchConditions.push({
        delivery: {
          name: {
            contains: keyword,
          },
        },
      })

      // 付款方式模糊搜尋 - 直接查詢關聯的 Payment 表
      searchConditions.push({
        payment: {
          name: {
            contains: keyword,
          },
        },
      })

      // 發票類型模糊搜尋 - 直接查詢關聯的 Invoice 表
      searchConditions.push({
        invoice: {
          name: {
            contains: keyword,
          },
        },
      })

      // 訂單狀態模糊搜尋 - 直接查詢關聯的 Status 表
      searchConditions.push({
        status: {
          name: {
            contains: keyword,
          },
        },
      })

      // 發票號碼模糊搜尋
      searchConditions.push({
        invoiceNumber: { contains: keyword },
      })

      if (searchConditions.length > 0) {
        whereClause = {
          OR: searchConditions,
        }
      }
    }

    // 查詢符合條件的訂單
    const matchedOrders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
      },
    })

    if (matchedOrders.length === 0) {
      return { code: 200, data: [], page: 1, totalPages: 0, totalRows: 0 }
    }

    const orderIds = matchedOrders.map((order) => order.id)
    const totalRows = orderIds.length
    const totalPages = Math.ceil(totalRows / perPage)

    // 使用 ID 列表取得分頁後的完整資料
    const orders = await prisma.order.findMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      include: {
        payment: {
          select: {
            id: true,
            name: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
          },
        },
        delivery: {
          select: {
            id: true,
            name: true,
          },
        },
        invoice: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: perPage,
      skip: offset,
    })

    // 格式化訂單資料
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      order_number: order.orderNumber || null,
      member_id: order.memberId.toString(),
      total: order.total,
      fee: order.fee,
      status_id: order.status?.id || null,
      status_name: order.status?.name || null,
      payment_id: order.payment?.id || null,
      payment_name: order.payment?.name || null,
      delivery_id: order.delivery?.id || null,
      delivery_name: order.delivery?.name || null,
      recipient: order.recipient,
      storeName: order.storeName,
      address: order.address,
      phone: order.phone,
      created_at: moment(order.createdAt)
        .tz('Asia/Taipei')
        .format('YYYY-MM-DD HH:mm:ss'),
      updated_at: moment(order.updatedAt)
        .tz('Asia/Taipei')
        .format('YYYY-MM-DD HH:mm:ss'),
      invoice_id: order.invoice?.id || null,
      invoice_name: order.invoice?.name || null,
      invoice_number: order.invoiceNumber || '未開立發票',
    }))

    return {
      code: 200,
      data: formattedOrders,
      page,
      totalPages,
      totalRows,
    }
  } catch (err) {
    console.error('讀取訂單列表失敗', err)
    return { code: 500, error: '讀取訂單列表失敗' }
  }
}
// 新增訂單 (後台管理用)
export const createAdminOrder = async (req) => {
  try {
    const result = orderSchema.safeParse(req.body)
    if (!result.success) {
      const errors = {}
      result.error.errors.forEach((err) => {
        if (err.code === 'invalid_union_discriminator') {
          errors.invoice_type = '發票類型為必填'
        } else {
          errors[err.path[0]] = err.message
        }
      })
      return { code: 400, errors }
    }
    let {
      member_id,
      deliveryId,
      statusId,
      paymentId,
      invoiceId,
      carrier,
      tax,
      address,
      storeName,
      recipient,
      phone,
      items,
    } = req.body

    const itemsArray = Array.isArray(items) ? items : []

    // 使用共用函數計算運費
    const feeNumber = calculateShippingFee(parseInt(deliveryId))

    const subtotal = itemsArray.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    )
    const finalTotal = subtotal + feeNumber

    // 為訂單商品建立快照
    const orderItemsData = await Promise.all(
      itemsArray.map(async (item) => {
        // 去資料庫的 Product 表中查詢詳細資料
        const productDetails = await prisma.product.findUnique({
          where: { id: parseInt(item.product_id) },
          select: { name: true },
        })
        return {
          productId: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          price: parseInt(item.price),
          productName: productDetails ? productDetails.name : '未知商品',
          status: productDetails ? 'active' : 'product_removed', // 如果商品不存在，標記為已移除
        }
      })
    )

    // 生成發票號碼
    const invoiceNumber = await createInvoiceNumber()

    // 最終寫入資料庫的訂單
    const createdOrder = await prisma.order.create({
      data: {
        memberId: BigInt(member_id),
        deliveryId: parseInt(deliveryId),
        fee: feeNumber,
        total: finalTotal,
        statusId: parseInt(statusId),
        paymentId: parseInt(paymentId),
        invoiceId: parseInt(invoiceId),
        address: parseInt(deliveryId) === 3 ? address : null, // 只有宅配才儲存地址
        storeName: parseInt(deliveryId) === 1 ? storeName : null, // 只有 7-11 才儲存門市名稱
        recipient: recipient,
        phone: phone,
        invoiceNumber: invoiceNumber,
        carrier: carrier || null,
        tax: tax || null,
        orderItems: {
          create: orderItemsData,
        },
      },
    })

    // 產生 orderNumber 並寫入
    const year = new Date().getFullYear()
    const orderNumber = `${year}${createdOrder.id.toString().padStart(4, '0')}`
    await prisma.order.update({
      where: { id: createdOrder.id },
      data: { orderNumber },
    })

    return {
      code: 200,
      message: '新增成功',
      id: createdOrder.id,
      delivery_id: createdOrder.deliveryId,
      invoice_number: invoiceNumber,
      order_number: orderNumber,
    }
  } catch (error) {
    console.error('新增訂單失敗:', error)
    return { code: 500, error: '新增訂單失敗' }
  }
}
// 透過 ID 取得單筆訂單
export const getOrderById = async ({
  id,
  memberId = null,
  dataOptions = {},
}) => {
  try {
    const whereClause = { id: parseInt(id) }

    // 如果提供 memberId，則限制只能查看該會員的訂單（前台用）
    if (memberId) {
      whereClause.memberId = BigInt(memberId)
    }

    // 預設的 include 設定
    const defaultInclude = {
      payment: {
        select: {
          id: true,
          name: true,
        },
      },
      status: {
        select: {
          id: true,
          name: true,
        },
      },
      delivery: {
        select: {
          id: true,
          name: true,
        },
      },
      invoice: {
        select: {
          id: true,
          name: true,
        },
      },
      orderItems: {
        include: {
          product: dataOptions.includeProductDetails
            ? {
                include: {
                  images: {
                    orderBy: { order: 'asc' },
                    take: 1,
                  },
                },
              }
            : false,
        },
      },
    }

    const order = await prisma.order.findUnique({
      where: whereClause,
      include: defaultInclude,
    })

    if (!order) {
      return {
        code: 404,
        success: false,
        message: '訂單不存在',
      }
    }

    // 為了符合前端的資料格式，將欄位名稱和結構進行轉換
    const formattedOrder = {
      id: order.id,
      order_number: order.orderNumber || null,
      member_id: order.memberId.toString(),
      total: order.total,
      delivery_id: order.deliveryId,
      delivery_name: order.delivery?.name || null,
      fee: order.fee,
      payment_id: order.paymentId,
      payment_name: order.payment?.name || null,
      address: order.address,
      storeName: order.storeName,
      recipient: order.recipient,
      phone: order.phone,
      status_id: order.statusId,
      status_name: order.status?.name || null,
      invoice: {
        id: order.invoiceId,
        name: order.invoice?.name || null,
        number: order.invoiceNumber || '未開立發票',
        carrier: order.carrier || null,
        tax: order.tax || null,
      },
      items: order.orderItems.map((item) => ({
        item_id: item.id,
        order_id: item.orderId,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        product_name: item.productName,
        item_status: item.status,
        is_removed: item.status === 'product_removed' ? 1 : 0,
        ...(dataOptions.includeProductDetails &&
          item.product && {
            product: item.product,
          }),
      })),
      createdAt: order.createdAt,
    }

    return {
      code: 200,
      success: true,
      data: formattedOrder,
    }
  } catch (error) {
    console.error('查詢單筆訂單失敗:', error)
    return {
      code: 500,
      success: false,
      message: '查詢訂單失敗',
    }
  }
}
// 修改訂單
export const updateOrder = async ({ id, body }) => {
  const orderId = parseInt(id)
  const result = orderSchema.safeParse(body)
  if (!result.success) {
    const errors = {}
    result.error.errors.forEach((err) => {
      if (err.code === 'invalid_union_discriminator') {
        errors.invoice_type = '發票類型為必填'
      } else {
        errors[err.path[0]] = err.message
      }
    })
    return { code: 400, errors }
  }
  const {
    member_id,
    deliveryId,
    statusId,
    paymentId,
    invoiceId,
    carrier,
    tax,
    address,
    storeName,
    recipient,
    phone,
    total,
    fee,
    items,
  } = body
  try {
    // 取得目前資料庫中的 order items
    const existingItems = await prisma.orderItem.findMany({
      where: { orderId: orderId },
      select: { id: true },
    })

    // Set 是 JavaScript 的一種特殊集合物件，它的特性是所有成員的值都是唯一的
    const existingItemIds = new Set(existingItems.map((item) => item.id))

    // 建立一個包含所有從前端傳來的、已經存在的商品品項 ID 的 Set
    const incomingItemIds = new Set(
      items
        .filter((item) => item.item_id) //過濾 items 陣列，只有那些有item_id的會被留下來
        .map((item) => parseInt(item.item_id))
    )

    const itemsCreate = items.filter((item) => !item.item_id)
    // 過濾出需要新增的商品品項
    const itemsUpdate = items.filter(
      // 過濾出需要更新的商品品項
      (item) => item.item_id && existingItemIds.has(parseInt(item.item_id))
    )
    // 過濾出需要刪除的商品品項
    const itemsDelete = [...existingItemIds].filter(
      (id) => !incomingItemIds.has(id)
    )

    await prisma.$transaction(async (tx) => {
      // 1. 更新 Order 主表
      await tx.order.update({
        where: { id: orderId },
        data: {
          memberId: BigInt(member_id),
          deliveryId: parseInt(deliveryId),
          statusId: parseInt(statusId),
          paymentId: parseInt(paymentId),
          invoiceId: parseInt(invoiceId),
          address: parseInt(deliveryId) === 3 ? address : null, // 只有宅配才儲存地址
          storeName: parseInt(deliveryId) === 1 ? storeName : null, // 只有 7-11 才儲存門市名稱
          recipient,
          phone,
          total,
          fee,
          carrier: carrier || null,
          tax: tax || null,
        },
      })

      // 2. 刪除 Order Items
      if (itemsDelete.length > 0) {
        await tx.orderItem.deleteMany({
          where: {
            id: { in: itemsDelete },
          },
        })
      }

      // 3. 更新 Order Items
      if (itemsUpdate.length > 0) {
        for (const item of itemsUpdate) {
          // 檢查前端是否標記為已下架商品
          if (item.is_removed === 1 || item.status === 'product_removed') {
            // 已下架商品：只更新數量和價格，不動 productId
            await tx.orderItem.update({
              where: { id: parseInt(item.item_id) },
              data: {
                quantity: parseInt(item.quantity),
                price: parseInt(item.price),
                status: 'product_removed',
                // 不更新 productId 和 productName，保持原有快照資料
              },
            })
          } else {
            // 正常商品，檢查商品是否存在
            const productExists = await tx.product.findUnique({
              where: { id: parseInt(item.product_id) },
              select: { id: true, name: true },
            })

            if (productExists) {
              await tx.orderItem.update({
                where: { id: parseInt(item.item_id) },
                data: {
                  quantity: parseInt(item.quantity),
                  price: parseInt(item.price),
                  productId: parseInt(item.product_id),
                  productName: productExists.name,
                  status: 'active',
                },
              })
            } else {
              // 商品不存在，標記為已下架
              await tx.orderItem.update({
                where: { id: parseInt(item.item_id) },
                data: {
                  quantity: parseInt(item.quantity),
                  price: parseInt(item.price),
                  productId: null,
                  status: 'product_removed',
                  // 保持原有的 productName
                },
              })
            }
          }
        }
      }

      // 4. 新增 Order Items
      if (itemsCreate.length > 0) {
        // 為新增的商品品項建立快照資料
        const newItemsData = await Promise.all(
          itemsCreate.map(async (item) => {
            // 去資料庫的 Product 表中查詢詳細資料
            const productDetails = await tx.product.findUnique({
              where: { id: parseInt(item.product_id) },
              select: { name: true },
            })
            return {
              orderId: orderId,
              productId: parseInt(item.product_id),
              quantity: parseInt(item.quantity),
              price: parseInt(item.price),
              productName: productDetails ? productDetails.name : '未知商品',
              status: productDetails ? 'active' : 'product_removed', // 如果商品不存在，標記為已移除
            }
          })
        )
        await tx.orderItem.createMany({
          data: newItemsData,
        })
      }
    })

    // 取得更新後的訂單資訊
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { deliveryId: true },
    })

    return {
      code: 200,
      message: '更新成功',
      delivery_id: updatedOrder?.deliveryId || null,
    }
  } catch (err) {
    console.error('更新失敗', err)
    return { code: 500, error: '更新失敗' }
  }
}
// 刪除訂單
export const deleteOrder = async ({ orderId }) => {
  try {
    // 檢查訂單是否存在
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    })
    if (!order) {
      return { code: 404, error: '訂單不存在' }
    }
    // 執行刪除
    await prisma.order.delete({
      where: {
        id: orderId,
      },
    })
    return { code: 200, message: '刪除成功' }
  } catch (err) {
    console.error(err)
    return { code: 500, error: '伺服器錯誤' }
  }
}
// 取得某會員所有訂單
export const getOrdersOfMember = async (memberId) => {
  try {
    if (!memberId) {
      return { code: 400, error: '缺少會員編號' }
    }
    const orders = await prisma.order.findMany({
      where: { memberId: BigInt(memberId) },
      include: {
        delivery: { select: { id: true, name: true } },
        payment: { select: { id: true, name: true } },
        invoice: { select: { id: true, name: true } },
        status: { select: { id: true, name: true } },
        orderItems: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    // 整理回傳格式
    const orderList = orders.map((order) => ({
      id: order.id,
      order_number: order.orderNumber || null,
      invoice_number: order.invoiceNumber,
      invoice_type: order.invoice?.name || null,
      delivery_name: order.delivery?.name || null,
      payment_name: order.payment?.name || null,
      status_name: order.status?.name || null,
      total: order.total,
      items: order.orderItems.map((item) => ({
        product_id: item.product?.id,
        name: item.product?.name,
        price: item.product?.price,
        image_url: item.product?.images[0]?.url || null,
        quantity: item.quantity,
      })),
    }))
    return { code: 200, data: orderList }
  } catch (error) {
    console.error('查詢訂單列表失敗:', error, error.stack)
    return { code: 500, error: '伺服器錯誤', detail: error.message }
  }
}
