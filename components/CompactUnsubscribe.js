'use client'
import { useState } from 'react'
import { BellOff, Loader } from 'lucide-react'
import { getAuthToken } from '@/lib/auth-client'

export default function CompactUnsubscribe() {
  const [loading, setLoading] = useState(false)

  const handleUnsubscribe = async () => {
    if (!confirm("Stop receiving notifications on this device?")) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('fcm_token')
      const authToken = getAuthToken()

      const res = await fetch('/api/notifications/unsubscribe-device', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcmToken: token })
      })

      if (res.ok) {
        localStorage.removeItem('fcm_token')
        localStorage.removeItem('notification_prompted') // Reset auto-prompt too
        
        // 🚀 Dispatch custom event to update the main button UI
        window.dispatchEvent(new Event('notification-status-change'))
        
        alert("Unsubscribed successfully ✅")
      }
    } catch (err) {
      alert("Failed to unsubscribe")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUnsubscribe}
      disabled={loading}
      className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
    >
      {loading ? <Loader size={10} className="animate-spin" /> : <BellOff size={10} />}
      UNSUBSCRIBE DEVICE
    </button>
  )
}