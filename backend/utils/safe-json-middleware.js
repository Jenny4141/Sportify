export const safeJsonMiddleware = (req, res, next) => {
  const originalJson = res.json
  res.json = function (data) {
    const transformed = JSON.parse(
      JSON.stringify(data, (_, val) =>
        typeof val === 'bigint' ? val.toString() : val
      )
    )
    return originalJson.call(this, transformed)
  }
  next()
}
