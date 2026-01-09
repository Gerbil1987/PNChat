# Mobile Notifications Testing Checklist

Use this checklist to verify that mobile notifications are working correctly in your app.

## Pre-Test Setup

### Device Setup
- [ ] Phone connected to same network as laptop (optional but helpful)
- [ ] Phone has Chrome, Firefox, or Edge installed
- [ ] Phone has sufficient battery (> 20%)
- [ ] Phone and laptop both have internet connection

### App Setup
- [ ] Latest version of app is running
- [ ] Dev server running: `npm start` in PNChatClient folder
- [ ] App is accessible at: `http://localhost:4200` (desktop) and `https://your-ip:4200` (mobile)

## Test Execution

### Test 1: Service Worker Registration ✓

**Objective:** Verify service worker is registered

**Steps:**
1. Open browser console (F12)
2. Run command:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => {
     console.log('Service Workers:', regs.length);
     regs.forEach(reg => console.log('Scope:', reg.scope));
   });
   ```
3. You should see 1 service worker

**Expected Result:** ✅
- [ ] Console shows: "Service Workers: 1"
- [ ] Scope matches your domain

**If Failed:** ❌
- [ ] Check console for errors
- [ ] Check Application tab → Service Workers
- [ ] Try: Clear cache and reload

---

### Test 2: Notification Permission ✓

**Objective:** Verify notification permission is granted

**Steps:**
1. Open browser console
2. Run command:
   ```javascript
   console.log('Notification permission:', Notification.permission);
   ```
3. Permission should be 'granted'

**If 'default':**
   ```javascript
   Notification.requestPermission().then(permission => {
     console.log('Permission result:', permission);
   });
   ```

**Expected Result:** ✅
- [ ] Permission is 'granted'
- [ ] Permission dialog appeared (first visit)
- [ ] Can revoke in: Settings → Notifications

**If 'denied':** ❌
- [ ] Phone Settings → Apps → Browser → Permissions → Notifications
- [ ] Enable notifications
- [ ] Reload app and grant permission again

---

### Test 3: Direct Message Notification ✓

**Objective:** Test notification when receiving direct message

**Setup:**
- [ ] User A: Logged in on phone
- [ ] User B: Logged in on laptop
- [ ] Both in same chat window or just opened the app

**Steps:**
1. User A: Keep chat window open on phone
2. User B: Send a message to User A
3. User A: Watch for notification

**Expected Result:** ✅ (App Open)
- [ ] Notification appears immediately in status bar
- [ ] Notification shows: "New message from [User B Name]"
- [ ] Shows message preview
- [ ] Auto-closes after 5 seconds
- [ ] Chat updates with new message

**Expected Result:** ✅ (App Minimized)
- [ ] Minimize app on phone
- [ ] Send message from laptop
- [ ] Notification appears in system tray
- [ ] Can click notification to open app

**Test Result:**
- [ ] Passed - Notifications appear
- [ ] Failed - No notifications

---

### Test 4: Group Message Notification ✓

**Objective:** Test notification for group messages

**Setup:**
- [ ] Create a group with 2+ members
- [ ] User A: In group on phone
- [ ] User B: In group on laptop

**Steps:**
1. User A: Keep group chat open on phone
2. User B: Send message to group
3. User A: Watch for notification

**Expected Result:** ✅
- [ ] Notification appears in status bar
- [ ] Shows: "[Group Name] - [User B Name]"
- [ ] Shows message preview
- [ ] Updates chat with new message

**Test Result:**
- [ ] Passed - Group notifications work
- [ ] Failed - No notifications

---

### Test 5: Emergency Message Notification ✓

**Objective:** Test high-priority emergency notifications

**Setup:**
- [ ] User A: On phone
- [ ] User B: On laptop

**Steps:**
1. User A: Keep app open on phone
2. User B: Send message starting with 🚨 or ⚠️
   - Example: "🚨 Medical emergency at location..."
3. User A: Watch for notification

**Expected Result:** ✅
- [ ] Notification appears with red/alert styling
- [ ] Shows: "🚨 Medical Emergency! from [User B]"
- [ ] Does NOT auto-close (requireInteraction: true)
- [ ] Must click or dismiss manually

**Test Result:**
- [ ] Passed - Emergency notifications work
- [ ] Failed - No notifications

---

### Test 6: Multiple Devices ✓

**Objective:** Verify notifications work on multiple devices

**Setup:**
- [ ] Device 1: Phone with Chrome
- [ ] Device 2: Tablet or another phone
- [ ] Device 3: Laptop
- [ ] All logged in with same or different users

**Steps:**
1. Send message from Laptop to Phone
2. Check notification on Phone
3. Send message from Laptop to Tablet
4. Check notification on Tablet

**Expected Result:** ✅
- [ ] Phone receives notification
- [ ] Tablet receives notification
- [ ] Both show correct sender/content
- [ ] All devices have same message in chat

**Test Result:**
- [ ] Passed - Works on multiple devices
- [ ] Failed - Notifications only on some devices

---

### Test 7: Notification Click Action ✓

**Objective:** Verify clicking notification opens/focuses app

**Setup:**
- [ ] App open on phone but minimized
- [ ] Notification pending

**Steps:**
1. Minimize app on phone
2. Send message from laptop
3. Wait for notification
4. Click notification
5. Observe app

**Expected Result:** ✅
- [ ] Notification appears in system tray
- [ ] Clicking notification opens/focuses app
- [ ] App shows the chat with new message
- [ ] No errors in console

**Test Result:**
- [ ] Passed - Notifications are clickable
- [ ] Failed - Clicking notification doesn't work

---

### Test 8: Notification Content ✓

**Objective:** Verify notification shows correct content

**Setup:**
- [ ] Prepare different message types
- [ ] Short message (< 50 chars)
- [ ] Long message (> 100 chars)
- [ ] Message with emoji
- [ ] Message with special characters

**Steps:**
1. Send each type of message to phone
2. Observe notification content

**Expected Result:** ✅
- [ ] Short messages show fully
- [ ] Long messages truncated at 100 chars with "..."
- [ ] Emoji displays correctly
- [ ] Special characters display correctly
- [ ] Sender name shows correctly

**Test Result:**
- [ ] Passed - Content displays correctly
- [ ] Failed - Content issues

---

### Test 9: Notification Permissions Dialog ✓

**Objective:** Verify first-time permission request

**Setup:**
- [ ] Browser in incognito/private mode
- [ ] First visit to app

**Steps:**
1. Open app for first time
2. Watch for permission dialog
3. Try both "Allow" and "Block"

**Expected Result (Allow):** ✅
- [ ] Permission dialog appears
- [ ] After allowing: Notifications work
- [ ] Permission shows as 'granted'

**Expected Result (Block):** ✅
- [ ] Permission dialog appears
- [ ] After blocking: No notifications
- [ ] Permission shows as 'denied'
- [ ] Can re-grant in: Settings → Notifications

**Test Result:**
- [ ] Passed - Permission handling works
- [ ] Failed - Permission issues

---

### Test 10: Service Worker Background Mode ✓

**Objective:** Verify service worker handles notifications when app is closed

**Setup:**
- [ ] App running on phone (can be minimized)
- [ ] Service worker registered

**Steps:**
1. Close/minimize app completely
2. Send message from laptop
3. Wait for notification
4. Check system tray (even if app is closed)

**Expected Result:** ⚠️
- [ ] Notification appears (if browser is still open)
- [ ] May not appear if browser is completely closed*
- [ ] *Unless backend push integration is set up (optional feature)

**Test Result:**
- [ ] Passed - Works with browser open
- [ ] Expected - Doesn't work with browser closed (requires backend setup)

---

## Manual Notification Testing

**If automatic tests don't trigger notifications, you can test manually:**

```javascript
// In browser console on phone:

