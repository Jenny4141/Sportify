import express from 'express'
const router = express.Router()
// 產生uuid用和hash字串用
import * as crypto from 'crypto'
// line pay使用npm套件
import { createLinePayClient } from 'line-pay-merchant'

// 存取`.env`設定檔案使用
import 'dotenv/config.js'

import { serverConfig } from '../../config/server.config.js'
import {
  isDev,
  successResponse,
  errorResponse,
} from '../../utils/payment-utils.js'

/* 
LINE PAY 測試路由 - 支援多種訂單類型

API 使用範例：
1. 場地預約支付：
   GET /api/payment/line-pay-test/reserve?amount=2500&type=venue&reservationId=456&items=羽球場A

2. 商城訂單支付：
   GET /api/payment/line-pay-test/reserve?amount=1500&type=shop&reservationId=789&items=運動用品組合

3. 一般訂單支付：
   GET /api/payment/line-pay-test/reserve?amount=1000&type=general&reservationId=101&items=服務費用
*/

// 定義安全的私鑰字串
const linePayClient = createLinePayClient({
  channelId: isDev
    ? serverConfig.linePay.development.channelId
    : serverConfig.linePay.production.channelId,
  channelSecretKey: isDev
    ? serverConfig.linePay.development.channelSecret
    : serverConfig.linePay.production.channelSecret,
  env: process.env.NODE_ENV,
})
/* console.log(
  'channelId:',
  isDev
    ? serverConfig.linePay.development.channelId
    : serverConfig.linePay.production.channelId
)
console.log(
  'channelSecret:',
  isDev
    ? serverConfig.linePay.development.channelSecret
    : serverConfig.linePay.production.channelSecret
) */
// 設定重新導向與失敗導向的網址 - 根據不同類型設定不同成功頁面
const getRedirectUrls = (type, reservationId) => {
  const baseUrl = 'http://localhost:3000'

  switch (type) {
    case 'venue':
      return {
        confirmUrl: `${baseUrl}/venue/reservation/success?reservationId=${reservationId}`,
        cancelUrl: `${baseUrl}/venue/cancel`,
      }
    case 'shop':
      return {
        confirmUrl: `${baseUrl}/cart/success`,
        cancelUrl: `${baseUrl}/cart/cancel`,
      }
    default:
      return {
        confirmUrl: `${baseUrl}/payment/success`,
        cancelUrl: `${baseUrl}/payment/cancel`,
      }
  }
}

// 回應line-pay交易網址到前端，由前端導向line pay付款頁面
// 資料格式參考 https://enylin.github.io/line-pay-merchant/api-reference/request.html#example
// http://localhost:3005/api/payment/line-pay-test/reserve?amount=2500&type=venue&reservationId=456&items=羽球場A
router.get('/reserve', async (req, res) => {
  // 接收必要參數
  const {
    amount,
    type = 'general',
    reservationId,
    items = '商品一批',
  } = req.query

  if (!amount) {
    return errorResponse(res, '缺少金額參數')
  }

  // 根據類型取得對應的重新導向網址
  const redirectUrls = getRedirectUrls(type, reservationId)

  // 使用目前最新的v3版本的API，以下是資料的說明:
  // https://pay.line.me/jp/developers/apis/onlineApis?locale=zh_TW

  // packages[]	是包裝的集合，每個包裝可以包含多個商品，以下(Y)是必要的欄位
  //
  // packages[].id	String	50	Y	Package list的唯一ID
  // packages[].amount	Number		Y	一個Package中的商品總價=sum(products[].quantity * products[].price)
  // packages[].userFee	Number		N	手續費：在付款金額中含手續費時設定
  // packages[].name	String	100	N	Package名稱 （or Shop Name）

  // products[]	是商品的集合，包含多個商品，以下有(Y)是必要的欄位
  //
  // packages[].products[].id	String	50	N	商家商品ID
  // packages[].products[].name	String	4000	Y	商品名
  // packages[].products[].imageUrl	String	500	N	商品圖示的URL
  // packages[].products[].quantity	Number		Y	商品數量
  // packages[].products[].price	Number		Y	各商品付款金額
  // packages[].products[].originalPrice	Number		N	各商品原金額

  // 要傳送給line pay的訂單資訊
  const order = {
    orderId: crypto.randomUUID(), // 生成唯一訂單ID
    currency: 'TWD',
    amount: parseInt(amount),
    packages: [
      {
        id: crypto.randomBytes(5).toString('hex'),
        amount: parseInt(amount),
        name:
          type === 'venue'
            ? '場地預約'
            : type === 'shop'
            ? '商城訂單'
            : '一般訂單',
        products: [
          {
            id: reservationId || crypto.randomBytes(5).toString('hex'),
            name: decodeURIComponent(items),
            quantity: 1,
            price: parseInt(amount),
          },
        ],
      },
    ],
    options: {
      display: { locale: 'zh_TW' },
    },
    redirectUrls, // 設定重新導向與失敗導向的網址
    // 保存必要的訂單資訊，在 confirm 時可以使用
    customData: {
      type,
      reservationId,
      items: decodeURIComponent(items),
    },
  }

  if (isDev) console.log('訂單資料:', order)

  try {
    // 向line pay傳送的訂單資料
    const linePayResponse = await linePayClient.request.send({
      body: { ...order, redirectUrls },
    })

    // 深拷貝一份order資料
    const reservation = JSON.parse(JSON.stringify(order))

    reservation.returnCode = linePayResponse.body.returnCode
    reservation.returnMessage = linePayResponse.body.returnMessage
    reservation.transactionId = linePayResponse.body.info.transactionId
    reservation.paymentAccessToken =
      linePayResponse.body.info.paymentAccessToken

    if (isDev) console.log('預計付款記錄(Reservation):', reservation)

    // 記錄到session中(這裡是為了安全性，和一個簡單的範例，在實際應用中，應該也需要要存到資料庫妥善保管)
    req.session.reservation = reservation

    // rediret url
    res.redirect(linePayResponse.body.info.paymentUrl.web)

    // 導向到付款頁面， line pay回應後會帶有info.paymentUrl.web為付款網址
    // successResponse(res, {
    //   paymentUrl: linePayResponse.body.info.paymentUrl.web,
    // })
  } catch (error) {
    errorResponse(res, error)
  }
})

