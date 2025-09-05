import { VenueProvider } from '@/contexts/venue-context'

export default function VenueLayout({ children }) {
  return <VenueProvider>{children}</VenueProvider>
}
