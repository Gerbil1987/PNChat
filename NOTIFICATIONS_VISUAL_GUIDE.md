# Mobile Notifications - Visual Guide

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER A SENDS MESSAGE                        │
│                   (on laptop/phone)                              │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  Send message to backend │
              │  via HTTP                │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │   Backend processes      │
              │   message                │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Send SignalR update     │
              │  to connected clients    │
              └────────────┬─────────────┘
                           │
              ┌────────────┴───────────┐
              │                        │
              ▼                        ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ USER B (Same tab)│    │ USER B (Different│
    │                  │    │ tab/device)      │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │MessageDetail     │    │MessageDetail     │
    │Component         │    │Component         │
    │receives signal   │    │receives signal   │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │Check: from curr  │    │Check: from curr  │
    │user? (skip)      │    │user? (skip)      │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │Send to:          │    │Send to:          │
    │1. Notification   │    │1. Notification   │
    │   API            │    │   API            │
    │2. Service Worker │    │2. Service Worker │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
    ┌────────┴───────────────────────┴───────┐
    │                                        │
    ▼                                        ▼
┌─────────────────────┐          ┌─────────────────────┐
│     DESKTOP APP     │          │     MOBILE APP      │
│     (Foreground)    │          │   (Open/Minimized)  │
│                     │          │                     │
│  ┌──────────────┐   │          │  ┌──────────────┐   │
│  │Notification  │   │          │  │Notification  │   │
│  │API           │   │          │  │API or        │   │
│  │SHOWS →────────────────────→ │  │Service Worker│   │
│  └──────────────┘   │          │  │SHOWS in tray │   │
│                     │          │  └──────────────┘   │
│  ┌──────────────┐   │          │                     │
│  │Service Worker│   │          │  ┌──────────────┐   │
│  │(Background)  │   │          │  │Service Worker│   │
│  │Ready but      │   │          │  │(Background)  │   │
│  │not needed    │   │          │  │Shows if app  │   │
│  └──────────────┘   │          │  │minimized     │   │
└─────────────────────┘          │  └──────────────┘   │
                                 └─────────────────────┘
```

## Notification Delivery Paths

### Path 1: App in Foreground ✅
```
Message Arrives → Notification API → Visible immediately → Auto-close 5s
```

### Path 2: App Minimized/Backgrounded ✅
```
Message Arrives → Service Worker → Message API → Show in tray → Persistent
```

### Path 3: Browser Closed ⚠️
```
Message Arrives → [WAITING FOR BACKEND PUSH] → Requires server integration
```

## Service Worker Lifecycle

```
┌─────────────────┐
│  App Loads      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  index.html registers SW        │
│  navigator.serviceWorker.       │
│  register('/service-worker.js') │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Browser Downloads SW file      │
│  (service-worker.js from dist/) │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SW 'install' event fires       │
│  skipWaiting() - force activation│
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SW 'activate' event fires      │
│  clients.claim() - take control │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  SW Ready (activated)            │
│  Can now handle:                 │
│  - push events                   │
│  - message events                │
│  - notification clicks           │
└──────────────────────────────────┘
```

## Notification Types

### Direct Message
```
┌─────────────────────────────────┐
│ 👤 New message from John Doe    │
├─────────────────────────────────┤
│ Hello! How are you today?       │
├─────────────────────────────────┤
│ [Icon] [Auto-closes in 5 secs]  │
└─────────────────────────────────┘
```

### Group Message
```
┌─────────────────────────────────┐
│ Team Meeting - Jane Smith       │
├─────────────────────────────────┤
│ The meeting is postponed to 3pm │
├─────────────────────────────────┤
│ [Icon] [Auto-closes in 5 secs]  │
└─────────────────────────────────┘
```

### Emergency Message
```
┌─────────────────────────────────┐
│ 🚨 MEDICAL EMERGENCY!           │
│    from John Doe                │
├─────────────────────────────────┤
│ Alert at coordinates: 40°, 74°  │
├─────────────────────────────────┤
│ [Icon] [PERSISTENT - click me!] │
└─────────────────────────────────┘
```

## Permission Request Flow

```
┌─────────────────┐
│ User opens app  │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ NotificationService  │
│ initialization       │
└────────┬─────────────┘
         │
         ▼
┌───────────────────────────────────┐
│ Check: Has permission been asked? │
└────┬──────────────────────┬───────┘
     │                      │
   NO                       YES
     │                      │
     ▼                      ▼
┌──────────────────┐  ┌──────────────────┐
│ Show permission  │  │ Use existing     │
│ dialog to user   │  │ permission       │
│ "Allow/Block"    │  │                  │
└────────┬─────────┘  └──────┬───────────┘
         │                   │
    ┌────┴───────────────────┴───┐
    │                            │
    ▼                            ▼
┌──────────────┐         ┌──────────────┐
│GRANTED       │         │DENIED        │
│              │         │              │
│Setup Push    │         │Skip notif.   │
│Subscribe     │         │Allow manual  │
│Ready!        │         │override      │
└──────────────┘         └──────────────┘
```

## Notification Event Handling

```
Message Arrives via SignalR
         │
         ▼
