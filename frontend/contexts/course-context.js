'use client'
import { createContext, useContext, useState } from 'react'

const CourseContext = createContext(null)

export const CourseProvider = ({ children }) => {
  const [courseData, setCourseData] = useState({
    lessonId: null,
    userInfo: {
      name: '',
      phone: '',
    },
    paymentMethod: '',
    receiptType: '',
  })

  return (
    <CourseContext.Provider value={{ courseData, setCourseData }}>
      {children}
    </CourseContext.Provider>
  )
}

// 自訂 hook
export function useCourse() {
  const context = useContext(CourseContext)
  if (!context) {
    throw new Error('useCourse 必須在 CourseProvider 中使用')
  }
  return context
}
