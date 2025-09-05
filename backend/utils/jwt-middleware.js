import jwt from 'jsonwebtoken'

export function jwtMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: '未提供 token' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(403).json({ message: 'Token 無效或過期' })
  }
}

// 商品列表用，有會員id就會顯示收藏，沒有也不會有錯誤
export function optionalJwtMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
    } catch {
      req.user = undefined
    }
  }
  next()
}
