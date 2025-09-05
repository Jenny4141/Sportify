import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'

// 1. 定義 extMap：限制允許的檔案類型
const extMap = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
}

// 2. 檔案篩選 (fileFilter)
const fileFilter = (req, file, callback) => {
  callback(null, !!extMap[file.mimetype])
}

// 3. 設定存儲位置 (storage)
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/center-imgs')
  },
  // 4. 設定檔案命名
  filename: (req, file, callback) => {
    // 統一檔名格式：center-<centerId>-<timestamp>-<uuid>.<副檔名>
    const timestamp = Date.now()
    const uuid = uuidv4()
    const ext = extMap[file.mimetype]
    const name = `center-${timestamp}-${uuid}${ext}`
    callback(null, name)
  },
})

// 5. 匯出 multer 設定
export default multer({ fileFilter, storage })
