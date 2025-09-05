'use client'

import { useEffect, useRef, useState } from 'react'

export default function SimpleMap({ position, dataName }) {
  const mapRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let mounted = true

    const loadMap = async () => {
      try {
        // 簡單的延遲確保 DOM 完全準備好
        await new Promise((resolve) => setTimeout(resolve, 300))

        if (!mounted || !mapRef.current) return

        const L = (await import('leaflet')).default

        // 清理任何現有的地圖
        if (mapRef.current._leaflet_id) {
          mapRef.current._leaflet_id = undefined
        }
        mapRef.current.innerHTML = ''

        // 設置紅色自定義圖標
        delete L.Icon.Default.prototype._getIconUrl
        const redIcon = L.icon({
          iconRetinaUrl:
            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          iconUrl:
            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })

        // 創建地圖實例
        const map = L.map(mapRef.current, {
          center: position,
          zoom: 13,
          scrollWheelZoom: false,
        })

        // 添加瓦片圖層
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map)

        // 添加紅色標記
        L.marker(position, { icon: redIcon })
          .addTo(map)
          .bindPopup(`📍 ${dataName}`)
          .openPopup() // 自動打開彈出視窗

        if (mounted) {
          setIsLoaded(true)
        }
      } catch (err) {
        console.error('地圖載入錯誤:', err)
        if (mounted) {
          setError(err.message)
        }
      }
    }

    loadMap()

    return () => {
      mounted = false
    }
  }, [position, dataName])

  if (error) {
    return (
      <div className="w-full h-96 rounded-lg border border-dashed border-muted-foreground/25 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">地圖暫時無法載入</p>
          <p className="text-xs text-muted-foreground/70">
            位置: {position[0]}, {position[1]}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border">
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '384px' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <p className="text-sm text-accent">正在載入地圖...</p>
        </div>
      )}
    </div>
  )
}
