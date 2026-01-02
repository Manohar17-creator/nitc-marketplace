'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/firebase'
import { getUserData } from '@/lib/auth-client'

export default function NotificationToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setEnabled(Notification.permission === 'granted')
    }
    setChecking(false)
  }, [])

  const handleToggle = async () => {
    if (enabled) {
      // Show better instructions for disabling
      const message = navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')
        ? 'To disable notifications:\n1. Click the lock icon in the address bar\n2. Find "Notifications" and change to "Block"\n3. Refresh the page'
        : 'To disable notifications, go to your browser settings and block notifications for this site, then refresh the page.'
      
      alert(message)
      return
    }

    setLoading(true)
    try {
      const user = getUserData()
      
      if (!user || !user.id) {
        alert('Please login first')
        setLoading(false)
        return
      }

      const token = await requestNotificationPermission(user.id)
      
      if (token) {
        setEnabled(true)
        
        // Show success message
        if (typeof window !== 'undefined') {
          const successMsg = document.createElement('div')
          successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right'
          successMsg.textContent = '✅ Notifications enabled!'
          document.body.appendChild(successMsg)
          setTimeout(() => successMsg.remove(), 3000)
        }
      } else {
        // Check if denied
        if (Notification.permission === 'denied') {
          alert('❌ Notifications blocked. Please enable them in your browser settings (click the lock icon next to the URL).')
        } else {
          alert('❌ Failed to enable notifications. Please try again.')
        }
      }
    } catch (error) {
      console.error('Toggle error:', error)
      alert('Failed to enable notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-gray-50 border-gray-300 text-gray-400 cursor-wait"
      >
        <Loader size={18} className="animate-spin" />
        <span className="text-sm font-medium">Checking...</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
        enabled 
          ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100' 
          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
      } ${loading ? 'opacity-50 cursor-wait' : 'active:scale-95'}`}
    >
      {loading ? (
        <Loader size={18} className="animate-spin" />
      ) : enabled ? (
        <Bell size={18} />
      ) : (
        <BellOff size={18} />
      )}
      <span className="text-sm font-medium">
        {loading ? 'Enabling...' : enabled ? 'Notifications On' : 'Enable Notifications'}
      </span>
    </button>
  )
}