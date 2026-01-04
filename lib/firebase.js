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

// 🚀 Helper: Timeout wrapper to prevent the "10-second hang"
const withTimeout = (promise, ms) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), ms)
  );
  return Promise.race([promise, timeout]);
};

function canUseNotifications() {
  if (typeof window === 'undefined') return false;
  return ('Notification' in window) && ('serviceWorker' in navigator);
}

export async function requestNotificationPermission(userId) {
  if (!canUseNotifications()) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // 🚀 Total timeout for the entire process
    return await withTimeout(getTokenAndSave(userId), 6500);
  } catch (error) {
    console.error('❌ Notification Setup Error:', error.message);
    return null;
  }
}

async function getTokenAndSave(userId) {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    let reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    }
    
    await navigator.serviceWorker.ready; // Ensure SW is active

    const messaging = getMessaging(app);
    
    // 🚀 Get Token with a specific 4s timeout
    const token = await withTimeout(
      getToken(messaging, { vapidKey, serviceWorkerRegistration: reg }),
      4000
    );

    if (token) {
      localStorage.setItem('fcm_token', token);
      
      // ✅ ASYNC SAVE: UI updates immediately
      saveTokenToBackend(userId, token); 
      
      onMessage(messaging, (payload) => {
        window.dispatchEvent(new CustomEvent('foreground-notification', { detail: payload }));
      });

      return token;
    }
    return null;
  } catch (e) {
    throw e;
  }
}

async function saveTokenToBackend(userId, token) {
  const authToken = getAuthToken();
  if (!authToken) return;

  const headers = { 
    'Content-Type': 'application/json', 
    'Authorization': `Bearer ${authToken}` 
  };

  // Fire-and-forget to avoid blocking UI
  fetch('/api/notifications/save-token', {
    method: 'POST',
    headers,
    body: JSON.stringify({ fcmToken: token })
  }).catch(err => console.error("Backend Save Error:", err));

  fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers,
    body: JSON.stringify({ fcmToken: token })
  }).catch(err => console.error("Topic Subscribe Error:", err));
}

// ✅ RE-ADDED: Auto-refresh logic for background resync
export async function refreshNotificationToken(userId) {
  if (typeof window === 'undefined') return;
  
  if (Notification.permission !== 'granted') return;
  
  const existingToken = localStorage.getItem('fcm_token');
  if (!existingToken) return;
  
  try {
    console.log('🔄 Refreshing notification subscription...');
    // We use the same async save logic here to keep the app boot-up fast
    saveTokenToBackend(userId, existingToken);
  } catch (e) {
    console.log('⚠️ Token refresh failed');
    localStorage.removeItem('fcm_token');
  }
}