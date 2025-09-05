'use client'

import React, { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import Cropper from 'react-easy-crop'
import getCroppedImg from '@/utils/cropImage'

export default function ImageCropDialog({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspect = 1,
  cropShape = 'round',
  onDialogClose,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // 當對話框開啟時重置狀態
  React.useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
  }, [isOpen])

  const onCropCompleteCallback = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) {
      alert('請先裁切圖片')
      return
    }

    setIsProcessing(true)
    try {
      const croppedFile = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0.8,
        'jpeg' // 使用 JPEG 作為預設格式，檔案較小且相容性好
      )
      onCropComplete(croppedFile)
      // 清空檔案輸入以允許重新選擇相同檔案
      if (onDialogClose) {
        onDialogClose()
      }
      onClose()
    } catch (error) {
      console.error('裁切失敗:', error)
      alert('裁切失敗，請稍後再試')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    if (onDialogClose) {
      onDialogClose()
    }
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onDialogClose) {
          onDialogClose()
        }
        onClose()
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">裁切頭像</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 裁切區域 */}
          <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropCompleteCallback}
              showGrid={false}
              objectFit="contain"
              minZoom={0.5}
              maxZoom={5}
              zoomSpeed={0.1}
            />
          </div>

          {/* 縮放控制 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">縮放控制</label>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={0.5}
              max={5}
              step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>50%</span>
              <span>{Math.round(zoom * 100)}%</span>
              <span>500%</span>
            </div>
          </div>

          {/* 操作提示 */}
          <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 rounded">
            💡 拖曳圖片調整位置，使用滑桿調整縮放，確保頭像在圓形區域內
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPixels}
            >
              {isProcessing ? '處理中...' : '確認裁切'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
