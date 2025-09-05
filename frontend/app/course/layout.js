import { CourseProvider } from '@/contexts/course-context'

export default function CourseLayout({ children }) {
  return <CourseProvider>{children}</CourseProvider>
}
