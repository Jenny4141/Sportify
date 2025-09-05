import prisma from '../lib/prisma.js'

// 生成發票號碼：兩個大寫英文字母 + 八個數字
export const createInvoiceNumber = async () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' // 大寫英文字母
  let isUnique = false // 用於確保生成的發票號碼是唯一的
  let invoiceNumber = '' // 初始化發票號碼
  while (!isUnique) {
    // 生成兩個隨機大寫字母
    // Math.random() 會返回一個介於 0（包含）和 1（不包含）之間的隨機數
    // Math.floor() 用於向下取整數，確保我們得到的索引
    // letters.length 是 26
    // letters[...] => 用索引值 (index) 從 letters 字串中取出一個字元
    const letter1 = letters[Math.floor(Math.random() * letters.length)] // 第一個隨機大寫字母
    const letter2 = letters[Math.floor(Math.random() * letters.length)] // 第二個隨機大寫字母
    // 生成八個隨機數字
    // Math.random() * 100000000 會產生一個介於 0 到 99,999,999.999... 之間的浮點數
    // 將上述結果無條件捨去，得到一個介於 0 到 99,999,999 之間的隨機整數
    const numbers = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0') // 檢查字串的長度，
    // 如果長度小於第一個參數，它就會在字串的開頭填充第二個參數，直到長度達到 8
    invoiceNumber = letter1 + letter2 + numbers
    // 檢查資料庫中是否已存在此號碼（同時檢查訂單、預約和預訂表）
    const [existingOrder, existingReservation, existingBooking] =
      await Promise.all([
        prisma.order.findFirst({
          where: { invoiceNumber: invoiceNumber },
        }),
        prisma.reservation.findFirst({
          where: { invoiceNumber: invoiceNumber },
        }),
        prisma.booking.findFirst({
          where: { invoiceNumber: invoiceNumber },
        }),
      ])
    if (!existingOrder && !existingReservation && !existingBooking) {
      // 如果資料庫中沒有這個號碼，則認為它是唯一的
      isUnique = true
    }
  }
  return invoiceNumber
}
