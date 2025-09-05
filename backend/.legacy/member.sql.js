import express from 'express'
import moment from 'moment-timezone'
import db from '../utils/connect-mysql.js'

const router = express.Router()

// *** 定義排序的類型 Order By
const orderByMapping = {
  id_asc: ' ORDER BY m.id ',
  id_desc: ' ORDER BY m.id DESC ',
}

// *** 取得列表資料的函式
const getListData = async (req) => {
  const perPage = 20 // 每頁最多有幾筆
  // 回傳的物件
  let output = {
    success: false,
    redirect: '',
    totalRows: 0,
    totalPages: 0,
    page: 0,
    perPage,
    rows: [],
  }

  const page = +req.query.page || 1 // 預設值為 1
  if (page < 1) {
    output.redirect = `?page=1` // 有設定表示要跳轉頁面
    return output
  }

  const keyword = req.query.keyword || ''
  const orderby = req.query.orderby || ''

  let sqlWhere = ' WHERE 1 '

  if (keyword) {
    const keywordEsc = db.escape(`%${keyword}%`) // 避免 SQL injection
    sqlWhere += ` AND ( 
    member.account LIKE ${keywordEsc} OR member.email LIKE ${keywordEsc} OR member.name LIKE ${keywordEsc} ) `
  }

  let orderByFrag = orderByMapping[orderby] || ' ORDER BY m.id DESC '

  const t_sql = `SELECT COUNT(1) totalRows FROM member m
                  ${sqlWhere}`
  const [[{ totalRows }]] = await db.query(t_sql) // 多重解構

  let totalPages = 0 // 預設值
  let rows = []

  // 有資料才做
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage)
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}` // 有設定表示要跳轉頁面
      return output
    }

    const sql = `SELECT m.*
                  FROM member m
                  ${sqlWhere} 
                  ${orderByFrag} 
                  LIMIT ${(page - 1) * perPage}, ${perPage}`
    ;[rows] = await db.query(sql)
    rows.forEach((v) => {
      // 轉換生日格式，沒有給的話就放空字串
      const m = moment(v.birth_date)
      if (m.isValid()) {
        v.birth_date = m.format('YYYY-MM-DD')
      } else {
        v.birth_date = ''
      }
    })
  }
  output = { ...output, success: true, page, totalRows, totalPages, rows }
  return output
}

// *** 取得單筆資料的函式
const getItemData = async (req) => {
  const output = {
    success: false,
    record: {}, // 單筆資料
    code: 0,
    message: '',
  }
  const id = +req.params.id || 0
  if (!id) {
    return { ...output, code: 400, message: '錯誤的編號' }
  }
  // 讀取資料
  const sql = 'SELECT * FROM member WHERE id=?'
  const [rows] = await db.query(sql, [id])
  if (rows.length === 0) {
    return { ...output, code: 404, message: '沒有該筆資料' }
  }
  return { ...output, code: 200, success: true, record: rows[0] }
}

// ========================= API 的路由 =========================

// *** 取得列表資料
router.get('/', async (req, res) => {
  const data = await getListData(req)
  res.json(data)
})

// *** 取得單筆資料
router.get('/:id', async (req, res) => {
  res.json(await getItemData(req))
})

// *** 編輯資料的 API
/* router.put('/api/:id', upload.none(), async (req, res) => {
  const output = {
    success: false, // 有沒有編輯成功
    bodyData: req.body, // 除錯用
    issues: [], // zod 檢查的錯誤信息
  }

  const ori = await getItemData(req) // 取得未修改前的資料
  if (!ori.success) {
    return res.status(404).json(output) // 沒有這筆資料
  }
  const id = ori.record.id

  let { name, location_id } = req.body

  // *** 表單驗證
  const zodResult = abItemSchema.safeParse({
    name,
    location_id,
  })
  if (!zodResult.success) {
    if (zodResult.error?.issues?.length) {
      output.issues = zodResult.error.issues
    }
    return res.status(400).json(output)
  }

  const sql = 'UPDATE `centers` SET ? WHERE id=?'

  try {
    const [result] = await db.query(sql, [{ name, location_id }, id])
    // output.success = !!result.affectedRows;
    output.success = !!result.changedRows
    if (output.success) {
      res.status(200)
    }
  } catch (error) {
    console.log(error)
    res.status(400)
    // res.status(400).json({ error: error.message });
  }
  res.json(output)
}) */

// *** 多選刪除資料的 API
router.delete('/multi', async (req, res) => {
  const output = {
    success: false,
    affectedRows: 0,
  }
  if (!req.body.checkedItems || !req.body.checkedItems.length) {
    return res.status(400).json(output)
  }
  const items = req.body.checkedItems.map((item) => db.escape(item)) // 防範 SQL injection
  const sql = `DELETE FROM member WHERE id IN (${items.join(',')})`
  const [result] = await db.query(sql)
  output.affectedRows = result.affectedRows
  output.success = !!result.affectedRows
  res.json(output)
})

// *** 刪除資料的 API
router.delete('/:id', async (req, res) => {
  const ori = await getItemData(req) // 取得未修改前的資料
  if (!ori.success) {
    return res.status(404).json({ success: false }) // 沒有這筆資料
  }
  const sql = 'DELETE FROM member WHERE id=?'
  const [result] = await db.query(sql, [ori.record.id])
  res.json({ success: !!result.affectedRows })
})

export default router
