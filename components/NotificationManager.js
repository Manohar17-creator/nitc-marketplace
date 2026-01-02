'use client'
import { useEffect } from 'react'
import { requestNotificationPermission, refreshNotificationToken } from '@/lib/firebase' // ✅ Added refreshNotificationToken
import { getUserData } from '@/lib/auth-client'

export default function NotificationManager() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const user = getUserData()
        if (!user) return // Not logged in

        // ✅ NEW: SILENT REFRESH
        // This ensures the backend always has the latest token without bothering the user.
        if (Notification.permission === 'granted') {
          console.log('🔄 Refreshing notification subscription...')
          await refreshNotificationToken(user._id || user.id) // Support both _id and id formats
        }

        // --- Existing Setup Logic ---
        
        // Check if already set up in this browser session
        const hasToken = localStorage.getItem('fcm_token_set')
        if (hasToken) {
          console.log('✅ Notifications already configured')
          return
        }

        // Only auto-request if permission is already granted
        if (Notification.permission === 'granted') {
          console.log('🔔 Auto-setting up notifications (permission already granted)')
          const token = await requestNotificationPermission(user._id || user.id)
          
          if (token) {
            localStorage.setItem('fcm_token_set', 'true')
            console.log('✅ Auto-setup complete')
          }
        } else {
          console.log('ℹ️ User can enable notifications from bell icon')
        }

      } catch (error) {
        console.error('Notification setup error:', error)
      }
    }

    // Delay setup to avoid blocking page load
    const timer = setTimeout(setupNotifications, 2000)
    return () => clearTimeout(timer) // Cleanup timer on unmount
  }, [])

  return null // This component doesn't render anything
}