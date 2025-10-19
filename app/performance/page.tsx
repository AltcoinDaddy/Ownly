import { PerformanceDashboard } from '@/components/performance-dashboard'

export default function PerformancePage() {
  return (
    <div className="container mx-auto py-8">
      <PerformanceDashboard />
    </div>
  )
}

export const metadata = {
  title: 'Performance Dashboard - Ownly',
  description: 'Monitor API performance, event processing, and system metrics'
}