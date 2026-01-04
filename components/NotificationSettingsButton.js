'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCircle, Loader, AlertCircle, RefreshCcw } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/firebase'
import { getUserData } from '@/lib/auth-client'

export default function NotificationSettingsButton() {
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState(null)
  const isMounted = useRef(true) // 🚀 Prevents state updates if user leaves the tab

  const checkCurrentStatus = () => {
    // Check if user is logged in
    const user = getUserData()
    if (user?.id) setUserId(user.id)

    // Check for local FCM token first to sync with Unsubscribe action
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('fcm_token') : null

    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Logic: It's only "Granted" if browser permission is ON and we have a local token
      if (Notification.permission === 'granted' && localToken) {
        setStatus('granted')
      } else if (Notification.permission === 'denied') {
        setStatus('denied')
      } else {
        setStatus('default')
      }
    } else {
      setStatus('unsupported')
    }
  }

  useEffect(() => {
    isMounted.current = true
    checkCurrentStatus()

    // 🚀 Listen for Unsubscribe events to instantly change button back to "Enable"
    window.addEventListener('notification-status-change', checkCurrentStatus)
    
    return () => {
      isMounted.current = false
      window.removeEventListener('notification-status-change', checkCurrentStatus)
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (status === 'granted' || !userId) return

    setStatus('requesting')
    setError(null)
    
    try {
      // Triggers optimized Firebase logic with internal timeouts
      const token = await requestNotificationPermission(userId)

      if (!isMounted.current) return

      if (token) {
        setStatus('granted')
        localStorage.setItem('notification_asked', 'true')
      } else {
        // Handle cases where browser setup hangs or fails
        setStatus('default')
        setError('Setup timed out or failed. Please keep this tab open while enabling.')
      }
    } catch (err) {
      if (!isMounted.current) return
      console.error('Notification setup error:', err)
      setStatus('default')
      setError('An error occurred. Please try again.')
    }
  }

  // 🚀 Retry logic for mobile users
  const resetAndRetry = () => {
    setError(null)
    checkCurrentStatus()
  }

  const renderButtonContent = () => {
    if (error && status !== 'requesting') {
      return <><RefreshCcw size={16} /> Retry Setup</>
    }

    switch (status) {
      case 'requesting':
        return <><Loader size={16} className="animate-spin" /> Enabling...</>
      case 'granted':
        return <><CheckCircle size={16} /> Notifications Active</>
      case 'denied':
        return <><AlertCircle size={16} /> Notifications Blocked</>
      case 'unsupported':
        return <><AlertCircle size={16} /> Not Supported</>
      default:
        return <><Bell size={16} /> Enable Notifications</>
    }
  }

  const getButtonStyles = () => {
    if (error && status !== 'requesting') return 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'

    switch (status) {
      case 'granted':
        return 'bg-green-100 text-green-700 cursor-default border border-green-200'
      case 'denied':
        return 'bg-red-50 text-red-600 border border-red-200'
      case 'unsupported':
        return 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
      case 'requesting':
        return 'bg-blue-400 text-white cursor-wait animate-pulse'
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98 shadow-sm'
    }
  }

  if (status === 'loading') {
    return <div className="w-full py-3 px-4 rounded-lg bg-gray-100 animate-pulse h-[48px]" />
  }

  return (
    <div className="space-y-3">
      <button
        onClick={error ? resetAndRetry : handleEnableNotifications}
        disabled={(status === 'granted' || status === 'requesting' || status === 'unsupported') && !error}
        className={`w-full py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${getButtonStyles()}`}
      >
        {renderButtonContent()}
      </button>
      
      {error && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
          <X size={16} className="mt-0.5 flex-shrink-0 cursor-pointer" onClick={() => setError(null)} />
          <span>{error}</span>
        </div>
      )}

      {status === 'denied' && (
        <div className="p-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-bold mb-1 text-amber-800">Browser Action Required:</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700">
            <li>Click the <strong>lock icon</strong> in your address bar</li>
            <li>Set Notifications to <strong>&quot;Allow&quot;</strong></li>
            <li>Refresh the page and click Enable again</li>
          </ol>
        </div>
      )}
    </div>
  )
}