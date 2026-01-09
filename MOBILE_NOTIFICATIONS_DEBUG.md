# Mobile Notifications Debugging Guide

This guide will help you debug and test notifications on mobile devices (smartphones/tablets).

## Understanding the Notification System

The PNChat app now uses **three layers of notification delivery**:

1. **In-App Notifications** (Notification API) - Works when app tab is active
2. **Service Worker Background Notifications** - Works when app tab is open or in background
3. **Push Notifications** (via Service Worker) - Works even when browser is closed (requires server integration)

## Mobile Browser Requirements

### Android Chrome/Edge
- ✅ Supports Notification API
- ✅ Supports Service Workers
- ✅ Supports Push API
- ✅ Full notification support

### iOS Safari (iOS 16+)
- ⚠️ Limited Notification API support (only for web apps installed to home screen)
- ⚠️ Limited Service Worker support
- ⚠️ No Push API support
- ✅ Notifications work if app is installed as PWA

### Firefox Mobile
- ✅ Good support for all notification features
- ✅ Service Workers fully supported

## Step 1: Verify Service Worker Registration

### On Mobile (Chrome Android):

1. Open your app on mobile: `https://your-domain.com`
2. Open Chrome DevTools (tap three dots → More tools → Developer tools)
3. Go to **Application** tab
4. Click **Service Workers** in the left sidebar
5. You should see a service worker with status "activated and running"

**If you don't see it:**
- Check the **Console** tab for errors
- Look for messages like "Service Worker registered successfully"
- Common issue: Service worker file not found (404 error)

### Testing Service Worker in DevTools:
- Check **Offline** checkbox to simulate offline mode
- Notifications should still work via service worker
- Try sending a message while offline
- When online, messages should sync

## Step 2: Check Notification Permission

### In Browser Console (Android Chrome):

```javascript
// Check current permission status
console.log('Notification permission:', Notification.permission);

// Should output one of: 'granted', 'denied', 'default'

// If 'default', request permission:
Notification.requestPermission().then(permission => {
  console.log('Permission result:', permission);
});
```

### Check in Browser Settings:
1. Chrome → Settings → Site settings → Notifications
2. Find your domain
3. Should be set to "Allow"

**If notification permission is "denied":**
- Android: Settings → Apps → Chrome → Permissions → Notifications (enable)
- Then revisit the site and grant permission again

## Step 3: Test Notification Delivery

### Manual Test from Browser Console:

```javascript
// Get the notification service
const notificationService = ng.probe(document.querySelector('app-root')).injector.get(ng.coreTokens.NotificationService);

// Test direct message notification
notificationService.showMessageNotification('John Doe', 'Hello! How are you?', '/pnchat.ico');

// Test group notification
notificationService.showGroupNotification('Team Chat', 'Jane Doe', 'Meeting starting in 5 minutes');

// Test emergency notification
notificationService.showEmergencyNotification('John Doe', 'medical');

// Test service worker notification (if registered)
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'SHOW_NOTIFICATION',
    title: 'Test Notification',
    options: {
      body: 'This is a service worker notification',
      icon: '/pnchat.ico',
      badge: '/pnchat.ico'
    }
  });
}
```

### Real Message Test:
1. Open two browser windows (or tab + phone)
2. Log in as User A on phone
3. Log in as User B on computer
4. Send message from User B to User A
5. Check if notification appears on User A's phone

## Step 4: Debug with Network Requests

### Check SignalR Connection:

```javascript
// In browser console:
// Check if SignalR is connected
const signalRService = ng.probe(document.querySelector('app-root')).injector.get(SignalRService);
console.log('SignalR connection state:', signalRService.hubConnection.state);

// Should be: HubConnectionState.Connected (value: 1)
// If 0: Disconnected, If 2: Reconnecting
```

### Monitor Network Activity:
1. Open DevTools → Network tab
2. Filter by "ws" (WebSocket) to see SignalR messages
3. When a message arrives, you should see SignalR activity
4. Check for errors in console

## Step 5: Specific Mobile Device Testing

### Android Chrome:
1. Enable USB Debugging on phone
2. In Chrome desktop: `chrome://inspect`
3. Select your phone
4. Enable remote debugging
5. Monitor console and network in real-time

