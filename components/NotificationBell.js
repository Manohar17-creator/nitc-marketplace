'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Calendar, MessageCircle, Radio, Info } from 'lucide-react' // 👈 Import more icons
import { getUserData, getAuthToken, isAuthenticated } from '@/lib/auth-client'

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    const token = getAuthToken()
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
    // Poll every 30 seconds for new updates
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

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read logic (Keep this as is)
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      const token = getAuthToken()
      await fetch(`/api/notifications/${notif._id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    }

    setIsOpen(false)

    // 2. 🚀 FIXED REDIRECTION LOGIC
    if (!notif.link) {
      console.log("No link provided for this notification, staying on page.");
      return; // Do nothing if there's no link, preventing 404
    }

    // Optional: Add a safety check for absolute vs relative paths
    const targetPath = notif.link.startsWith('/') ? notif.link : `/${notif.link}`;
    router.push(targetPath);
  }

  // 🎨 Helper to get icon based on notification type
  const getIcon = (type) => {
    switch (type) {
      case 'event': return <Calendar size={18} className="text-orange-500" />
      case 'post': return <MessageCircle size={18} className="text-green-500" />
      case 'broadcast': return <Radio size={18} className="text-red-500" />
      default: return <Info size={18} className="text-blue-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 hover:bg-blue-50/10 rounded-full transition-colors">
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
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer ${notif.read ? 'opacity-60 bg-white' : 'bg-blue-50/40'}`}
                >
                  <div className="flex gap-3">
                    {/* Icon Container */}
                    <div className="mt-1 shrink-0">
                       {getIcon(notif.type)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    {/* Unread Dot */}
                    {!notif.read && <div className="mt-2 w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
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