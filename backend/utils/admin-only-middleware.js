// utils/adminOnlyMiddleware.js
export function adminOnlyMiddleware(req, res, next) {
  if (req.user?.role === 'admin') {
    return next()
  }
  return res.status(403).json({ message: '沒有管理員權限' })
}
