import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getAuthToken } from '@/lib/auth-client'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

function canUseNotifications() {
  if (typeof window === 'undefined') return false
  
  if (!('Notification' in window)) {
    console.log('⚠️ Notification API missing')
    return false
  }
  
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Workers missing')
    return false
  }

  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
  } catch (e) {
    console.log('⚠️ Private browsing detected')
    return false
  }
  
  return true
}

export async function requestNotificationPermission(userId) {
  console.log('🔔 Starting notification permission request...')
  
  if (!canUseNotifications()) {
    alert('⚠️ Notifications are not supported on this device/browser.')
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
    
    if (error.message.includes('storage') || error.message.includes('Private')) {
      alert('Unable to enable notifications. Please check if you\'re in Private Browsing mode.')
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
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    
    if (!vapidKey || vapidKey.length < 80) {
      throw new Error('❌ VAPID key is missing or invalid')
    }

    // ✅ SMART SERVICE WORKER MANAGEMENT
    // Only unregister if there's a problem, not every time
    let registration = null
    
    try {
      // Try to use existing service worker first
      const existingReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
      
      if (existingReg) {
        console.log('♻️ Using existing service worker')
        
        // Check if it's healthy
        if (existingReg.active) {
          registration = existingReg
        } else {
          // If not active, unregister and start fresh
          console.log('🔄 Existing SW not active, re-registering...')
          await existingReg.unregister()
        }
      }
    } catch (e) {
      console.log('No existing service worker found')
    }

    // Register new service worker only if needed
    if (!registration) {
      console.log('📝 Registering new service worker...')
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
    }
    
    // Wait for service worker to be ready
    if (registration.installing || registration.waiting) {
      console.log('⏳ Waiting for SW activation...')
      await navigator.serviceWorker.ready
    }

    console.log('✅ Service worker ready')

    // Initialize Firebase Messaging
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

    // ✅ CHECK FOR EXISTING TOKEN FIRST
    const existingToken = localStorage.getItem('fcm_token')
    
    if (existingToken) {
      console.log('💾 Found existing FCM token, validating...')
      
      // Try to use existing token
      try {
        await saveTokenToBackend(userId, existingToken)
        console.log('✅ Existing token is valid!')
        
        // Set up message listener
        onMessage(messaging, (payload) => {
          console.log('📬 Foreground message:', payload)
          window.dispatchEvent(new CustomEvent('foreground-notification', { detail: payload }))
        })
        
        return existingToken
      } catch (e) {
        console.log('⚠️ Existing token invalid, getting new one...')
        localStorage.removeItem('fcm_token')
      }
    }

    // Get new FCM token with retry logic
    let token = null
    let attempts = 0
    const maxAttempts = 3
    
    while (!token && attempts < maxAttempts) {
      try {
        attempts++
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} to get FCM token...`)
        
        token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        })
        
        if (token) {
          console.log('✅ FCM token received!')
          // ✅ SAVE TOKEN LOCALLY
          localStorage.setItem('fcm_token', token)
          break
        }
      } catch (e) {
        console.error(`❌ Attempt ${attempts} failed:`, e.code, e.message)
        
        if (e.code === 'messaging/failed-service-worker-registration' || 
            e.message.includes('storage')) {
          throw new Error('Browser storage is unavailable. Please disable Private Browsing mode.')
        }
        
        if (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 1000 * attempts))
        }
      }
    }

    if (!token) {
      throw new Error(`Failed to get FCM token after ${maxAttempts} attempts`)
    }

    // Save token to backend
    await saveTokenToBackend(userId, token)

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log('📬 Foreground message:', payload)
      window.dispatchEvent(new CustomEvent('foreground-notification', { detail: payload }))
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
    const authToken = getAuthToken()
    
    if (!authToken) {
      throw new Error('No auth token found. Please log in again.')
    }
    
    console.log('💾 Saving FCM token to backend...')
    
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

    const subscribeResponse = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify({ fcmToken: token })
    })

    if (subscribeResponse.ok) {
      console.log('✅ Subscribed to broadcast notifications')
    }

  } catch (error) {
    console.error('⚠️ Backend save failed:', error)
    throw error
  }
}

// ✅ BONUS: Auto-refresh token on page load
export async function refreshNotificationToken(userId) {
  if (typeof window === 'undefined') return
  
  // Only refresh if user has already granted permission
  if (Notification.permission !== 'granted') return
  
  const existingToken = localStorage.getItem('fcm_token')
  if (!existingToken) return
  
  try {
    console.log('🔄 Refreshing notification subscription...')
    await saveTokenToBackend(userId, existingToken)
  } catch (e) {
    console.log('⚠️ Token refresh failed, may need re-authorization')
    localStorage.removeItem('fcm_token')
  }
}