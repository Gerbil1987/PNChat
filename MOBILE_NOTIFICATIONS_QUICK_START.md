# Mobile Notifications Quick Start Guide

## Summary of Changes

Your PNChat app now has **enhanced mobile notification support**. Here's what was updated:

### 1. **Service Worker Registration** ✅
- Added automatic service worker registration in `index.html`
- Service worker file is now included in production builds
- Enables background notifications even when browser tab is closed

### 2. **Enhanced Notification Service** ✅
- Added push notification subscription setup
- Better mobile device detection and support
- Logging and debugging for notification events
- Support for both in-app and service worker notifications

### 3. **Service Worker Enhancements** ✅
- Added message handling for in-app notifications
- Improved notification display logic
- Background sync support (for future offline messaging)
- Better logging for debugging

### 4. **Dual Notification System** ✅
- **Foreground**: When app tab is active, shows immediate notifications
- **Background**: When app is minimized/closed, uses service worker
- **Mobile**: Both desktop and mobile devices supported

## Testing Notifications on Mobile

### Quick Test (5 minutes)

**Prerequisites:**
- Phone with Chrome, Firefox, or Edge installed
- Same network as laptop (for easier testing)

**Steps:**
1. Open your app on phone: `https://your-domain-or-localhost:port`
2. Open your app on laptop
3. Grant notification permission when prompted on phone
4. Log in on both devices
5. Send a message from laptop to phone contact
6. **Check phone** - notification should appear

### What You Should See

**On Phone (receiving message):**
- If app is open: In-app notification appears in status bar
- If app is minimized: Notification appears in notification center
- If browser is closed: Notification still appears (if using HTTPS in production)

**Notification Content:**
- Sender's name
- Message preview (first 100 characters)
- Sender's avatar (if available)
- App icon

### Test Different Scenarios

#### Test 1: App in Foreground
- Open chat on phone
- Open chat on laptop
- Send message
- **Expected:** Notification appears immediately

#### Test 2: App in Background
- Open app on phone
- Click home button to minimize
- Send message from laptop
- **Expected:** Notification appears in status bar

#### Test 3: Browser Closed (Desktop/Mobile)
- Close browser completely on phone
- Send message from laptop
- **Expected:** Notification appears (depends on HTTPS and server setup)

#### Test 4: Group Messages
- Create a group with 2+ users
- Send message from one user to group
- **Expected:** Notification shows group name and sender

#### Test 5: Emergency Messages
- Send message with 🚨 or ⚠️ emoji
- **Expected:** High-priority notification with `requireInteraction: true`

## Debugging on Mobile

### Enable DevTools on Android Chrome

1. On **Android phone**:
   - Connect to computer via USB
   - Enable "Developer options" in Settings
   - Enable "USB Debugging"

2. On **desktop Chrome**:
   - Type `chrome://inspect` in address bar
   - Check "Discover USB devices"
   - Select your phone in the list
   - Click "Inspect"

3. **Monitor real-time:**
   - Console tab: See all console.log messages
   - Network tab: See WebSocket (SignalR) messages
   - Application tab: Check Service Worker status

### Check Service Worker Status

In browser console (on phone or desktop):

```javascript
// Check if service worker is registered
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker ready:', registration);
  console.log('Scope:', registration.scope);
  console.log('Active:', registration.active ? 'Yes' : 'No');
});

// Check notification permission
console.log('Notification permission:', Notification.permission);

// Check if push is supported
console.log('Push API supported:', 'pushManager' in ServiceWorkerRegistration.prototype);
```

### Test Notifications Manually

In browser console on phone:

```javascript
// Test direct message notification
notificationService = ng.probe(document.querySelector('app-root')).injector.get(ng.coreTokens.NotificationService);

notificationService.showMessageNotification('John Doe', 'Hello! How are you?', '/pnchat.ico');

// Test group notification
notificationService.showGroupNotification('Team Meeting', 'Jane Smith', 'The meeting starts in 10 minutes');

// Test emergency notification
notificationService.showEmergencyNotification('John Doe', 'medical');

// Send to service worker (background notification)
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'SHOW_NOTIFICATION',
    title: 'Test from Service Worker',
    options: {
      body: 'This is a background notification test',
      icon: '/pnchat.ico',
      badge: '/pnchat.ico'
    }
  });
}
```

