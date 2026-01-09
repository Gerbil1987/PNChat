# Push Notifications Implementation

This chat application now includes push notification functionality for incoming messages, group messages, and emergency alerts (SOS).

## Features

### 1. **In-App Notifications** (Immediate)
- Automatically displays notifications when messages arrive
- Works on desktop and mobile browsers
- Different notification types:
  - **Direct Messages**: Shows sender name and message preview
  - **Group Messages**: Shows group name, sender, and message preview
  - **Emergency Alerts**: Shows 🚨 Medical Emergency or ⚠️ Incident alerts with high priority

### 2. **Desktop Push Notifications**
- Uses the Notifications API
- Requires user permission (requested on app load)
- Automatically closes after 5 seconds
- Clicking the notification focuses the app window
- Styled with app icon

### 3. **Service Worker Support**
- Background notification handling
- Works even when browser tab is closed
- Mobile-optimized for web apps installed to home screen

## Implementation Details

### NotificationService (`src/app/core/service/notification.service.ts`)
The main service that handles all notification logic:

```typescript
// Automatically initializes on app startup
// Requests notification permission from user

// Public methods:
showNotification(title, options)          // Generic notification
showMessageNotification(senderName, msg)  // Direct message
showGroupNotification(group, sender, msg) // Group message
showEmergencyNotification(sender, type)   // SOS alert
isNotificationEnabled()                   // Check permission status
requestPermission()                       // Request user permission
```

### Message Component Integration
When a message arrives via SignalR, the `MessageDetailComponent` automatically:
1. Receives the message data
2. Checks if it's from the current user (skips if yes)
3. Identifies the message type (direct/group/emergency)
4. Calls the appropriate notification method

### Emergency Message Detection
Emergency messages are automatically detected by the presence of:
- 🚨 emoji → Medical emergency
- ⚠️ emoji → Incident alert

These show high-priority notifications with `requireInteraction: true`.

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Full support |
| Edge | ✅ | Full support |
| Safari | ⚠️ | iOS 16+ only |
| Mobile Chrome | ✅ | Full support with Service Worker |
| Mobile Firefox | ✅ | Full support |

## User Experience

### First Time User
1. App loads
2. User is prompted: "Allow notifications?"
3. If accepted, notifications are enabled
4. If denied, can manually enable in browser settings

### Notification Behavior
- **Incoming Message**: Brief notification (5s) with sound/vibration
- **Group Mention**: Shows group name for context
- **Emergency**: Persistent notification requiring user interaction
- **Click Action**: Focuses/opens the app

## Customization

To customize notification behavior, edit `NotificationService`:

```typescript
// Change auto-close time
setTimeout(() => notification.close(), 5000); // Change from 5000ms

// Add sound notification
new Notification(title, {
  ...options,
  silent: false // Enables sound if browser allows
});

// Add badge color
new Notification(title, {
  ...options,
  badge: 'your-badge-url'
});
```

## Mobile Web App (PWA)

To enable notifications on mobile:

1. Install app to home screen (Android Chrome)
   - Menu → "Install app" or "Add to home screen"
2. Grant notification permission when prompted
3. Notifications will appear even when app is not visible

## Security Considerations

1. **HTTPS Required**: Push notifications only work on HTTPS (production)
2. **User Consent**: Always requires explicit user permission
3. **Content Validation**: Server should validate all notification data
4. **Rate Limiting**: Consider limiting notification frequency on backend

## Troubleshooting

### Notifications Not Showing

1. **Check Permission**: 
   ```typescript
   console.log(this.notificationService.getPermissionStatus());
   ```

2. **Request Permission Again**:
   ```typescript
   this.notificationService.requestPermission();
   ```

3. **Browser Settings**: 
   - Check browser notification settings for localhost/your domain
   - Some browsers require HTTPS

4. **Service Worker**:
   - Check browser DevTools → Application → Service Workers
   - Service worker should be "activated and running"

### Silent Notifications
If notifications appear without sound:
1. Check browser notification settings
2. Verify `silent: false` is not set
3. Check device sound/vibration settings

## Future Enhancements

1. **Server-Side Push**: Integrate FCM (Firebase Cloud Messaging) for true push
2. **Notification Persistence**: Store unread notification count
3. **Rich Notifications**: Include images/action buttons
4. **Notification Center**: Keep notification history in app
5. **Do Not Disturb**: User-configurable quiet hours

## Testing

### Test Notifications
```typescript
// In browser console:
notificationService = ng.probe(document.querySelector('app-message-detail')).injector.get(NotificationService);

// Test message notification
notificationService.showMessageNotification('John Doe', 'Hey, how are you?');

// Test group notification  
notificationService.showGroupNotification('Project Team', 'Jane', 'Meeting in 5 mins');

// Test emergency
notificationService.showEmergencyNotification('John Doe', 'medical');
```

## Support

For issues or questions, contact the development team or check the browser console for error messages.