// 付款完成後，導回前端同一畫面，之後由伺服器向Line Pay伺服器確認交易結果
// 格式參考: https://enylin.github.io/line-pay-merchant/api-reference/confirm.html#example
router.get('/confirm', async (req, res) => {
  // 網址上需要有transactionId
  const transactionId = req.query.transactionId

  if (!transactionId) {
    return errorResponse(res, '缺少交易編號')
  }

  if (!req.session.reservation) {
    return errorResponse(res, '沒有已記錄的付款資料')
  }

  // 從session得到交易金額
  const amount = req.session?.reservation?.amount

  try {
    // 最後確認交易
    const linePayResponse = await linePayClient.confirm.send({
      transactionId: transactionId,
      body: {
        currency: 'TWD',
        amount: amount,
      },
    })

    // linePayResponse.body回傳的資料
    if (isDev) console.log('line-pay confirm', linePayResponse)

    // 從session取得原始訂單資訊
    const customData = req.session?.reservation?.customData || {}

    // 準備回傳的成功資料，包含原始訂單資訊
    const responseData = {
      ...linePayResponse.body,
      orderInfo: {
        type: customData.type,
        reservationId: customData.reservationId,
        items: customData.items,
        amount: amount,
        transactionId: transactionId,
        paymentCompleted: true,
        completedAt: new Date().toISOString(),
      },
    }

    // 清除session中的reservation的資料
    if (req.session.reservation) delete req.session.reservation

    successResponse(res, responseData)
  } catch (error) {
    errorResponse(res, error)
  }
})

// 檢查交易用(查詢LINE Pay付款請求的狀態。商家應隔一段時間後直接檢查付款狀態)
router.get('/check-payment-status', async (req, res) => {
  const transactionId = req.query.transactionId

  try {
    const linePayResponse = await linePayClient.checkPaymentStatus.send({
      transactionId: transactionId,
      params: {},
    })

    // 範例:
    // {
    //   "body": {
    //     "returnCode": "0000",
    //     "returnMessage": "reserved transaction."
    //   },
    //   "comments": {}
    // }

    successResponse(res, { data: linePayResponse.body })
  } catch (error) {
    errorResponse(res, error)
  }
})

// 新增：根據訂單ID查詢支付狀態的路由
router.get('/check-order-status', async (req, res) => {
  const { type, reservationId } = req.query

  if (!reservationId) {
    return errorResponse(res, '缺少預約ID參數')
  }

  try {
    // 這裡可以根據訂單類型查詢不同的資料表
    // 目前先返回基本資訊，實際實作時可以連接資料庫查詢
    const orderStatus = {
      type: type || 'general',
      reservationId,
      status: 'pending', // 可以是 pending, completed, failed, cancelled
      message: '訂單狀態查詢成功',
      queryTime: new Date().toISOString(),
    }

    successResponse(res, { orderStatus })
  } catch (error) {
    errorResponse(res, error)
  }
})

export default router
