const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // 處理跨域問題
    image.src = url
  })

export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  quality = 0.8,
  outputFormat = 'jpeg'
) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // 計算實際的裁切尺寸
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  // 設定畫布尺寸為裁切區域的實際像素尺寸
  canvas.width = Math.floor(pixelCrop.width * scaleX)
  canvas.height = Math.floor(pixelCrop.height * scaleY)

  // 設定高品質渲染
  ctx.imageSmoothingQuality = 'high'
  ctx.imageSmoothingEnabled = true

  // 計算裁切位置
  const cropX = Math.floor(pixelCrop.x * scaleX)
  const cropY = Math.floor(pixelCrop.y * scaleY)

  // 直接繪製裁切區域
  ctx.drawImage(
    image,
    cropX,
    cropY,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  // 根據輸出格式決定 MIME 類型和檔案副檔名
  let mimeType, fileExtension
  switch (outputFormat.toLowerCase()) {
    case 'png':
      mimeType = 'image/png'
      fileExtension = 'png'
      break
    case 'webp':
      mimeType = 'image/webp'
      fileExtension = 'webp'
      break
    case 'jpeg':
    case 'jpg':
    default:
      mimeType = 'image/jpeg'
      fileExtension = 'jpg'
      break
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty')
          return
        }

        // 設定檔案名稱和類型
        blob.name = `cropped-avatar.${fileExtension}`

        // 創建一個新的 File 物件，包含更多檔案資訊
        const file = new File([blob], blob.name, {
          type: mimeType,
          lastModified: Date.now(),
        })

        resolve(file)
      },
      mimeType,
      quality
    )
  })
}
