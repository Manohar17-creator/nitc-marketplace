import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getAuthToken } from '@/lib/auth-client' // ✅ ADD THIS IMPORT

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Check if browser supports notifications properly
function canUseNotifications() {
  if (typeof window === 'undefined') return false
  
  // Check if the browser has Notification API
  if (!('Notification' in window)) {
    console.log('⚠️ Notification API missing')
    return false
  }
  
  // Service Workers are required for Firebase
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Workers missing')
    return false
  }

  // Check for Private/Incognito mode (Storage access is required)
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
  
  // Early exit for unsupported browsers
  if (!canUseNotifications()) {
    alert('⚠️ Notifications are not supported on this device/browser. Try using Chrome, Firefox, or Edge (not Safari on iOS).')
    return null
  }

  try {
    console.log('📝 Current permission status:', Notification.permission)

    if (Notification.permission === 'granted') {
      console.log('✅ Permission already granted, getting token...')
      return await getTokenAndSave(userId)
    }

    if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser settings (click the lock icon next to the URL).')
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
    
    // Better error messages
    if (error.message.includes('storage') || error.message.includes('Private')) {
      alert('Unable to enable notifications. Please check if you\'re in Private Browsing mode or try a different browser.')
    } else if (error.message.includes('auth token')) {
      alert('Authentication required. Please log in again.')
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
    
    if (!vapidKey) {
      throw new Error('❌ VAPID key is missing! Check your .env.local file')
    }
    
    if (vapidKey.length < 80) {
      throw new Error('❌ VAPID key looks incomplete (too short)')
    }

    // 1. Unregister existing workers to ensure clean state
    const existingRegistrations = await navigator.serviceWorker.getRegistrations()
    for (const reg of existingRegistrations) {
      console.log('🗑️ Unregistering SW:', reg.scope)
      await reg.unregister()
    }
    
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 200))

    // 2. Register new service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
    
    // 3. Wait for service worker to be active
    let activeReg = registration
    if (registration.installing || registration.waiting) {
      console.log('⏳ Waiting for SW activation...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      activeReg = await navigator.serviceWorker.ready
    }

    console.log('✅ Service worker active. Initializing Firebase Messaging...')

    // 4. Initialize Firebase with clean config
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

    // 5. Get FCM token with retry logic
    let token = null
    let attempts = 0
    const maxAttempts = 5
    
    while (!token && attempts < maxAttempts) {
      try {
        attempts++
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} to get FCM token...`)
        
        token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: activeReg
        })
        
        if (token) {
          console.log('✅ FCM token received!')
          break
        }
      } catch (e) {
        console.error(`❌ Attempt ${attempts} failed:`, e.code, e.message)
        
        // Don't retry on storage errors (they won't fix themselves)
        if (e.code === 'messaging/failed-service-worker-registration' || 
            e.message.includes('storage') ||
            e.message.includes('Private')) {
          throw new Error('Browser storage is unavailable. Please disable Private Browsing mode.')
        }
        
        // Wait before retry (exponential backoff)
        if (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 1000 * attempts))
        }
      }
    }

    if (!token) {
      throw new Error(`Failed to get FCM token after ${maxAttempts} attempts`)
    }

    // 6. Save token to backend
    await saveTokenToBackend(userId, token)

    // 7. Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log('📬 Foreground message received:', payload)
      const event = new CustomEvent('foreground-notification', { detail: payload })
      window.dispatchEvent(event)
    })

    console.log('✅ Notification setup complete!')
    return token

  } catch (error) {
    console.error('❌ Error getting token:', error)
    throw error
  }
}

async function saveTokenToBackend(userId, token) {
  try {
    // ✅ Get auth token from auth-client
    const authToken = getAuthToken()
    
    if (!authToken) {
      throw new Error('No auth token found. Please log in again.')
    }
    
    console.log('💾 Saving FCM token to backend...')
    
    // Save FCM token
    const saveResponse = await fetch('/api/notifications/save-token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify({ fcmToken: token })
    })

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json()
      throw new Error(errorData.error || 'Failed to save token to backend')
    }
    
    console.log('✅ FCM token saved to backend')

    // Subscribe to broadcast topic
    console.log('📡 Subscribing to broadcast notifications...')
    
    const subscribeResponse = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify({ fcmToken: token })
    })

    if (!subscribeResponse.ok) {
      console.warn('⚠️ Failed to subscribe to broadcasts (non-critical)')
    } else {
      console.log('✅ Subscribed to broadcast notifications')
    }

  } catch (error) {
    console.error('⚠️ Backend save failed:', error)
    throw error
  }
}