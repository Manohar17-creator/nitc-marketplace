'use client'
import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, Loader, AlertCircle } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/firebase'
import { getUserData } from '@/lib/auth-client'

export default function NotificationSettingsButton() {
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    // Get user ID from auth
    const user = getUserData()
    if (user?.id) {
      setUserId(user.id)
    }

    // Check notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setStatus('granted')
      } else if (Notification.permission === 'denied') {
        setStatus('denied')
      } else {
        setStatus('default')
      }
    } else {
      setStatus('unsupported')
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (status === 'granted' || !userId) return

    setStatus('requesting')
    setError(null)
    
    try {
      const token = await requestNotificationPermission(userId)

      if (token) {
        setStatus('granted')
        localStorage.setItem('notification_asked', 'true')
      } else {
        if (Notification.permission === 'denied') {
          setStatus('denied')
          setError('Permission denied. Enable notifications in your browser settings (click the lock icon next to the URL).')
        } else {
          setStatus('default')
          setError('Setup failed. Please try again.')
        }
      }
    } catch (err) {
      console.error('Notification setup error:', err)
      setStatus('default')
      setError('An error occurred. Please try again.')
    }
  }

  const renderButtonContent = () => {
    switch (status) {
      case 'loading':
        return <span className="opacity-0">Loading...</span>
      
      case 'requesting':
        return (
          <>
            <Loader size={16} className="animate-spin" />
            Enabling...
          </>
        )
      
      case 'granted':
        return (
          <>
            <CheckCircle size={16} />
            Notifications Active
          </>
        )
      
      case 'denied':
        return (
          <>
            <AlertCircle size={16} />
            Notifications Blocked
          </>
        )
      
      case 'unsupported':
        return (
          <>
            <AlertCircle size={16} />
            Not Supported
          </>
        )
      
      default:
        return (
          <>
            <Bell size={16} />
            Enable Notifications
          </>
        )
    }
  }

  const getButtonStyles = () => {
    switch (status) {
      case 'granted':
        return 'bg-green-100 text-green-700 cursor-default border border-green-200'
      
      case 'denied':
        return 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed'
      
      case 'unsupported':
        return 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
      
      case 'requesting':
        return 'bg-blue-500 text-white cursor-wait'
      
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98 shadow-sm'
    }
  }

  if (status === 'loading') {
    return (
      <div className="w-full py-3 px-4 rounded-lg bg-gray-100 animate-pulse h-[48px]" />
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleEnableNotifications}
        disabled={status === 'granted' || status === 'requesting' || status === 'denied' || status === 'unsupported' || !userId}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${getButtonStyles()}`}
      >
        {renderButtonContent()}
      </button>
      
      {error && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
          <X size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status === 'denied' && (
        <div className="p-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-semibold mb-1">How to enable notifications:</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-600">
            <li>Click the lock icon in your browser&apos;s address bar</li>
            <li>Find &quot;Notifications&quot; and change to &quot;Allow&quot;</li>
            <li>Refresh this page and try again</li>
          </ol>
        </div>
      )}

      {status === 'unsupported' && (
        <div className="p-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg">
          Your browser does not support notifications. Try using Chrome, Firefox, Safari, or Edge.
        </div>
      )}
    </div>
  )
}