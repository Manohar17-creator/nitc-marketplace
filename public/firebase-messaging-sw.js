// 1. Service Worker Lifecycle (Keeps your PWA updated)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  console.log('[SW] 📥 Installing new version & skipping waiting...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] 🚀 Activating new version & claiming clients...');
  event.waitUntil(clients.claim());
});

// 2. Firebase Init
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA44DLUAwtcRLCNdf2GmiqxanKBYFWAgWo",
  authDomain: "nitc-marketplace-5eddc.firebaseapp.com",
  projectId: "nitc-marketplace-5eddc",
  storageBucket: "nitc-marketplace-5eddc.firebasestorage.app",
  messagingSenderId: "1011003738424",
  appId: "1:1011003738424:web:4b709b460548f8ab8819cd"
});

const messaging = firebase.messaging();

// 3. 🚨 THE FIX FOR DOUBLE NOTIFICATIONS
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  // ❌ REMOVED manual display logic. 
  // Firebase SDK automatically handles display when "notification" key is present.
});

// 4. Click Handling (Optional but good for deep linking)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // If your notification has a data.link or data.url, use it. Otherwise go home.
  const urlToOpen = event.notification.data?.link || event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 1. If tab is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // 2. Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});