## Common Issues and Solutions

### Issue: "Service Worker not registered"

**Symptoms:** No notifications appear on phone

**Causes:**
1. Service worker file not found (404 error)
2. Wrong URL path
3. Browser doesn't support service workers

**Solutions:**
1. Check browser DevTools → Application → Service Workers
2. Look for errors in Console tab
3. Try Chrome instead of Safari (Safari has limited support)
4. Clear browser cache and reload: Settings → Clear browsing data

**Verification:**
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered service workers:', registrations);
});
```

### Issue: "Notifications appear on desktop but not mobile"

**Symptoms:** Desktop notifications work, phone notifications don't

**Possible Causes:**
1. **Notification permission not granted on phone**
   - Solution: Go to Settings → Apps → Chrome → Permissions → Notifications → Enable

2. **Service Worker not loaded on mobile**
   - Solution: Check DevTools on phone (see debugging section above)

3. **Mobile browser doesn't support notifications**
   - Solution: Try Chrome instead of Safari/Firefox

4. **SignalR connection not established**
   - Check DevTools → Network → WS (WebSocket should be open)

### Issue: "No notification when message arrives"

**Check list:**
1. Is app connected to chat server?
   - Look at browser console for "Hub connection started"

2. Is notification permission granted?
   ```javascript
   console.log(Notification.permission); // Should be 'granted'
   ```

3. Is service worker active?
   - DevTools → Application → Service Workers → Status should be "activated and running"

4. Is SignalR receiving messages?
   - Check DevTools → Network → Filter by "ws"
   - Send a message and look for activity

### Issue: "Notifications show but no sound"

**Solutions:**
1. Check device settings: Settings → Sound & vibration → Notifications volume
2. Check app notification settings: Settings → Apps → Chrome → Notifications
3. Make sure device is not in silent mode

### Issue: "Old notifications keep appearing"

**Solution:** Clear notification cache
```javascript
// In service worker (DevTools → Application → Service Workers → Inspector)
self.registration.getNotifications().then(notifications => {
  notifications.forEach(notification => notification.close());
});
```

## File Changes Made

1. **`src/index.html`**
   - Added service worker registration script

2. **`src/service-worker.js`**
   - Enhanced push event handling
   - Added message handling for in-app notifications
   - Improved notification display

3. **`src/app/core/service/notification.service.ts`**
   - Added service worker registration
   - Added push notification subscription setup
   - Better error handling and logging

4. **`src/app/core/service/notification-debug.service.ts`** (New)
   - Debugging service for notification system
   - Logs all notification events
   - Status monitoring

5. **`src/app/containers/home/template/message/message-detail/message-detail.component.ts`**
   - Enhanced notification handling
   - Sends notifications to both direct API and service worker

6. **`angular.json`**
   - Added `service-worker.js` to assets for production build

7. **`src/app/app.component.ts`**
   - Integrated debug service for logging

## Production Deployment Notes

### For HTTPS (Recommended)
1. Service workers only work over HTTPS (except localhost)
2. All the above changes will work automatically
3. No additional server configuration needed

### For True Push Notifications
If you want notifications **when browser is completely closed**:
1. Implement VAPID keys (public/private key pair)
2. Backend server sends Web Push Protocol messages
3. Requires configuration in backend (C# code)
4. More complex setup but full offline support

### Current Status
- ✅ Notifications when app is open
- ✅ Notifications when app is minimized
- ⚠️ Notifications when browser closed (requires backend Push integration)

## Next Steps

1. **Test on your phone:**
   - Follow the "Quick Test" steps above
   - Monitor console and network activity

2. **Check for errors:**
   - Open DevTools on phone
   - Look at Console and Network tabs
   - Share any errors with development team

3. **If notifications still don't work:**
   - Try different browser (Chrome > Firefox > Safari)
   - Clear cache: Settings → Clear browsing data
   - Check device notification settings
   - Ensure notification permission is granted

4. **For production push notifications:**
   - Contact backend team
   - Implement VAPID key setup
   - Configure web push messaging on server

## Support Resources

- **Notification API Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
- **Service Worker Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Push API Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- **Chrome DevTools:** https://developer.chrome.com/docs/devtools/

## Questions?

Check the console for error messages, and refer to `MOBILE_NOTIFICATIONS_DEBUG.md` for detailed troubleshooting.
