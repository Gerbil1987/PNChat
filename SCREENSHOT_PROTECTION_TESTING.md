# Screenshot Protection - Testing Guide

## Quick Start

The screenshot protection service is automatically initialized when the Angular app starts. You'll see this log message in the browser console:

```
📸 Screenshot protection is active and monitoring for screenshot attempts
```

## Console Logs Overview

Watch the browser console (F12 → Console tab) for these indicators:

| Emoji | Meaning | Action |
|-------|---------|--------|
| 🛡️ | Screenshot protection | Service initializing or method called |
| ⚠️ | Warning | Screenshot attempt detected |
| ✅ | Success | Feature enabled or verified |
| 📹 | Screen capture | getDisplayMedia() called |
| 🖨️ | Print mode | Print dialog opened |
| 🔧 | Developer tools | DevTools detected |
| 🛑 | Blank screen | Overlay shown |

## Test Scenarios

### Desktop Testing

#### Test 1: Block PrintScreen Key ✅
**Steps:**
1. Open the app in browser
2. Open browser console (F12)
3. Press the `PrintScreen` key
4. Observe console logs
5. Observe black overlay appears for 3 seconds

**Expected Output in Console:**
```
⚠️ Print Screen attempted - showing blank screen
🛑 Showing blank screen
✅ Hiding blank screen
```

**Expected Visual:**
- Full-screen black overlay with white text: "⚠️ Screenshot Protection Active"
- Auto-hides after 3 seconds
- Normal app content reappears

---

#### Test 2: Block Ctrl+PrintScreen ✅
**Steps:**
1. Keep app open with console visible
2. Press `Ctrl+PrintScreen`
3. Check console for logs

**Expected Output in Console:**
```
⚠️ Ctrl+PrintScreen attempted - showing blank screen
🛑 Showing blank screen
```

---

#### Test 3: Block Print Mode ✅
**Steps:**
1. Open app
2. Press `Ctrl+P` to open print dialog
3. Observe console logs
4. Notice app shows black overlay

**Expected Output in Console:**
```
🖨️ Print mode detected - showing blank screen
🛑 Showing blank screen
```

**Expected Visual:**
- Black overlay appears when print dialog opens
- Hides when print dialog closes

---

#### Test 4: Block Developer Tools ✅
**Steps:**
1. Close dev tools if open
2. Press `F12` to try opening dev tools
3. Dev tools should not open

**Expected Result:**
- F12 key is blocked
- Dev tools does not open
- No console logs (because console isn't accessible)

---

#### Test 5: Block Inspect Element ✅
**Steps:**
1. Try to right-click on page
2. Try pressing `Ctrl+Shift+I`
3. Try pressing `Ctrl+Shift+C`

**Expected Result:**
- Right-click menu is blocked
- Inspect element keyboard shortcuts are blocked
- No inspect element opens

---

#### Test 6: Screen Recording Attempt ⚠️
**Steps (Chrome/Edge):**
1. Open app
2. Open console
3. Paste this in console:
```javascript
navigator.mediaDevices.getDisplayMedia({ video: true })
  .then(stream => console.log('Got stream:', stream))
  .catch(err => console.log('Error:', err));
```
4. Press Enter
5. Watch console

**Expected Output:**
```
📹 Screen capture attempt detected - returning blank screen
Got stream: MediaStream {...}
```

**Result:**
- The stream returned will be a blank black canvas
- Screen capture will get black instead of actual content

---

### Mobile Testing

#### Prerequisites
- Mobile device (iPhone or Android)
- App deployed to accessible URL or running on local network
- Mobile browser (Chrome, Safari, Firefox, Edge)

#### Test 1: Block Mobile Screenshots (Android)
**Steps:**
1. Open app on Android device
2. Try screenshot gesture (Power + Volume Down)
3. Open Chrome DevTools (if possible) to check console

**Expected:**
- Black overlay may appear (if supported)
- Console logs show protection active
- Screenshot may be blocked or show black screen

#### Test 2: Block Mobile Screenshots (iOS)
**Steps:**
1. Open app on iPhone
2. Try screenshot gesture (Power + Volume Up)
3. Open Safari Developer Console (Settings → Safari → Advanced → Web Inspector)

**Expected:**
- Similar behavior to Android
- Black overlay appears when triggered
- Console shows protection logs

#### Test 3: Test with Safari Screen Recording
**Steps (macOS/iOS):**
1. Open app in Safari
2. Open Control Center (macOS: Corner, iOS: Swipe down)
3. Try to start screen recording
4. Watch console

**Expected:**
- Black overlay appears
- Screen recording would capture black instead of content

---

## Expected Console Output Sequence

When you first load the app, you should see:

```
🛡️ Initializing screenshot protection...
✅ Screenshot shortcuts blocked
✅ Print media monitoring enabled
✅ Screen capture monitoring enabled
✅ Context menu blocked
✅ Developer tools detection enabled
📸 Screenshot protection is active and monitoring for screenshot attempts
Environment API URL: http://localhost:3000/api
Environment baseUrl: http://localhost:3000
```

Then whenever you attempt a screenshot:

```
⚠️ [ACTION ATTEMPTED] - showing blank screen
🛑 Showing blank screen
[... after 3 seconds ...]
✅ Hiding blank screen
```

---

## Troubleshooting

### Issue: No logs appearing in console
**Solution:**
- Make sure DevTools is open (F12)
- Check that you're in the "Console" tab
- Refresh the page (F5 or Cmd+R)
- Check browser console preferences

### Issue: Black overlay not showing
**Possible Causes:**
- Screenshot protection might have encountered an error
- CSS might be overriding the overlay display
- Try a different browser

### Issue: PrintScreen key still works
**Solution:**
- This is expected on some systems - the OS may handle PrintScreen before the browser
- The protection prevents clipboard capture in the app
- Screen recording API is blocked regardless

### Issue: Developer tools can still open
**Solution:**
- F12 blocking is browser-dependent
- Most modern browsers support the blocking
- Try using keyboard shortcuts instead of right-click menu

---

## Advanced Testing

### Test with Chrome DevTools Network Throttling
1. Open DevTools (F12)
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Try screenshot attempt
5. Verify overlay still appears even with slow network

### Test with Console Visible
1. Open app with DevTools console visible
2. Try screenshot
3. Observe logs appear in real-time as overlay shows/hides

### Test Event Listeners
In console, run:
```javascript
// Check all registered event listeners for keydown
console.log('Screenshot protection is intercepting keydown events');

// Verify overlay exists when created
document.getElementById('screenshot-protection-overlay')
// Should return the overlay element or null if not triggered yet
```

---

## Performance Monitoring

Monitor console for any performance impact:

```javascript
// Check if DevTools detection is running
// You'll see this happening in background every 2 seconds
console.log('Checking for DevTools...');
```

---

## Report Results

When testing, document:
- ✅ What works
- ❌ What doesn't work
- 🔧 Browser/device where tested
- 📱 OS version
- 🌐 Chrome/Firefox/Safari/Edge version
- 💬 Any console errors

Example report:
```
✅ PrintScreen blocked: YES
✅ Ctrl+PrintScreen blocked: YES
✅ Print mode detection: YES
✅ Developer tools blocking: YES
❌ Screen capture API override: Device doesn't support (some older devices)
🔧 Tested on: Chrome v120, Windows 11
```

---

## Notes

- The black overlay auto-hides after 3 seconds, not interfering with normal app usage
- Multiple protection mechanisms working together provide layered defense
- Console logs help audit all protection attempts
- Some mobile browsers may have restrictions on certain APIs

---

**Last Updated:** January 2026  
**Status:** Ready for testing ✅
