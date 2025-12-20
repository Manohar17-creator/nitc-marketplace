'use client'
import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, Loader } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/firebase'

export default function NotificationSettingsButton({ userId }) {
  const [status, setStatus] = useState('loading') // Start with loading to prevent flash
  const [error, setError] = useState(null)

  // ✅ FIX: Check permission status immediately on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setStatus('granted')
      } else if (Notification.permission === 'denied') {
        setStatus('denied')
      } else {
        setStatus('default')
      }
    } else {
      setStatus('default')
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (status === 'granted') return

    setStatus('requesting')
    setError(null)
    
    const token = await requestNotificationPermission(userId)

    if (token) {
      setStatus('granted')
      localStorage.setItem('notification_asked', 'true')
    } else {
      // Check if permission was denied by the user
      if (Notification.permission === 'denied') {
        setStatus('denied')
        setError('Permission denied. Please enable notifications manually in your browser settings (lock icon next to the URL).')
      } else {
        setStatus('default')
        setError('Setup failed. Please try again.')
      }
    }
  }

  const renderButtonContent = () => {
    if (status === 'loading') return <span className="opacity-0">...</span> // Invisible while checking
    
    if (status === 'requesting') {
      return (
        <>
          <Loader size={16} className="animate-spin" />
          Enabling...
        </>
      )
    }
    if (status === 'granted') {
      return (
        <>
          <CheckCircle size={16} />
          Notifications Active
        </>
      )
    }
    return (
      <>
        <Bell size={16} />
        Enable Notifications
      </>
    )
  }

  // Prevent rendering anything until we check status (optional, but cleaner)
  if (status === 'loading') {
     return (
        <div className="w-full py-3 px-4 rounded-lg bg-gray-100 animate-pulse h-[48px]" />
     )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleEnableNotifications}
        disabled={status === 'granted' || status === 'requesting'}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2
          ${status === 'granted' 
            ? 'bg-green-100 text-green-700 cursor-default border border-green-200'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98 shadow-sm'
          }
          ${status === 'denied' && 'bg-red-50 text-red-600 border border-red-200'}
        `}
      >
        {renderButtonContent()}
      </button>
      
      {error && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
          <X size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}