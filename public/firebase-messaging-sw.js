self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker...')
  self.skipWaiting() // Immediately activate
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...')
  event.waitUntil(
    clients.claim() // Take control immediately
  )
})

// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// ✅ This config uses your NEW Correct Key ending in ...WAgWo
firebase.initializeApp({
  apiKey: "AIzaSyA44DLUAwtcRLCNdf2GmiqxanKBYFWAgWo",
  authDomain: "nitc-marketplace-5eddc.firebaseapp.com",
  projectId: "nitc-marketplace-5eddc",
  storageBucket: "nitc-marketplace-5eddc.firebasestorage.app",
  messagingSenderId: "1011003738424",
  appId: "1:1011003738424:web:4b709b460548f8ab8819cd"
});

console.log('🔥 SW Firebase Config:', {
  apiKey: firebase.app().options.apiKey?.substring(0, 20) + '...',
  projectId: firebase.app().options.projectId,
  appId: firebase.app().options.appId
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icon-192.png', // Ensure this icon exists in public folder
    badge: '/icon-192.png',
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});