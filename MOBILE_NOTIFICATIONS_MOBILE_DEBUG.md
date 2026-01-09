# Mobile Notifications - Mobile Browser Debug Guide

## Problem Statement
Notifications work on **desktop browser** but NOT on **mobile browser** (even when the app is open).

## Root Cause Analysis

### Possible Causes on Mobile:

1. **Notification Permission Not Granted on Mobile**
   - Mobile browsers have stricter permission handling
   - Permission dialog may not appear on first visit
   - Permission may be denied by default

2. **Service Worker Not Active on Mobile**
   - Service worker registration may fail silently
   - Service worker may be inactive/terminated
   - Browser may have killed the service worker

3. **Notification API Has Different Behavior on Mobile**
   - Some mobile browsers don't support Notification API
   - Mobile may require app to be installed as PWA
   - Notification display may be blocked by browser

4. **SignalR Connection Issue on Mobile**
   - WebSocket connection may not be established
   - Mobile network may drop connection
   - Browser tab may be deprioritized

5. **HTTPS/Domain Issues**
   - Service workers require HTTPS (except localhost)
   - Cross-origin issues may prevent notifications
   - Mixed HTTP/HTTPS content may be blocked

## Step-by-Step Debugging

### Step 1: Check Notification Permission on Mobile

**On your mobile phone, open browser console:**

1. Open the app on mobile
2. Press **F12** or **Ctrl+Shift+I** (or use Chrome DevTools on USB-connected phone)
3. Go to **Console** tab
4. Copy-paste this command:

```javascript
console.log('🔔 Notification Permission:', Notification.permission);
```

**You should see one of:**
- ✅ `'granted'` - Permission is enabled
- ⚠️ `'default'` - Need to request permission
- ❌ `'denied'` - Permission is blocked (need to enable in settings)

**If you see 'denied':**
1. Go to phone Settings
2. Find app/browser section
3. Look for "Notifications" permission
4. Enable it
5. Reload the app

**If you see 'default':**
Run this command:
```javascript
Notification.requestPermission().then(permission => {
  console.log('📋 Permission result:', permission);
});
```

A dialog should appear asking for permission. **Click ALLOW**.

### Step 2: Check Service Worker Status on Mobile

**In browser console on mobile:**

```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('📦 Service Workers registered:', regs.length);
  regs.forEach((reg, index) => {
    console.log(`SW ${index}: Scope: ${reg.scope}, Active: ${!!reg.active}`);
  });
});
```

**Expected output:**
```
📦 Service Workers registered: 1
SW 0: Scope: https://your-domain/, Active: true
```

**If you see Active: false:**
- Service worker is registered but not active
- Try: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Wait 5 seconds for service worker to activate

**If you see registered: 0:**
- Service worker didn't register
- Check console for errors: `navigator.serviceWorker.oncontrollerchange`
- Try clearing cache

### Step 3: Check SignalR Connection on Mobile

**In browser console on mobile:**

```javascript
// Get the SignalR service
signalRService = ng.probe(document.querySelector('app-root')).injector.get(SignalRService);

// Check connection state
console.log('🔌 SignalR connection state:', signalRService.hubConnection.state);
```

**You should see:**
- `1` = Connected (✅ Good)
- `0` = Disconnected (❌ Problem)
- `2` = Reconnecting (⏳ Waiting)

**If disconnected:**
1. Check network - phone connected to WiFi/cellular?
2. Check server URL in `environment.ts`
3. Try reloading page
4. Check browser console for connection errors

### Step 4: Monitor Network Activity on Mobile

**Using USB-connected Android phone with Chrome DevTools:**

1. Connect phone to computer via USB
2. On computer Chrome: Go to `chrome://inspect`
3. Select your phone
4. Click **inspect**
5. Go to **Network** tab
6. Filter by: **WS** (WebSocket)
7. Send a message from another device
8. Look for SignalR messages

**You should see:**
- `signalr` connection open
- Messages flowing through WebSocket

**If no WebSocket:**
- SignalR connection not established
- Check server endpoint URL
- Check HTTPS/HTTP mismatch

### Step 5: Test Notification Manually on Mobile

**In browser console on mobile:**

```javascript
// Method 1: Direct notification API test
const notification = new Notification('Test Notification', {
  body: 'This is a test from Notification API',
  icon: '/pnchat.ico'
});

notification.onshow = () => {
  console.log('✅ Notification displayed!');
};

notification.onerror = () => {
  console.error('❌ Notification error!');
};
```

**If this works:** Notification API is working on mobile
**If this fails:** Notification API is blocked or not supported

### Step 6: Test Service Worker Notification on Mobile

**In browser console on mobile:**

```javascript
// Test service worker notification
if (navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'SHOW_NOTIFICATION',
    title: 'Service Worker Test',
    options: {
      body: 'This is a test from service worker',
      icon: '/pnchat.ico'
    }
  });
  console.log('✅ Message sent to service worker');
} else {
  console.error('❌ No service worker controller');
}
```

**If notification appears:** Service worker is working
**If nothing appears:** Service worker message not working

### Step 7: Check Browser DevTools Application Tab

**On mobile with USB debugging:**

1. Open DevTools Inspector
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. Check status - should say **activated and running**
5. Check **Notification Permissions** if available

## Common Mobile Issues & Solutions

### Issue 1: Permission Shows as 'denied'

**Symptoms:** Notification permission rejected

**Solution:**
1. Android: Settings → Apps → Chrome/Browser → Permissions → Notifications → ON
2. iOS: Settings → Notifications → Your App → Allow

