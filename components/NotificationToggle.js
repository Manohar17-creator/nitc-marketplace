'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/firebase'
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function NotificationToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setEnabled(Notification.permission === 'granted')
    }
  }, [])

  const handleToggle = async () => {
    if (enabled) {
      alert('To disable notifications, go to your browser settings')
      return
    }

    setLoading(true)
    try {
      const user = getUserData()
      if (!user) {
        alert('Please login first')
        return
      }

      const token = await requestNotificationPermission(user._id)
      
      if (token) {
        setEnabled(true)
        alert('✅ Notifications enabled!')
      } else {
        alert('❌ Notification permission denied')
      }
    } catch (error) {
      console.error('Toggle error:', error)
      alert('Failed to enable notifications')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
  disabled={loading}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
    enabled 
      ? 'bg-green-50 border-green-500 text-green-700' 
      : 'bg-gray-50 border-gray-300 text-gray-700'
  }`}
    >
      {enabled ? <Bell size={18} /> : <BellOff size={18} />}
      <span className="text-sm font-medium">
        {loading ? 'Loading...' : enabled ? 'Notifications On' : 'Enable Notifications'}
      </span>
    </button>
  )
}