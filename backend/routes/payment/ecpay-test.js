import express from 'express'
const router = express.Router()
import * as crypto from 'crypto'
import {
  isDev,
  successResponse,
  errorResponse,
} from '../../utils/payment-utils.js'

/* GET home page. */
// http://localhost:3005/api/ecpay-test?amount=2500&items=商品1X2,商品2X3
// 使用範例:
// http://localhost:3005/api/ecpay-test?amount=2500&items=商品1X2,商品2X3&type=shop (商城)
// http://localhost:3005/api/ecpay-test?amount=2500&items=場地預訂&type=venue (場地)
// http://localhost:3005/api/ecpay-test?amount=2500&items=課程報名&type=course (課程)
router.get('/', function (req, res) {
  // 目前只需要一個參數，總金額。其它的可以自行設定
  const amount = Number(req.query.amount) || 0
  const items = req.query.items || ''
  const type = req.query.type || 'shop' // 新增類型參數：shop, venue, course
  const reservationId = req.query.reservationId
  const bookingId = req.query.bookingId
  const orderId = req.query.orderId

  // const itemName =
  //   items.split(',').length > 1
  //     ? items.split(',').join('#')
  //     : '線上商店購買一批'
  // 商品名稱一律用 # 分隔，無論幾樣商品都顯示明細
  const itemName = items.split(',').join('#')

  if (isDev) console.log('amount:', amount)
  if (isDev) console.log('items:', items)
  if (isDev) console.log('itemName:', itemName)
  if (isDev) console.log('type:', type)
  if (isDev) console.log('reservationId:', reservationId)

  if (!amount) {
    return errorResponse(res, '缺少總金額')
  }

  // 驗證類型參數
  const validTypes = ['shop', 'venue', 'course']
  if (!validTypes.includes(type)) {
    return errorResponse(res, '無效的業務類型，請使用 shop, venue, 或 course')
  }

  //綠界全方位金流技術文件：
  // https://developers.ecpay.com.tw/?p=2856
  // 信用卡測試卡號：4311-9522-2222-2222 安全碼 222

  ////////////////////////改以下參數即可////////////////////////
  //一、選擇帳號，是否為測試環境
  const MerchantID = '3002607' //必填
  const HashKey = 'pwFHCqoQZGmho4w6' //3002607
  const HashIV = 'EkRm7iFT261dpevs' //3002607
  let isStage = true // 測試環境： true；正式環境：false

  //二、輸入參數
  const TotalAmount = amount //整數，不可有小數點。金額不可為0。
  const TradeDesc = '商店線上付款' // String(200)
  const ItemName = itemName // String(400) 如果商品名稱有多筆，需在金流選擇頁一行一行顯示商品名稱的話，商品名稱請以符號#分隔。

  // 付款結果通知回傳網址(這網址可能需要網路上的真實網址或IP，才能正確接收回傳結果)
  const ReturnURL = 'https://www.ecpay.com.tw'
  // (二選一)以下這個設定，會有回傳結果，但要用前端的api路由來接收並協助重新導向到前端成功callback頁面(不用時下面要83~97從中的值要註解)
  //const OrderResultURL = 'http://localhost:3000/ecpay/api' //前端成功頁面api路由(POST)
  // (二選一)以下這個設定，不會任何回傳結果(不用時下面要83~97從中的值要註解)
  // const ClientBackURL = 'http://localhost:3000/cart/success/' //前端成功頁面
  // 根據業務類型選擇對應的成功頁面
  let ClientBackURL
  switch (type) {
    case 'venue':
      ClientBackURL = `http://localhost:3000/venue/reservation/success?reservationId=${reservationId}` //前端成功頁面(場地)
      break
    case 'course':
      ClientBackURL = `http://localhost:3000/course/success/?bookingId=${bookingId}` //前端成功頁面(課程)
      break
    case 'shop':
    default:
      ClientBackURL = `http://localhost:3000/shop/order/success/?orderId=${orderId}` //前端成功頁面(商城)
      break
  }

  const ChoosePayment = 'ALL'

  ////////////////////////以下參數不用改////////////////////////
  const stage = isStage ? '-stage' : ''
  const algorithm = 'sha256'
  const digest = 'hex'
  const APIURL = `https://payment${stage}.ecpay.com.tw//Cashier/AioCheckOut/V5`
  const MerchantTradeNo = `od${new Date().getFullYear()}${(
    new Date().getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}${new Date()
    .getDate()
    .toString()
    .padStart(2, '0')}${new Date()
    .getHours()
    .toString()
    .padStart(2, '0')}${new Date()
    .getMinutes()
    .toString()
    .padStart(2, '0')}${new Date()
    .getSeconds()
    .toString()
    .padStart(2, '0')}${new Date().getMilliseconds().toString().padStart(2)}`

  const MerchantTradeDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  //三、計算 CheckMacValue 之前
  let ParamsBeforeCMV = {
    MerchantID: MerchantID,
    MerchantTradeNo: MerchantTradeNo,
    MerchantTradeDate: MerchantTradeDate.toString(),
    PaymentType: 'aio',
    EncryptType: 1,
    TotalAmount: TotalAmount,
    TradeDesc: TradeDesc,
    ItemName: ItemName,
    ReturnURL: ReturnURL,
    ChoosePayment: ChoosePayment,
    // OrderResultURL,
    ClientBackURL,
  }

  //四、計算 CheckMacValue
  function CheckMacValueGen(parameters, algorithm, digest) {
    let Step0

    Step0 = Object.entries(parameters)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    function DotNETURLEncode(string) {
      const list = {
        '%2D': '-',
        '%5F': '_',
        '%2E': '.',
        '%21': '!',
        '%2A': '*',
        '%28': '(',
        '%29': ')',
        '%20': '+',
      }

      Object.entries(list).forEach(([encoded, decoded]) => {
        const regex = new RegExp(encoded, 'g')
        string = string.replace(regex, decoded)
      })

      return string
    }

    const Step1 = Step0.split('&')
      .sort((a, b) => {
        const keyA = a.split('=')[0]
        const keyB = b.split('=')[0]
        return keyA.localeCompare(keyB)
      })
      .join('&')
    const Step2 = `HashKey=${HashKey}&${Step1}&HashIV=${HashIV}`
    const Step3 = DotNETURLEncode(encodeURIComponent(Step2))
    const Step4 = Step3.toLowerCase()
    const Step5 = crypto.createHash(algorithm).update(Step4).digest(digest)
    const Step6 = Step5.toUpperCase()
    return Step6
  }
  const CheckMacValue = CheckMacValueGen(ParamsBeforeCMV, algorithm, digest)

  //五、將所有的參數製作成 payload
  const AllParams = { ...ParamsBeforeCMV, CheckMacValue }

  // 六、製作送出畫面
  //
  // # region --- 純後端送出form的作法，可以進行簡單的測試用  ---

  const inputs = Object.entries(AllParams)
    .map(function (param) {
      return `<input name=${
        param[0]
      } value="${param[1].toString()}" style="display:none"><br/>`
    })
    .join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title></title>
    </head>
    <body>
        <form method="post" action="${APIURL}" style="display:none">
    ${inputs}
    <input type="submit" value="送出參數" style="display:none">
        </form>
    <script>
      document.forms[0].submit();
    </script>
    </body>
    </html>
    `
  res.send(htmlContent)
  // # endregion ----------------------------------------

  // 送至react前端，由前端產生表單控制送出的動作
  // 這是為了在前端可以更靈活的控制送出的動作
  // action: 表單送出的網址, params: 所有表單中的欄位參數值
  //successResponse(res, { action: APIURL, params: AllParams })
})

export default router
