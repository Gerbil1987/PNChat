// Service Worker for Push Notifications
const NOTIFICATION_TAG = 'pnchat-notification';

// Handle installation of service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Handle activation of service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  // Claim all clients immediately
  event.waitUntil(clients.claim());
});

// Handle push notifications from server
self.addEventListener('push', (event) => {
  console.log('Push notification received', event);

  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (e) {
    // If JSON parsing fails, use the text content
    notificationData = {
      title: 'New Notification',
      body: event.data.text()
    };
  }

  const options = {
    badge: '/pnchat.ico',
    icon: '/pnchat.ico',
    tag: NOTIFICATION_TAG,
    requireInteraction: notificationData.requireInteraction || false,
    ...notificationData
  };

  console.log('Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'New Notification',
      options
    )
  );
});

// Handle in-app messages from clients (for foreground notifications)
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    console.log('📢 Service Worker showing notification:', title);
    
    const finalOptions = {
      badge: '/pnchat.ico',
      icon: '/pnchat.ico',
      tag: NOTIFICATION_TAG,
      ...options
    };
    
    console.log('📢 Final notification options:', finalOptions);
    
    self.registration.showNotification(title, finalOptions).then(() => {
      console.log('✅ Service Worker notification displayed successfully');
    }).catch((error) => {
      console.error('❌ Error showing notification from service worker:', error);
    });
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  event.notification.close();

  // Focus the app or open it if closed
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if any window is already open
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event);
});

// Background sync for sending messages when offline
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // This would sync any pending messages
      Promise.resolve()
    );
  }
});
