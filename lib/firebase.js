import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// 🆕 iOS Detection Helper
function isIOSSafari() {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isIOS && isSafari
}

// 🆕 Check if browser supports notifications properly
function canUseNotifications() {
  // Check basic support
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (!('serviceWorker' in navigator)) return false
  
  // 🚫 Block iOS Safari (doesn't support Push API)
  function canUseNotifications() {
  if (typeof window === 'undefined') return false
  
  // 1. Check if the browser physically has the API
  if (!('Notification' in window)) {
    console.log('⚠️ Notification API missing')
    return false
  }
  
  // 2. Service Workers are required for Firebase
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Workers missing')
    return false
  }

  // 3. Check for Private/Incognito mode (Storage access is required)
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
  } catch (e) {
    console.log('⚠️ Private browsing detected - Notifications disabled')
    return false
  }
  
  return true
}
  
  // 🚫 Check if in Private/Incognito mode (storage will fail)
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
  } catch (e) {
    console.log('⚠️ Private browsing detected - Notifications disabled')
    return false
  }
  
  return true
}

export async function requestNotificationPermission(userId) {
  console.log('🔔 Starting notification permission request...')
  console.log('📱 Platform:', navigator.userAgent)
  
  // 🆕 Early exit for unsupported browsers
  if (!canUseNotifications()) {
    alert('⚠️ Notifications are not supported on this device. If you are on iOS, make sure you have added this app to your Home Screen.')
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
    
    // 🆕 Better error messages
    if (error.message.includes('storage')) {
      alert('Unable to enable notifications. Please check if you\'re in Private Browsing mode or try a different browser.')
    } else {
      alert(`Notification setup failed: ${error.message}`)
    }
    return null
  }
}

async function getTokenAndSave(userId) {
  try {
    console.log('📝 Registering service worker...')
    
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    console.log('🔑 VAPID Key exists:', !!vapidKey)
    console.log('🔑 VAPID Key length:', vapidKey?.length)
    console.log('🔑 VAPID Key preview:', vapidKey?.substring(0, 20) + '...')
    
    if (!vapidKey) {
      throw new Error('❌ VAPID key is missing! Check your .env.local file')
    }
    
    if (vapidKey.length < 80) {
      throw new Error('❌ VAPID key looks incomplete (too short)')
    }


    // 1. Unregister existing workers
    const existingRegistrations = await navigator.serviceWorker.getRegistrations()
    for (const reg of existingRegistrations) {
       console.log('🗑️ Unregistering SW:', reg.scope)
       await reg.unregister()
    }
    
    await new Promise(resolve => setTimeout(resolve, 200))

    // 2. Register new worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
    
    // 3. Wait for activation
    let activeReg = registration
    if (registration.installing || registration.waiting) {
        console.log('⏳ Waiting for SW activation...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        activeReg = await navigator.serviceWorker.ready
    }

    console.log('✅ Service worker active. Initializing Firebase App...')

    const cleanConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    let cleanApp
    try {
        cleanApp = getApps().find(a => a.name === 'cleanApp') || initializeApp(cleanConfig, 'cleanApp')
    } catch (e) {
        cleanApp = initializeApp(cleanConfig, 'cleanApp') 
    }

    const messaging = getMessaging(cleanApp)

    // 4. Get Token with retry logic
    let token = null
    let attempts = 0
    while (!token && attempts < 5) {
      try {
        attempts++
        console.log(`🔄 Attempt ${attempts} to get token...`)
        token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: activeReg
        })
        if (token) break
      } catch (e) {
        console.error(`❌ Attempt ${attempts} failed:`, e.code, e.message)
        
        // 🆕 Don't retry on storage errors (they won't fix themselves)
        if (e.code === 'messaging/failed-service-worker-registration' || 
            e.message.includes('storage')) {
          throw new Error('Browser storage is unavailable. Please disable Private Browsing mode.')
        }
        
        await new Promise(r => setTimeout(r, 1000 * attempts))
      }
    }

    if (!token) throw new Error('Failed to get token after 5 attempts')

    // 5. Save and listen
    await saveTokenToBackend(userId, token)

    onMessage(messaging, (payload) => {
      console.log('📬 Foreground message:', payload)
      const event = new CustomEvent('foreground-notification', { detail: payload })
      window.dispatchEvent(event)
    })

    console.log('✅ Notification setup complete!')
    return token

  } catch (error) {
    console.error('❌ Error getting token:', error)
    throw error // Re-throw so parent can handle it
  }
}

async function saveTokenToBackend(userId, token) {
  try {
    const authToken = getAuthToken()
    if (!authToken) throw new Error('No auth token found')
    
    // Save token
    await fetch('/api/notifications/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ userId, fcmToken: token })
    })
    console.log('✅ Token saved to backend')

    // Subscribe to broadcast topic
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ fcmToken: token })
    })
    console.log('✅ Subscribed to broadcasts')

  } catch (e) {
    console.error('⚠️ Backend save failed:', e)
    throw e
  }
}