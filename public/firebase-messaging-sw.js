// public/firebase-messaging-sw.js

// 1. Service Worker Lifecycle (Immediate Takeover)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); // 🚀 Crucial for "Fast-Fail" to work
});

// 2. Firebase Init (Using Compat for maximum mobile browser support)
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

// 3. Optimized Background Handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received', payload);
  
  // Only manually show notification if the 'notification' object is missing
  if (!payload.notification && payload.data) {
    const { title, message, url } = payload.data;
    self.registration.showNotification(title || "NITC Update", {
      body: message,
      icon: '/logo.png', // Ensure this exists in your public folder
      data: { url: url || '/' }
    });
  }
});

// 4. Click Handling with Deep Linking
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/notifications';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});