### iOS (Safari):
1. iPhone must have iOS 16+
2. For PWA notifications, app must be installed to home screen
3. In Settings → Safari → Notifications, grant permission
4. Notifications appear in Notification Center

## Common Issues and Solutions

### Issue 1: "Service Worker not registered"
**Cause:** Service worker file not accessible
**Solution:**
```bash
# Ensure service-worker.js is in public folder
# For Angular, it should be in src/service-worker.js
# Build output should have it in dist/

# In your app's public/dist folder, you should see:
# - service-worker.js (the actual file)
```

### Issue 2: Notifications not showing on mobile
**Causes and Solutions:**
1. **Permission not granted**
   - Request permission in app
   - Check browser settings

2. **Service Worker not active**
   - Check DevTools Application tab
   - Look for errors in console
   - Try re-registering: navigate away and back

3. **SignalR not connected**
   - Check WebSocket connection in Network tab
   - Verify server endpoint is correct
   - Check for CORS issues

4. **Browser not supported**
   - iOS Safari has limited support
   - Try Chrome or Firefox instead

### Issue 3: Notifications work on desktop but not mobile
**Likely Cause:** Service Worker not properly registered on mobile
**Solution:**
- Clear browser cache/data
- Uninstall and reinstall app
- Try incognito/private mode
- Use a different browser

## Advanced Debugging

### Monitor All Notification Events:

```javascript
// In app.component.ts or main.ts, add:

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    console.log('Service Worker ready');
    
    // Monitor messages from service worker
    navigator.serviceWorker.onmessage = (event) => {
      console.log('Message from Service Worker:', event.data);
    };
    
    // Monitor controller changes
    navigator.serviceWorker.oncontrollerchange = () => {
      console.log('Service Worker controller changed');
    };
  });
}

// Monitor push events (in service-worker.js)
self.addEventListener('push', event => {
  console.log('=== PUSH EVENT ===');
  console.log('Timestamp:', new Date().toLocaleTimeString());
  console.log('Data:', event.data?.json?.() || event.data?.text?.());
});

self.addEventListener('message', event => {
  console.log('=== SERVICE WORKER MESSAGE ===');
  console.log('Type:', event.data?.type);
  console.log('Payload:', event.data);
});
```

### Check Service Worker Cache:
1. DevTools → Application → Cache Storage
2. You should see entries for your service worker
3. Clear cache if you make service worker changes

## Testing on Real Devices

### Recommended Setup:
1. **Device 1 (Sender):** Chrome on desktop/laptop
2. **Device 2 (Receiver):** Chrome on Android phone
3. Both connected to same network

### Test Scenarios:

**Test 1: App in Foreground**
- Open chat on phone
- Send message from desktop
- Notification should appear immediately
- App should update automatically

**Test 2: App in Background**
- Open app on phone
- Minimize (don't close)
- Send message from desktop
- Notification should appear
- Check device notification center

**Test 3: Browser Closed (Advanced)**
- Close browser completely
- Send message from desktop
- Notification won't appear (unless using real Push API with server)
- When you reopen the app, cached messages should be there

## Production Deployment

### For True Push Notifications:
1. Implement VAPID keys (asymmetric encryption)
2. Backend server sends Web Push Protocol messages
3. Browser OS delivers notifications even when browser is closed
4. Requires HTTPS

### Current Implementation Status:
- ✅ In-app notifications working
- ✅ Service Worker background notifications working
- ⚠️ True Push API notifications require server integration
- ⚠️ Backend needs to send push messages to subscribed clients

## Next Steps

1. **Test on your devices** using the steps above
2. **Monitor console** for any errors
3. **Check Service Worker status** in DevTools
4. **Verify SignalR connection** is active
5. **If still not working**, check:
   - Browser compatibility
   - Network connectivity
   - Server-side message delivery
   - Notification permission settings

## Support

If notifications still don't work:

1. Check browser console for JavaScript errors
2. Look at DevTools Network tab for failed requests
3. Verify Service Worker is "activated and running"
4. Ensure notification permission is "granted"
5. Try a different browser (Chrome > Firefox > Safari)
6. Clear browser cache and restart

## References

- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-protocol)
