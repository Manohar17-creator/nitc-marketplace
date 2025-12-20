'use client'
import { useEffect, useState } from 'react'
import { getMessaging, onMessage } from 'firebase/messaging'
import { initializeApp, getApps } from 'firebase/app'
import { X, Bell } from 'lucide-react'

// KEEP YOUR EXISTING FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "...", // Your config
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}

export default function ForegroundToast() {
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const messaging = getMessaging(app)
        
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('🔔 Foreground Message:', payload)
          
          // 1. Show the In-App "White Box"
          setNotification({
            title: payload.notification?.title,
            body: payload.notification?.body,
          })

          // 👇 2. FORCE SYSTEM BANNER (The "Laptop Notification")
          if (Notification.permission === 'granted') {
             try {
               // We removed the 'icon' property so it works even if you have no image
               new Notification(payload.notification.title, {
                 body: payload.notification.body,
                 silent: false // Try to play a sound if allowed
               })
             } catch (e) {
               console.error("System notification failed:", e)
             }
          }

          setTimeout(() => setNotification(null), 5000)
        })

        return () => unsubscribe()
      } catch (error) {
        console.log('Foreground error', error)
      }
    }
  }, [])

  if (!notification) return null

  // ... (Keep the return JSX exactly as it was)
  return (
    <div className="fixed top-4 left-4 right-4 z-[100] animate-in slide-in-from-top-2">
      <div className="bg-white/95 backdrop-blur shadow-2xl rounded-xl p-4 border border-blue-100 max-w-md mx-auto flex gap-4 items-start">
        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
          <Bell size={20} fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-0.5">{notification.body}</p>
        </div>
        <button 
          onClick={() => setNotification(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}