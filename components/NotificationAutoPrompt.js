'use client'
import { useEffect } from 'react'
import { getUserData } from '@/lib/auth-client'
import { requestNotificationPermission } from '@/lib/firebase'

export default function NotificationAutoPrompt() {
  useEffect(() => {
    const triggerPrompt = async () => {
      // 1. Check if user is logged in
      const user = getUserData()
      if (!user?.id) return

      // 2. Check if we have already asked in this browser
      const alreadyAsked = localStorage.getItem('notification_prompted')
      
      // 3. Only prompt if it's the first time and permission is 'default'
      if (!alreadyAsked && Notification.permission === 'default') {
        console.log("🚀 First time entry: Prompting for notifications...")
        
        // This triggers your lib/firebase.js logic
        const token = await requestNotificationPermission(user.id)
        
        // Mark as prompted regardless of whether they said yes or no
        // to avoid annoying them on every page load
        localStorage.setItem('notification_prompted', 'true')
      }
    }

    // 🚀 Wait 3 seconds after load so the student isn't hit immediately
    const timer = setTimeout(triggerPrompt, 3000)
    return () => clearTimeout(timer)
  }, [])

  return null // This component has no UI
}