**Then:**
- Close and reopen browser
- Reload the app
- When permission dialog appears, click ALLOW

### Issue 2: Service Worker Not Active

**Symptoms:** Service Workers registered but not active

**Solution:**
1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Wait 5 seconds for service worker to activate
3. Check DevTools → Application → Service Workers

**If still not active:**
1. Clear browser cache: Settings → Clear browsing data
2. Restart browser
3. Reload app

### Issue 3: Service Worker File Not Found (404)

**Symptoms:** Error: "GET /service-worker.js 404"

**Solution:**
1. Check file exists in dist folder
2. Verify angular.json includes service-worker.js in assets
3. Rebuild: `npm run build`
4. Redeploy

### Issue 4: SignalR Connection Fails

**Symptoms:** No WebSocket connection, messages not received

**Solution:**
1. Check server is running
2. Verify server URL in `environment.ts`
3. Check HTTPS/HTTP consistency
4. Look for CORS errors in console

### Issue 5: Notification Permission Dialog Doesn't Appear

**Symptoms:** Permission dialog never shown

**Solution:**
1. Permission may already be set (check in browser settings)
2. Try incognito/private mode
3. Try different browser
4. Manually enable in phone settings

## Enhanced Console Logging

The app now has **verbose logging** for debugging. Open console on mobile and look for:

**Notification Service Messages:**
```
🔔 NotificationService initializing...
📋 Current notification permission: ...
🔔 Requesting notification permission from user...
✅ Permission result: granted
```

**Notification Display Messages:**
```
📢 showNotification called with title: New message from John
📢 Notification permission: granted
✅ Creating Notification with options: {...}
✅ Notification created successfully
✅ Notification shown
✅ Notification auto-closed
```

**Message Handler Messages:**
```
📬 handleIncomingMessageNotification called with data: {...}
📬 Processing notification for sender: John Doe
📨 Sending direct message notification for contact: ABC123
🔄 Sending notification to service worker: {...}
✅ Service worker controller found, posting message
✅ Message posted to service worker
```

**Service Worker Messages:**
```
✅ Service Worker registered: [registration object]
📨 Service Worker received message: {...}
📢 Service Worker showing notification: New message from John
✅ Service Worker notification displayed successfully
```

## Full Diagnostic Test

Run this complete test in browser console on mobile:

```javascript
console.log('=== FULL NOTIFICATION DIAGNOSTIC ===');

// 1. Check Notification API
console.log('1️⃣ Notification API:');
console.log('   Support:', 'Notification' in window ? 'YES' : 'NO');
if ('Notification' in window) {
  console.log('   Permission:', Notification.permission);
}

// 2. Check Service Worker
console.log('2️⃣ Service Worker:');
console.log('   Support:', 'serviceWorker' in navigator ? 'YES' : 'NO');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('   Registered:', regs.length);
    console.log('   Active Controller:', !!navigator.serviceWorker.controller ? 'YES' : 'NO');
  });
}

// 3. Check SignalR
console.log('3️⃣ SignalR Connection:');
try {
  const sr = ng.probe(document.querySelector('app-root')).injector.get(SignalRService);
  console.log('   State:', sr.hubConnection.state);
  // 0=Disconnected, 1=Connected, 2=Reconnecting
} catch (e) {
  console.log('   Error getting SignalR service');
}

// 4. Test notification
console.log('4️⃣ Test Notification:');
try {
  const testNotif = new Notification('Test', {
    body: 'Mobile test notification',
    icon: '/pnchat.ico'
  });
  testNotif.onshow = () => console.log('   ✅ Notification displayed');
  testNotif.onerror = () => console.log('   ❌ Notification error');
} catch (e) {
  console.log('   ❌ Error creating notification:', e.message);
}

console.log('=== END DIAGNOSTIC ===');
```

## What to Report If Still Not Working

If you've followed all steps and notifications still don't work on mobile, please provide:

1. **Device Info:**
   - Phone model (iPhone/Samsung/etc)
   - OS version (Android 12/iOS 16/etc)
   - Browser (Chrome/Firefox/Safari)
   - Browser version

2. **Console Output:**
   - Copy all console messages (look for errors)
   - Run diagnostic test above, share output

3. **Network Info:**
   - Is phone on WiFi or cellular?
   - Same network as desktop?
   - Check if server is HTTPS

4. **Permission Status:**
   - What does `Notification.permission` show?
   - Is notification permission enabled in settings?

5. **Service Worker Status:**
   - Output from `navigator.serviceWorker.getRegistrations()`
   - Is service worker active?

6. **SignalR Status:**
   - What does `hubConnection.state` show?
   - Are messages being received from server?

## Mobile Browser Specific Notes

### Android Chrome
- ✅ Best support
- ✅ Full Notification API support
- ✅ Service Worker support
- ✅ USB debugging available

### Android Firefox
- ✅ Good support
- ✅ Notification API support
- ✅ Service Worker support
- ✅ Can enable developer mode

### iOS Safari
- ⚠️ Limited support
- ⚠️ Notification API only on iOS 16+
- ⚠️ Best if app installed as PWA
- ⚠️ Limited debugging tools

### iOS Chrome/Firefox
- ⚠️ Use Safari engine (due to Apple restrictions)
- ⚠️ Same limitations as Safari
- ⚠️ Recommend upgrading iOS

## Next Steps

1. **Run Step 1-3 above** to identify which component is failing
2. **Check console for error messages** and report them
3. **Test notification manually** (Step 5) to verify API works
4. **Check service worker** (Step 2) to see if it's registered

Once you identify which step fails, we can focus on fixing that specific issue.
