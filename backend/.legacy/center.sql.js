import { z } from 'zod'
import db from '../utils/connect-mysql.js'

// *** zod 建立 Schema 驗證規則
const centerSchema = z.object({
  name: z.string().nonempty({ message: '帳號為必填欄位' }),
  location_id: z.string().nonempty({ message: '帳號為必填欄位' }),
})

// *** 定義排序的類型 Order By
const orderByMapping = {
  id_asc: ' ORDER BY c.id ',
  id_desc: ' ORDER BY c.id DESC ',
}

// *** 取得列表資料
export const getListData = async ({ page = 1, keyword = '', orderby = '' }) => {
  const perPage = 20 // 每頁最多有幾筆
  // 回傳的物件
  let output = {
    success: false,
    redirect: '',
    totalRows: 0,
    totalPages: 0,
    page,
    perPage,
    rows: [],
  }

  if (page < 1) {
    return { code: 400, ...output, redirect: '?page=1' }
  }

  let sqlWhere = ' WHERE 1 '

  if (keyword) {
    const keywordEsc = db.escape(`%${keyword}%`) // 避免 SQL injection
    sqlWhere += ` AND ( c.name LIKE ${keywordEsc} OR l.name LIKE ${keywordEsc} ) `
  }

  let orderByFrag = orderByMapping[orderby] || ' ORDER BY c.id DESC '

  const t_sql = `SELECT COUNT(1) totalRows FROM center c 
                  JOIN location l ON c.location_id = l.id
                  ${sqlWhere}`
  const [[{ totalRows }]] = await db.query(t_sql) // 多重解構

  if (totalRows === 0)
    return { code: 200, ...output, success: true, totalRows: 0 }

  let totalPages = 0 // 預設值
  let rows = []

  // 有資料才做
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage)
    if (page > totalPages) {
      return { code: 400, ...output, redirect: `?page=${totalPages}` }
    }

    const sql = `SELECT c.*, l.name AS location_name 
                  FROM center c
                  JOIN location l ON c.location_id = l.id
                  ${sqlWhere} 
                  ${orderByFrag} 
                  LIMIT ${(page - 1) * perPage}, ${perPage}`
    ;[rows] = await db.query(sql)
  }
  return {
    code: 200,
    ...output,
    success: true,
    totalRows,
    totalPages,
    page,
    rows,
  }
}

// *** 取得地區資料的函式
export const getLocationData = async () => {
  const sql = 'SELECT id, name FROM location'
  const [rows] = await db.query(sql) // 多重解構
  if (rows.length === 0) {
    return { code: 404, success: false, message: '沒有資料', rows: [] }
  }
  return { code: 200, success: true, rows }
}

// *** 取得單筆資料
export const getItemData = async (id) => {
  if (!+id) {
    return { code: 400, success: false, message: '錯誤的編號', record: {} }
  }

  const sql = 'SELECT * FROM center WHERE id=?'
  const [rows] = await db.query(sql, [id])
  if (!rows.length) {
    return { code: 404, success: false, message: '沒有該筆資料', record: {} }
  }

  return { code: 200, success: true, record: rows[0] }
}

// *** 新增資料
export const createCenter = async ({ name, location_id }) => {
  const output = {
    success: false,
    insertId: 0,
    issues: [],
  }

  // *** zod 使用 safeParse 驗證表單
  const zodResult = centerSchema.safeParse({
    name,
    location_id,
  })
  if (!zodResult.success) {
    if (zodResult.error?.issues?.length) {
      output.issues = zodResult.error.issues
    }
    return { code: 400, ...output }
  }

  const sql = 'INSERT INTO `center` SET ?'

  try {
    const [result] = await db.query(sql, [{ name, location_id }])
    output.success = !!result.affectedRows
    if (output.success) {
      output.insertId = result.insertId
    }
    return { code: 200, ...output }
  } catch (error) {
    return { code: 500, ...output }
  }
}

// *** 編輯資料
export const updateCenter = async (id, { name, location_id }) => {
  const output = {
    success: false,
    issues: [],
  }

  // 確認資料是否存在
  const [checkRows] = await db.query('SELECT id FROM center WHERE id=?', [id])
  if (checkRows.length === 0) {
    return { code: 404, success: false, message: '找不到資料' }
  }

  // *** 表單驗證
  const zodResult = centerSchema.safeParse({
    name,
    location_id,
  })
  if (!zodResult.success) {
    if (zodResult.error?.issues?.length) {
      output.issues = zodResult.error.issues
    }
    return { code: 400, ...output }
  }

  const sql = 'UPDATE `center` SET ? WHERE id=?'

  try {
    const [result] = await db.query(sql, [{ name, location_id }, id])
    // output.success = !!result.affectedRows;
    output.success = !!result.changedRows
    if (output.success) {
      return { code: 200, ...output }
    }
  } catch (error) {
    console.log(error)
    console.error(error)
    return { code: 500, ...output }
  }
}

// *** 多選刪除資料
export const deleteMultipleCenters = async (ids = []) => {
  const output = {
    success: false,
    affectedRows: 0,
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 400, ...output, message: '未提供要刪除的項目' }
  }

  const items = ids.map((item) => db.escape(item)) // 防範 SQL injection
  const sql = `DELETE FROM center WHERE id IN (${items.join(',')})`
  const [result] = await db.query(sql)
  output.affectedRows = result.affectedRows
  output.success = !!result.affectedRows
  return { code: 200, ...output }
}

// *** 刪除資料
export const deleteCenter = async (id) => {
  if (!+id) return { code: 400, success: false, message: '錯誤的編號' }
  const [rows] = await db.query('SELECT id FROM center WHERE id=?', [id]) // 取得修改前的資料
  if (rows.length === 0) {
    return { code: 404, success: false, message: '沒有該筆資料' }
  }
  const sql = 'DELETE FROM center WHERE id=?'
  const [result] = await db.query(sql, [id])
  return {
    code: 200,
    success: !!result.affectedRows,
    affectedRows: result.affectedRows,
  }
}