// Get notification service
notificationService = ng.probe(
  document.querySelector('app-root')
).injector.get(ng.coreTokens.NotificationService);

// Test direct message notification
notificationService.showMessageNotification('John Doe', 'Hello! How are you?');

// Test group notification
notificationService.showGroupNotification('Team Chat', 'Jane Doe', 'Meeting in 5 mins');

// Test emergency notification
notificationService.showEmergencyNotification('John Doe', 'medical');

// Test service worker notification
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'SHOW_NOTIFICATION',
    title: 'Service Worker Test',
    options: {
      body: 'This is a test notification from service worker',
      icon: '/pnchat.ico',
      badge: '/pnchat.ico'
    }
  });
}
```

---

## Troubleshooting Reference

### Common Issues

**Issue: No notifications appear**
- [ ] Check: Notification permission is 'granted'
- [ ] Check: Service worker is registered
- [ ] Check: No errors in console
- [ ] Try: Reload page, clear cache

**Issue: Notifications only on laptop, not phone**
- [ ] Phone settings: Enable notifications
- [ ] Try different browser (Chrome best)
- [ ] Check: Service worker status on phone
- [ ] Try: Incognito mode

**Issue: Notification permission dialog doesn't appear**
- [ ] Permission may already be set (check settings)
- [ ] Try: Incognito/private mode
- [ ] Try: Different browser

**Issue: Clicking notification doesn't work**
- [ ] Check: App is still running
- [ ] Check: No errors in console
- [ ] Try: Reloading service worker
- [ ] Try: Clearing cache

---

## Documentation Reference

For more details, see:
- `MOBILE_NOTIFICATIONS_QUICK_START.md` - Quick start guide
- `MOBILE_NOTIFICATIONS_DEBUG.md` - Detailed debugging
- `NOTIFICATION_SYSTEM_ARCHITECTURE.md` - Technical architecture

---

## Final Sign-Off

**Date Tested:** _____________

**Devices Tested:**
- [ ] Desktop Chrome
- [ ] Desktop Firefox
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)
- [ ] Other: _________________

**Overall Result:**
- [ ] ✅ All tests passed
- [ ] ⚠️ Some tests failed (see notes below)
- [ ] ❌ Tests not yet performed

**Notes:**
```
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
```

**Tested By:** ______________________ **Date:** ______________________

---

## Quick Reference Commands

### In Browser Console:

```javascript
// Check everything
notificationDebugService = ng.probe(document.querySelector('app-root')).injector.get(NotificationDebugService);
notificationDebugService.printStatusSummary();
notificationDebugService.printLogs();

// Check individual status
console.log('Service Workers:', navigator.serviceWorker.controller ? 'Active' : 'Inactive');
console.log('Notification Permission:', Notification.permission);
console.log('Push API Supported:', 'pushManager' in ServiceWorkerRegistration.prototype);
```

### In DevTools:

1. **Service Worker Check:**
   - Application tab → Service Workers
   - Should show: "activated and running"

2. **Network Check:**
   - Network tab → Filter: "ws"
   - Should see: signalr connection open

3. **Cache Check:**
   - Application tab → Cache Storage
   - View cached resources

---

**Need help?** See the troubleshooting section above or refer to the debug documentation.
