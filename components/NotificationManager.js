'use client'
import { useEffect } from 'react'
import { requestNotificationPermission } from '@/lib/firebase'
import { getStoredUser } from '@/lib/auth-utils'

export default function NotificationManager() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const user = getStoredUser()
        if (!user) return // Not logged in

        // Check if already set up
        const hasToken = localStorage.getItem('fcm_token_set')
        if (hasToken) {
          console.log('✅ Notifications already configured')
          return
        }

        // Only auto-request if permission is already granted
        if (Notification.permission === 'granted') {
          console.log('🔔 Auto-setting up notifications (permission already granted)')
          const token = await requestNotificationPermission(user._id)
          
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
    setTimeout(setupNotifications, 2000)
  }, [])

  return null // This component doesn't render anything
}