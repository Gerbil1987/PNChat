# Notification System Architecture

## Overview

The PNChat app uses a **multi-layer notification delivery system** to ensure messages are delivered across all devices (desktop and mobile).

## System Layers

```
┌─────────────────────────────────────────────────┐
│         Incoming Message from SignalR            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│    MessageDetailComponent                        │
│    - Receives message via SignalR                │
│    - Checks if it's from current user           │
│    - Calls NotificationService                   │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
         ▼                    ▼
    ┌─────────────┐      ┌──────────────────┐
    │ Notification│      │Service Worker    │
    │ API         │      │Message API       │
    │ (Foreground)│      │(Background)      │
    └──────┬──────┘      └────────┬─────────┘
           │                      │
           └──────────┬───────────┘
                      │
              ┌───────┴─────────┐
              │                 │
              ▼                 ▼
        ┌──────────────┐  ┌──────────────┐
        │ App in       │  │ App Minimized│
        │ Foreground   │  │ or Closed    │
        └──────────────┘  └──────────────┘
```

## Component Descriptions

### 1. Incoming Messages (SignalR)
- **What:** Real-time message delivery via SignalR WebSocket
- **When:** Browser receives message data from server
- **Where:** `src/app/containers/home/template/message/message-detail/message-detail.component.ts`
- **Event:** `messageHubListener` event

```typescript
this.signalRService.hubConnection.on('messageHubListener', (data) => {
  this.getMessage();
  this.handleIncomingMessageNotification(data);
});
```

### 2. NotificationService
- **What:** Main service managing all notification operations
- **File:** `src/app/core/service/notification.service.ts`
- **Responsibilities:**
  - Request notification permission from user
  - Register and manage service worker
  - Subscribe to push notifications
  - Show notifications using Notification API
  - Handle different notification types

**Key Methods:**
```typescript
// Initialize and request permission
initializeNotifications(): void

// Register service worker
registerServiceWorker(): void

// Setup push notifications
setupPushNotifications(): void

// Show different types of notifications
showNotification(title, options)
showMessageNotification(senderName, messagePreview)
showGroupNotification(groupName, senderName, messagePreview)
showEmergencyNotification(senderName, emergencyType)
```

### 3. Notification API (Foreground)
- **What:** Browser's built-in Notification API
- **When:** App is active and has focus
- **How:** Creates and displays notifications immediately
- **Cleanup:** Auto-closes after 5 seconds (configurable)

```typescript
const notification = new Notification(title, {
  icon: '/pnchat.ico',
  badge: '/pnchat.ico',
  body: options.body,
  requireInteraction: options.requireInteraction
});

// Auto close
setTimeout(() => notification.close(), 5000);
```

### 4. Service Worker
- **What:** JavaScript background worker
- **File:** `src/service-worker.js`
- **Where:** Runs separately from main app thread
- **Scope:** Global to entire domain

**Events Handled:**
1. **Push Events** - For server-sent push notifications
2. **Message Events** - For in-app notifications when backgrounded
3. **Notification Click** - Focus app when user clicks
4. **Notification Close** - Cleanup when user dismisses

### 5. Service Worker Message API (Background)
- **What:** Communication channel between app and service worker
- **When:** App is minimized but service worker is active
- **How:** Post messages to service worker to show notifications

```typescript
// From app
navigator.serviceWorker.controller.postMessage({
  type: 'SHOW_NOTIFICATION',
  title: 'New Message',
  options: { body: '...' }
});

// In service worker
self.addEventListener('message', (event) => {
  if (event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, event.data.options);
  }
});
```

## Notification Types

### 1. Direct Message Notifications
```
Title: "New message from [Sender Name]"
Body: [Message preview, max 100 chars]
Icon: [Sender's avatar or default icon]
```

### 2. Group Notifications
```
Title: "[Group Name] - [Sender Name]"
Body: [Message preview, max 100 chars]
Icon: [Group icon or default]
```

### 3. Emergency Notifications
```
Title: "🚨 Medical Emergency! from [Name]"
       or "⚠️ Incident Alert! from [Name]"
Body: [Emergency description]
RequireInteraction: true (doesn't auto-close)
```

## Delivery Guarantee Levels

### Level 1: Browser Tab Open ✅
- **Delivery:** Guaranteed
- **Latency:** Immediate (< 100ms)
- **Method:** Notification API
- **User Experience:** Sees notification immediately

### Level 2: Browser Open, Tab Backgrounded ✅
- **Delivery:** Guaranteed
- **Latency:** Immediate (< 100ms)
- **Method:** Service Worker Message API
- **User Experience:** Notification appears in system tray

### Level 3: Browser Closed ⚠️
- **Delivery:** Not guaranteed (requires backend integration)
- **Latency:** Depends on backend
- **Method:** Web Push API (requires VAPID keys)
- **User Experience:** Notification in system tray even when browser closed

## Permission Flow

```
User opens app
       ↓
Notification permission check
       ↓
   If 'default':
       ↓
   Request permission dialog
       ↓
   User grants/denies
       ↓
If 'granted':
       ↓
Register Service Worker
       ↓
Subscribe to Push notifications
       ↓
Ready to receive notifications
```

