// Service Worker for Push Notifications
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
    notificationData = {
      title: 'New Notification',
      body: event.data.text()
    };
  }

  const options = {
    badge: '/pnchat.ico',
    icon: '/pnchat.ico',
    ...notificationData
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'New Notification',
      options
    )
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked', event);
  event.notification.close();

  // Focus the app or open it if closed
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url === '/' && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
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
