import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(userId) {
  console.log('🔔 Starting notification permission request...')
  console.log('📱 Platform:', navigator.userAgent)
  
  // Check if browser supports notifications
  if (typeof window === 'undefined') {
    console.log('❌ Window not defined (SSR)')
    return null
  }

  if (!('Notification' in window)) {
    console.log('❌ Notifications not supported in this browser')
    alert('Your browser does not support notifications')
    return null
  }

  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Workers not supported')
    alert('Your browser does not support service workers')
    return null
  }

  try {
    console.log('📝 Current permission status:', Notification.permission)

    // If already granted, just get the token
    if (Notification.permission === 'granted') {
      console.log('✅ Permission already granted, getting token...')
      return await getTokenAndSave(userId)
    }

    // If already denied, can't ask again
    if (Notification.permission === 'denied') {
      console.log('❌ Permission previously denied')
      alert('Notifications are blocked. Please enable them in your browser settings.')
      return null
    }

    // Request permission (this shows the browser prompt)
    console.log('🔔 Requesting permission from user...')
    const permission = await Notification.requestPermission()
    
    console.log('📝 Permission result:', permission)

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

/**
 * Get FCM token and save to backend with retry logic
 */
async function getTokenAndSave(userId) {
  try {
    console.log('📝 Registering service worker...')
    
    // Unregister any existing service workers first (helps with Android PWA issues)
    const existingRegistrations = await navigator.serviceWorker.getRegistrations()
    console.log('📋 Found existing registrations:', existingRegistrations.length)
    
    for (const reg of existingRegistrations) {
      if (reg.scope.includes('firebase-messaging-sw')) {
        console.log('🗑️ Unregistering old Firebase SW:', reg.scope)
        await reg.unregister()
      }
    }

    // 1. Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none' // Important for Android - prevents caching issues
    })
    console.log('✅ Service Worker registered with scope:', registration.scope)

    // 2. Wait for the service worker to be ready
    console.log('⏳ Waiting for service worker to be ready...')
    await navigator.serviceWorker.ready
    console.log('✅ Service Worker ready')

    // 3. Ensure service worker is active (critical for Android)
    let activeReg = registration
    if (registration.installing) {
      console.log('⏳ Service worker is installing, waiting for activation...')
      await new Promise((resolve) => {
        registration.installing.addEventListener('statechange', function handler(e) {
          console.log('📝 SW state changed to:', e.target.state)
          if (e.target.state === 'activated') {
            e.target.removeEventListener('statechange', handler)
            resolve()
          }
        })
      })
      activeReg = await navigator.serviceWorker.ready
    } else if (registration.waiting) {
      console.log('⏳ Service worker is waiting, activating...')
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', function handler() {
          navigator.serviceWorker.removeEventListener('controllerchange', handler)
          resolve()
        })
      })
      activeReg = await navigator.serviceWorker.ready
    }

    // 4. Additional delay for Android PWAs
    const isAndroid = /android/i.test(navigator.userAgent)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true
    
    if (isAndroid || isPWA) {
      console.log('📱 Android or PWA detected, adding extra delay...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    if (!activeReg.pushManager) {
      throw new Error('Push manager unavailable on registration')
    }

    if (!activeReg.active) {
      throw new Error('Service worker not in active state')
    }

    console.log('✅ Service worker is active and ready')

    // Get messaging instance
    const messaging = getMessaging(app)
    console.log('✅ Firebase messaging instance created')

    // 5. Retry logic for getting FCM token
    let token = null
    let attempts = 0
    const maxAttempts = 5 // More attempts for Android
    
    while (!token && attempts < maxAttempts) {
      try {
        attempts++
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} to get FCM token...`)
        
        token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: activeReg
        })
        
        if (token) {
          console.log('✅ FCM Token received:', token.substring(0, 20) + '...')
          break
        }
        
        // Wait before retry
        if (attempts < maxAttempts) {
          const delay = attempts * 500 // Increasing delay
          console.log(`⏳ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed:`, error.message)
        console.error('Full error:', error)
        
        // If it's the last attempt, throw the error
        if (attempts >= maxAttempts) {
          throw error
        }
        
        // Otherwise wait and retry with increasing delay
        const delay = attempts * 1000
        console.log(`⏳ Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    if (!token) {
      throw new Error('Failed to get FCM token after multiple attempts')
    }

    // Save token to backend
    await saveTokenToBackend(userId, token)

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log('📬 Foreground message received:', payload)
      if (Notification.permission === 'granted') {
        new Notification(payload.notification.title || 'New Message', {
          body: payload.notification.body,
          icon: '/icon-192.png',
          data: payload.data
        })
      }
    })

    console.log('✅ Notification setup complete!')
    return token

  } catch (error) {
    console.error('❌ Error getting token:', error)
    console.error('❌ Error stack:', error.stack)
    // Return null instead of throwing so UI doesn't crash
    return null 
  }
}

/**
 * Save FCM token to backend
 */
async function saveTokenToBackend(userId, token) {
  try {
    console.log('💾 Saving token to backend...')
    
    const authToken = localStorage.getItem('token')
    
    if (!authToken) {
      throw new Error('No auth token found')
    }

    const response = await fetch('/api/notifications/save-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ userId, fcmToken: token })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save token')
    }

    console.log('✅ Token saved to backend successfully')
  } catch (error) {
    console.error('❌ Error saving token to backend:', error)
    throw error
  }
}