import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { jwtMiddleware } from '../../utils/jwt-middleware.js'
import prisma from '../../lib/prisma.js'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 設定 multer 儲存
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/avatars'))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(
      null,
      `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`
    )
  },
})

// 檔案過濾
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('只允許上傳 JPG, PNG, GIF 格式的圖片'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// 上傳頭像
router.post('/', jwtMiddleware, upload.single('avatar'), async (req, res) => {
  const output = {
    success: false,
    code: 0,
    issues: [],
  }

  try {
    if (!req.file) {
      output.code = 400
      output.issues = [{ message: '請選擇要上傳的圖片' }]
      return res.status(400).json(output)
    }

    // 建立檔案路徑
    const avatarPath = `${req.file.filename}`

    // 更新資料庫中的頭像路徑
    const updatedMember = await prisma.member.update({
      where: { id: BigInt(req.user.id) },
      data: { avatar: avatarPath },
    })

    // 取得更新後的完整用戶資料
    const updatedUser = await prisma.member.findUnique({
      where: { id: BigInt(req.user.id) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        gender: true,
        birth: true,
        address: true,
      },
    })

    output.success = true
    output.code = 200
    output.avatar = avatarPath
    output.message = '頭像上傳成功'
    output.user = {
      ...updatedUser,
      id: updatedUser.id.toString(),
    }
  } catch (error) {
    console.error('上傳頭像錯誤：', error)
    output.code = 500
    output.issues = [{ message: '上傳失敗，請稍後再試' }]
  }

  res.status(output.code).json(output)
})

// 提供頭像檔案服務
router.get('/:filename', (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(__dirname, '../../public/avatars', filename)
  res.sendFile(filePath)
})

export default router
