import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// Keep this for server-side or other parts of the app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize default app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export async function requestNotificationPermission(userId) {
  console.log('🔔 Starting notification permission request...')
  console.log('📱 Platform:', navigator.userAgent)
  
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) {
    alert('Your browser does not support notifications')
    return null
  }
  if (!('serviceWorker' in navigator)) {
    alert('Your browser does not support service workers')
    return null
  }

  try {
    console.log('📝 Current permission status:', Notification.permission)

    if (Notification.permission === 'granted') {
      console.log('✅ Permission already granted, getting token...')
      return await getTokenAndSave(userId)
    }

    if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser settings.')
      return null
    }

    console.log('🔔 Requesting permission from user...')
    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      console.log('❌ User denied notification permission')
      return null
    }

    console.log('✅ Permission granted! Getting token...')
    return await getTokenAndSave(userId)

  } catch (error) {
    console.error('❌ Failed to get notification permission:', error)
    alert(`Notification setup failed: ${error.message}`)
    return null
  }
}

async function getTokenAndSave(userId) {
  try {
    console.log('📝 Registering service worker...')
    
    // 1. Unregister ALL existing workers to ensure we are clean
    const existingRegistrations = await navigator.serviceWorker.getRegistrations()
    for (const reg of existingRegistrations) {
       console.log('🗑️ Unregistering SW:', reg.scope)
       await reg.unregister()
    }
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 200))

    // 2. Register New Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
    
    // 3. Force Wait for Active State
    let activeReg = registration
    if (registration.installing || registration.waiting) {
        console.log('⏳ Waiting for SW activation...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        activeReg = await navigator.serviceWorker.ready
    }

    console.log('✅ Service worker active. Initializing Firebase App...')

    // 🟢 UPDATED: Restored Environment Variables
    // The comment below acts as a "Cache Buster" to force a new file hash
    // CACHE_BUSTER_V2: Reverting to process.env
    const cleanConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    // Initialize a specific app instance for notifications to avoid conflicts
    let cleanApp;
    try {
        cleanApp = getApps().find(a => a.name === 'cleanApp') || initializeApp(cleanConfig, 'cleanApp');
    } catch (e) {
        cleanApp = initializeApp(cleanConfig, 'cleanApp'); 
    }

    const messaging = getMessaging(cleanApp)

    // 4. Get Token with Retry Logic
    let token = null
    let attempts = 0
    while (!token && attempts < 5) {
      try {
        attempts++
        console.log(`🔄 Attempt ${attempts} to get token...`)
        token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: activeReg
        })
        if (token) break
      } catch (e) {
        console.error(`❌ Attempt ${attempts} failed:`, e.code, e.message)
        await new Promise(r => setTimeout(r, 1000 * attempts))
      }
    }

    if (!token) throw new Error('Failed to get token after 5 attempts')

    // 5. Save and Listen
    await saveTokenToBackend(userId, token)

    onMessage(messaging, (payload) => {
      console.log('📬 Foreground message:', payload)
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: '/icon-192.png'
        })
      }
    })

    console.log('✅ Notification setup complete!')
    return token

  } catch (error) {
    console.error('❌ Error getting token:', error)
    return null 
  }
}

// ... Keep your saveTokenToBackend function as is ...
async function saveTokenToBackend(userId, token) {
  try {
    const authToken = localStorage.getItem('token')
    if (!authToken) throw new Error('No auth token found')
    await fetch('/api/notifications/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ userId, fcmToken: token })
    })
    console.log('✅ Token saved to backend')
  } catch (e) {
    console.error(e)
  }
}