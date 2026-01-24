import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'

// 定義支援的圖片格式
const extMap = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
}

const fileFilter = (req, file, callback) => {
  callback(null, !!extMap[file.mimetype])
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/product-imgs')
  },

  filename: (req, file, callback) => {
    const timestamp = Date.now()
    const uuid = uuidv4()
    const ext = extMap[file.mimetype]
    const name = `product-${timestamp}-${uuid}${ext}`
    callback(null, name)
  },
})

export default multer({
  fileFilter,
  storage,
})