## Service Worker Lifecycle

```
App loads
   ↓
index.html registers service-worker.js
   ↓
Browser downloads & installs SW
   ↓
SW 'install' event fires
   ↓
SW 'activate' event fires
   ↓
SW enters 'activated' state
   ↓
SW ready to handle messages/push events
```

## How Notifications Get Sent

### Scenario 1: User A sends message to User B (same browser)

```
User A types message → Click Send
       ↓
Message sent to backend via HTTP
       ↓
Backend stores message
       ↓
Backend sends SignalR update to User B
       ↓
User B's MessageDetailComponent receives 'messageHubListener'
       ↓
handleIncomingMessageNotification() called
       ↓
Check: Is from current user? → Skip if yes
       ↓
Call notificationService.showMessageNotification()
       ↓
If app is active: Show via Notification API
If app is backgrounded: Send to Service Worker
       ↓
User sees notification
```

### Scenario 2: User A sends message to User B (different device)

```
Same as above, but:
       ↓
User B's phone receives SignalR update
       ↓
Browser may be closed/app minimized
       ↓
Service Worker still active (on mobile)
       ↓
Notification shows in system tray
       ↓
If Service Worker receives push event:
   Show notification even if browser closed
```

## Mobile Browser Considerations

### Android Chrome ✅
- Full support for Notifications API
- Full support for Service Workers
- Full support for Push API (with backend setup)
- Best user experience

### iOS Safari ⚠️
- Limited Notification API (iOS 16+)
- Limited Service Worker support
- Limited Push API support
- Works best if app installed as PWA

### Firefox Mobile ✅
- Good support for all APIs
- Similar to Android Chrome

## Debug Information

### Check Notification Permission
```javascript
console.log(Notification.permission);
// Output: 'granted' | 'denied' | 'default'
```

### Check Service Worker Status
```javascript
navigator.serviceWorker.ready.then(registration => {
  console.log('Service Worker active:', !!registration.active);
  console.log('Scope:', registration.scope);
});
```

### View Service Worker Logs
In browser DevTools:
1. → Application tab
2. → Service Workers
3. → Click "Inspector" link
4. Check Console tab

### Monitor SignalR Messages
In browser DevTools:
1. → Network tab
2. → Filter: "ws"
3. Look for "signalr" connection
4. Click to see message payloads

## Configuration & Customization

### Notification Auto-Close Time
File: `src/app/core/service/notification.service.ts`
```typescript
// Default: 5 seconds
setTimeout(() => notification.close(), 5000);
```

### Notification Icons
File: `src/app/core/service/notification.service.ts`
```typescript
icon: '/pnchat.ico',    // Main icon
badge: '/pnchat.ico'    // Badge icon (shown in tray)
```

### VAPID Public Key (for Push API)
File: `src/app/core/service/notification.service.ts`
```typescript
// Default placeholder key (won't work for real push)
const vapidPublicKey = '...';
// For production, get from backend server
```

## Performance Considerations

1. **Memory Usage**
   - Service Worker: ~1-5 MB
   - Notification registration: < 1 KB
   - Overall impact: Minimal

2. **Battery Usage** (Mobile)
   - Service Worker dormant when not needed
   - Only activates on message/push event
   - Minimal battery drain

3. **Network Usage**
   - Service Worker registration: One-time, ~50 KB
   - Push subscriptions: One-time, ~1 KB
   - Per-notification: < 1 KB
   - Overall impact: Minimal

## Security Considerations

1. **User Consent**
   - Notifications require explicit user permission
   - Permission can be revoked in browser settings

2. **Content Validation**
   - Never display untrusted content in notifications
   - Sanitize message content before showing

3. **HTTPS Requirement**
   - Service Workers require HTTPS in production
   - Exceptions: localhost for development

4. **Service Worker Scope**
   - Service worker only affects its registered scope
   - Default scope: "/" (entire domain)

## Testing Checklist

- [ ] Notifications appear when app is open
- [ ] Notifications appear when app is minimized
- [ ] Different notification types display correctly
- [ ] Clicking notification focuses app
- [ ] Notifications auto-close after 5 seconds (except emergency)
- [ ] No errors in browser console
- [ ] Service Worker shows as "activated and running"
- [ ] Permission dialog appears on first visit
- [ ] Mobile notifications work on Android
- [ ] Mobile notifications work on iPhone (iOS 16+)

## Future Enhancements

1. **Backend Push Integration**
   - Implement VAPID keys
   - Send push notifications from backend
   - Enable notifications when browser is closed

2. **Notification Actions**
   - Add reply button to notifications
   - Add open/read button
   - Add rich media (images, audio)

3. **Notification History**
   - Store recent notifications in indexedDB
   - Display notification center in app
   - Sync with unread messages

4. **Do Not Disturb**
   - User-configurable quiet hours
   - Different notification levels (silent, vibrate, sound)
   - Mute specific contacts/groups

5. **Analytics**
   - Track notification delivery rates
   - Monitor notification engagement
   - Identify delivery failures

## References

- [MDN: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [W3C Notification Spec](https://www.w3.org/TR/notifications/)
- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
