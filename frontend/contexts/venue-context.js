'use client'
import { createContext, useContext, useState } from 'react'

const VenueContext = createContext(null)

export const VenueProvider = ({ children }) => {
  const [venueData, setVenueData] = useState({
    center: '',
    sport: '',
    centerId: null,
    sportId: null,
    selectedDate: null,
    timeSlots: [],
    totalPrice: 0,
    userInfo: {
      name: '',
      phone: '',
    },
    paymentMethod: '',
    receiptType: '',
  })

  return (
    <VenueContext.Provider value={{ venueData, setVenueData }}>
      {children}
    </VenueContext.Provider>
  )
}

// 自訂 hook
export function useVenue() {
  const context = useContext(VenueContext)
  if (!context) {
    throw new Error('useVenue 必須在 VenueProvider 中使用')
  }
  return context
}
