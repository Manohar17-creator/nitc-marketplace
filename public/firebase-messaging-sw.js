// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyA44DLUAwtcRLCNdf2GmiqxanKBYFWAgWo",
  authDomain: "nitc-marketplace-5eddc.firebaseapp.com",
  projectId: "nitc-marketplace-5eddc",
  storageBucket: "nitc-marketplace-5eddc.firebasestorage.app",
  messagingSenderId: "1011003738424",
  appId: "1:1011003738424:web:4b709b460548f8ab8819cd"
});



const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  const notificationTitle = payload.notification?.title || 'NITC Marketplace';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.postId || 'notification',
    data: {
      url: payload.data?.url || '/'
    },
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
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