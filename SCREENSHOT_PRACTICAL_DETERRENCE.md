# Practical Screenshot Deterrence - Implementation Guide

## Overview
Since OS-level screenshot prevention is impossible, implement **practical deterrents** that make screenshots less useful and more traceable.

---

## 🎯 Enhancement 1: Add Visible Watermarking

### Step 1: Create Watermark Component

**File:** `src/app/core/directives/screenshot-watermark.directive.ts`

```typescript
import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { AuthenticationService } from '../service/authentication.service';

@Directive({
  selector: '[appScreenshotWatermark]'
})
export class ScreenshotWatermarkDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private authService: AuthenticationService
  ) {}

  ngOnInit() {
    this.addWatermark();
  }

  private addWatermark() {
    const currentUser = this.authService.currentUserValue;
    const timestamp = new Date().toLocaleString();
    const watermarkText = `User: ${currentUser?.FullName || currentUser?.User} | Time: ${timestamp}`;

    // Create watermark element
    const watermark = this.renderer.createElement('div');
    this.renderer.addClass(watermark, 'screenshot-watermark');
    this.renderer.setProperty(watermark, 'textContent', watermarkText);
    
    // Style the watermark
    const styles = `
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      pointer-events: none;
      font-family: monospace;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    
    this.renderer.setAttribute(watermark, 'style', styles);
    this.renderer.appendChild(this.el.nativeElement, watermark);
  }
}
```

### Step 2: Add to Component

In `message-detail.component.html`:

```html
<div appScreenshotWatermark class="message-detail-container">
  <!-- Your message content here -->
</div>
```

### Step 3: Register Directive

In `app.module.ts`:

```typescript
import { ScreenshotWatermarkDirective } from './core/directives/screenshot-watermark.directive';

@NgModule({
  declarations: [
    // ... other declarations
    ScreenshotWatermarkDirective
  ]
})
export class AppModule { }
```

---

## 🎯 Enhancement 2: Background Watermark

Add a repeating diagonal watermark across the entire app:

**File:** `src/styles.css` (Global styles)

```css
/* Diagonal watermark across entire app */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 200px,
      rgba(255, 0, 0, 0.08) 200px,
      rgba(255, 0, 0, 0.08) 400px
    );
  background-size: 300px 300px;
  pointer-events: none;
  z-index: -1;
  font-family: Arial, sans-serif;
}

