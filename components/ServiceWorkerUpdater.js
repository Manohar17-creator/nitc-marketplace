'use client'
import { useEffect } from 'react'

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 1. Check for updates immediately when the app loads
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('🔄 Checking for Service Worker updates...')
          registration.update() // Ask server for new version
        })
      })

      // 2. Listen for a new worker installing
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('✅ New Service Worker took control. Reloading...')
        // Optional: Force reload to ensure user sees new app immediately
        // window.location.reload() 
      })
    }
  }, [])

  return null
}