messageHubListener Event
         │
         ▼
getMessage() - fetch latest
         │
         ▼
handleIncomingMessageNotification(data)
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
Is from current user?              Extract sender info
     │                              - Name
     ├─ YES → SKIP                  - Avatar
     │                              - Content
     └─ NO → CONTINUE               - Type
                   │
                   ▼
        Determine notification type
         │
         ├─ Emergency (🚨/⚠️)
         │  └─ showEmergencyNotification()
         │     └─ HIGH PRIORITY
         │        └─ requireInteraction: true
         │
         ├─ Group Message
         │  └─ showGroupNotification()
         │     └─ Show: Group + Sender
         │
         └─ Direct Message
            └─ showMessageNotification()
               └─ Show: Sender + Preview
               
         │
         ▼
Send notification TWO WAYS
         │
    ┌────┴────┐
    │          │
    ▼          ▼
Notif. API  Service Worker
    │          Message API
    │          │
    ▼          ▼
If app    If app minimized
open      or closed
    │          │
    ▼          ▼
Show      Queue & show
immediately in tray
Auto-close  Persistent
```

## Device-Specific Flows

### Desktop Chrome
```
Message → SignalR → Component → Notification API → Status Bar → Click → Focus
```

### Mobile Chrome (Android)
```
Message → SignalR → Component → Notification API → Status Bar
                               → Service Worker   → Tray
                                                  → Click → Focus
```

### Mobile Safari (iOS 16+)
```
Message → SignalR → Component → Limited Notification Support
                               → Best if PWA installed
```

## File Structure

```
PNChatClient/
├── src/
│   ├── index.html ............................ Service worker registration
│   ├── service-worker.js .................... Push & message handling
│   │
│   └── app/
│       ├── app.component.ts ................. Debug service integration
│       │
│       ├── core/service/
│       │   ├── notification.service.ts ...... Main notification service
│       │   ├── notification-debug.service.ts NEW: Debug service
│       │   └── signalR.service.ts .......... Real-time messaging
│       │
│       └── containers/home/template/message/
│           └── message-detail/
│               └── message-detail.component.ts Notification triggering
│
└── angular.json ............................ Build configuration
```

## Browser DevTools Locations

### Check Service Worker
```
DevTools
  → Application Tab
    → Service Workers
      → You should see service-worker.js
         Status: "activated and running"
```

### Monitor Messages
```
DevTools
  → Network Tab
    → Filter: "ws" (WebSocket)
      → Look for: signalr connection
         → Messages flow through this
```

### View Console Logs
```
DevTools
  → Console Tab
    → Filter: "notification" or "service worker"
      → All debug messages appear here
```

### Check Cache Storage
```
DevTools
  → Application Tab
    → Cache Storage
      → View cached resources
         → Service worker cache
```

## Testing Scenarios

### Scenario 1: Both Users on Desktop
```
User A (Laptop) ──message──> Server ──signal──> User B (Laptop)
                                              Shows notification ✅
```

### Scenario 2: One User on Mobile
```
User A (Laptop) ──message──> Server ──signal──> User B (Phone/Minimized)
                                              Service Worker active ✅
                                              Shows notification in tray ✅
```

### Scenario 3: Cross-Device
```
User A (Phone) ──message──> Server ──signal──> User B (Laptop) ✅
                                     signal──> User B (Tablet) ✅
                                     signal──> User C (Phone) ✅
All receive notifications simultaneously
```

### Scenario 4: Group Message
```
User A ──message──> Server ──broadcasts──> All Group Members
                                (Each member gets signal)
                                (Each sees notification)
                                Different notification type:
                                "Team Chat - User A"
```

## Quick Status Check

```
✅ Service Worker Registered?
   → DevTools: Application → Service Workers
   → Should see: "activated and running"

✅ Notification Permission?
   → Console: console.log(Notification.permission)
   → Should be: "granted"

✅ SignalR Connected?
   → Console: signalRService.hubConnection.state
   → Should be: 1 (Connected)

✅ Notifications Working?
   → Send test message
   → Check phone notification
   → Check console for errors
```

## Troubleshooting Decision Tree

```
No notifications?
     │
     ├─ Check: Service Worker registered?
     │  └─ No  → Clear cache, reload
     │  └─ Yes → Continue
     │
     ├─ Check: Permission granted?
     │  └─ No  → Grant in settings
     │  └─ Yes → Continue
     │
     ├─ Check: SignalR connected?
     │  └─ No  → Check server connection
     │  └─ Yes → Continue
     │
     ├─ Check: Console for errors?
     │  └─ Yes → Debug specific error
     │  └─ No  → Continue
     │
     └─ Try: Different browser
        └─ Still no → Check debug guide
```

---

**For more details:** See documentation files in `/PNChat` folder
**Quick reference:** QUICK_REFERENCE_NOTIFICATIONS.md
**Full guide:** README_MOBILE_NOTIFICATIONS.md
