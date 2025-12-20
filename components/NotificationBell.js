'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation' // 👈 Added router
import { Bell } from 'lucide-react'

export default function NotificationBell() {
  const router = useRouter() // 👈 Initialize router
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.notifications.filter(n => !n.read).length)
      }
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 👇 UPDATED HANDLE CLICK
  const handleNotificationClick = async (notif) => {
    // 1. Mark as read immediately (UI)
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      // API Call in background
      const token = localStorage.getItem('token')
      await fetch(`/api/notifications/${notif._id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }

    // 2. Close Dropdown
    setIsOpen(false)

    // 3. Navigate if link exists
    if (notif.link) {
      router.push(notif.link)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
        <Bell className="text-white" size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-blue-600">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Notifications</h3>
            <button onClick={fetchNotifications} className="text-xs text-blue-600 hover:underline">Refresh</button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif._id} 
                  onClick={() => handleNotificationClick(notif)} // 👈 Updated Handler
                  className={`p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-blue-50/50'}`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-transparent' : 'bg-blue-600'}`} />
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                      <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}