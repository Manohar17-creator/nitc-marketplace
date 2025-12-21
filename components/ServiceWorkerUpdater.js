'use client'
import { useEffect } from 'react'

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Check for SW updates immediately on load to kill "Ghost Workers"
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('🔄 Checking for Service Worker updates...')
          registration.update()
        })
      })
    }
  }, [])

  return null // This component doesn't render anything visible
}