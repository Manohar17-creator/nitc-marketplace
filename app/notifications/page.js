'use client'
import { useState, useEffect } from 'react'
import { Bell, Clock } from 'lucide-react'
import { getAuthToken } from '@/lib/auth-client'

// 🚀 The word 'default' is mandatory here
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = getAuthToken()
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to load notifications:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Bell className="text-blue-600" size={24} /> Notifications
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Bell className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No updates from the campus yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n._id} className={`p-4 rounded-xl border transition-all ${n.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold uppercase text-blue-600">{n.type || 'info'}</span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock size={10} /> {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{n.title}</h3>
              <p className="text-xs text-gray-600 mt-1">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}