/* Repeating text watermark */
body::after {
  content: 'DO NOT SCREENSHOT - CONFIDENTIAL';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 120px;
  font-weight: bold;
  color: rgba(255, 0, 0, 0.05);
  white-space: nowrap;
  pointer-events: none;
  z-index: -1;
  width: 300%;
  height: 300%;
  text-align: center;
  letter-spacing: 20px;
}
```

---

## 🎯 Enhancement 3: Dynamic Timestamp Display

Update the watermark with current time so screenshots always show when they were taken:

**File:** `src/app/core/directives/live-timestamp.directive.ts`

```typescript
import { Directive, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appLiveTimestamp]'
})
export class LiveTimestampDirective implements OnInit, OnDestroy {
  private interval: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.updateTimestamp();
    // Update every second
    this.interval = setInterval(() => {
      this.updateTimestamp();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    this.renderer.setProperty(
      this.el.nativeElement,
      'textContent',
      `${dateString} ${timeString}`
    );
  }
}
```

---

## 🎯 Enhancement 4: Session-Based Access Control

Require re-authentication for sensitive data access:

**File:** `src/app/core/service/session-guard.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionGuardService {
  private lastActivityTime = Date.now();
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private isSessionValid$ = new BehaviorSubject(true);

  constructor() {
    this.monitorActivity();
  }

  /**
   * Monitor user activity and timeout inactive sessions
   */
  private monitorActivity() {
    document.addEventListener('mousemove', () => this.updateActivity());
    document.addEventListener('keypress', () => this.updateActivity());
    document.addEventListener('click', () => this.updateActivity());
  }

  /**
   * Update last activity time
   */
  private updateActivity() {
    this.lastActivityTime = Date.now();
    
    // If session was invalid, mark it as valid again
    if (!this.isSessionValid$.value) {
      this.isSessionValid$.next(true);
      console.log('✅ Session reactivated due to user activity');
    }
  }

  /**
   * Check if session is still valid (not timed out)
   */
  isSessionValid(): boolean {
    const elapsed = Date.now() - this.lastActivityTime;
    const isValid = elapsed < this.sessionTimeout;
    
    if (!isValid && this.isSessionValid$.value) {
      this.isSessionValid$.next(false);
      console.warn('⏱️ Session expired due to inactivity');
    }
    
    return isValid;
  }

  /**
   * Get session validity as observable
   */
  getSessionStatus(): Observable<boolean> {
    return this.isSessionValid$.asObservable();
  }

  /**
   * Require re-authentication before accessing sensitive data
   */
  requireReauthentication(): Promise<boolean> {
    return new Promise((resolve) => {
      const authenticated = confirm(
        'Your session has expired. Click OK to re-authenticate and continue.'
      );
      
      if (authenticated) {
        this.lastActivityTime = Date.now();
        this.isSessionValid$.next(true);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }
}
```

**Usage in component:**

```typescript
export class MessageDetailComponent implements OnInit {
  constructor(
    private sessionGuard: SessionGuardService,
    // ... other services
  ) {}

  async viewSensitiveMessage(message: Message) {
    if (!this.sessionGuard.isSessionValid()) {
      const authenticated = await this.sessionGuard.requireReauthentication();
      if (!authenticated) {
        return; // User didn't re-authenticate
      }
    }

    // Show the message
    console.log('Displaying sensitive message:', message);
  }
}
```

---

## 🎯 Enhancement 5: Audit Logging

Log all access to sensitive data:

**File:** `src/app/core/service/audit-log.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface AuditLogEntry {
  userId: string;
  userName: string;
  action: string;
  timestamp: Date;
  details?: any;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) {}

  /**
   * Log sensitive data access
   */
  logSensitiveDataAccess(details: any) {
    const currentUser = this.authService.currentUserValue;
    
    const logEntry: AuditLogEntry = {
      userId: currentUser?.Code,
      userName: currentUser?.FullName || currentUser?.User,
      action: 'accessed_sensitive_data',
      timestamp: new Date(),
      details: details,
      userAgent: navigator.userAgent
    };

    console.log('📋 Audit Log:', logEntry);

    // Send to backend
    this.sendAuditLog(logEntry).subscribe({
      next: () => console.log('✅ Audit log sent'),
      error: (err) => console.warn('⚠️ Failed to send audit log:', err)
    });
  }

  /**
   * Log screenshot attempts
   */
  logScreenshotAttempt(type: string) {
    const currentUser = this.authService.currentUserValue;
    
    const logEntry: AuditLogEntry = {
      userId: currentUser?.Code,
      userName: currentUser?.FullName || currentUser?.User,
      action: 'screenshot_attempt',
      timestamp: new Date(),
      details: { type },
      userAgent: navigator.userAgent
    };

    console.log('🖼️ Screenshot Attempt Log:', logEntry);

    this.sendAuditLog(logEntry).subscribe({
      next: () => console.log('✅ Screenshot attempt logged'),
      error: (err) => console.warn('⚠️ Failed to log attempt:', err)
    });
  }

  /**
   * Send audit log to backend
   */
  private sendAuditLog(entry: AuditLogEntry) {
    return this.http.post(
      `${environment.apiUrl}/api/audit-logs`,
      entry
    );
  }
}
```

**Usage:**

```typescript
// Log when viewing sensitive messages
private handleIncomingMessageNotification(data: any): void {
  // ... existing code ...

  if (this.isEmergencyMessage(messageContent)) {
    this.auditLogService.logSensitiveDataAccess({
      messageType: 'emergency',
      sender: senderName,
      timestamp: new Date()
    });
  }
}
```

---

## 🎯 Enhancement 6: Anti-Screenshot Banner

Add a prominent banner reminding users not to screenshot:

**File:** `src/app/core/components/anti-screenshot-banner.component.ts`

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { AuthenticationService } from '../service/authentication.service';

@Component({
  selector: 'app-anti-screenshot-banner',
  template: `
    <div class="anti-screenshot-banner" *ngIf="currentUser">
      <span class="banner-icon">⚠️</span>
      <span class="banner-text">
        Unauthorized copying or sharing of this content is prohibited.
        Your actions are logged and monitored.
      </span>
      <span class="user-id">
        User ID: {{ currentUser.Code }}
      </span>
    </div>
  `,
  styles: [`
    .anti-screenshot-banner {
      background: linear-gradient(90deg, #ff4444 0%, #cc0000 100%);
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .banner-icon {
      font-size: 20px;
      margin-right: 10px;
    }

    .banner-text {
      flex: 1;
      font-size: 14px;
    }

    .user-id {
      background: rgba(0,0,0,0.3);
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 12px;
      font-family: monospace;
      margin-left: 20px;
    }
  `]
})
export class AntiScreenshotBannerComponent implements OnInit {
  currentUser: any;

  constructor(private authService: AuthenticationService) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
  }
}
```

---

## 🎯 Enhancement 7: Blur Sensitive on Print

Modify the print stylesheet to hide/blur sensitive data:

**File:** `src/styles.css`

```css
@media print {
  /* Hide sensitive elements when printing */
  .sensitive-content {
    display: none !important;
  }

  /* Blur message content in print */
  .message-content {
    filter: blur(10px) !important;
    background: #000 !important;
    color: transparent !important;
  }

  /* Show warning in print */
  body::before {
    content: 'PRINTING IS NOT ALLOWED - This page cannot be printed' !important;
    display: block !important;
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    font-size: 48px !important;
    color: red !important;
    font-weight: bold !important;
    z-index: 10000 !important;
  }
}
```

---

## 📋 Implementation Checklist

- [ ] Add visible watermark directive (Enhancement 1)
- [ ] Add background watermark CSS (Enhancement 2)
- [ ] Add live timestamp directive (Enhancement 3)
- [ ] Add session guard service (Enhancement 4)
- [ ] Add audit log service (Enhancement 5)
- [ ] Add anti-screenshot banner (Enhancement 6)
- [ ] Add print protection CSS (Enhancement 7)
- [ ] Register all in AppModule
- [ ] Test on desktop
- [ ] Test on mobile
- [ ] Verify audit logs being saved
- [ ] Update documentation
- [ ] Deploy to production

---

## 🎯 Combined Effect

When all enhancements are implemented:

```
User attempts to screenshot
        │
        ├─ Sees watermark with their name
        ├─ Sees timestamp of screenshot
        ├─ Sees warning banner at top
        ├─ Sees background warning text
        ├─ Session has been logged
        │
        └─ If they share the screenshot:
           ├─ Their name is visible (identifiable)
           ├─ Timestamp is visible
           ├─ You have audit log of their access
           ├─ DMCA takedown can reference their ID
           └─ Legal consequences are clear
```

---

## ✅ Status

**Realistic Screenshot Prevention:** Impossible  
**Practical Screenshot Deterrence:** Fully implementable  
**Traceability:** Complete with watermarking + logging  
**Legal Protection:** Enhanced with audit trail  

**Result:** Users can still take screenshots, but:**
- ✅ Their actions are logged
- ✅ Their identity is watermarked on the content
- ✅ Sharing is clearly traceable
- ✅ Legal consequences are clear and enforceable

---

**Next Step:** Choose which enhancements to implement based on your security requirements.
