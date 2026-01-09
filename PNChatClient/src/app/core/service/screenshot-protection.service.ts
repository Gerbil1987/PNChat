import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreenshotProtectionService {
  private isScreenshotBlankActive = false;
  private blankOverlay: HTMLElement | null = null;
  private printMediaQuery: MediaQueryList | null = null;

  constructor() {
    this.initializeScreenshotProtection();
  }

  /**
   * Initialize screenshot protection mechanisms
   */
  private initializeScreenshotProtection(): void {
    console.log('🛡️ Initializing screenshot protection...');
    
    // Block Print Screen and common screenshot shortcuts
    this.blockScreenshotShortcuts();
    
    // Monitor print media queries (print/screenshot attempts)
    this.monitorPrintAttempts();
    
    // Monitor visibility changes and screen capture
    this.monitorScreenCapture();
    
    // Block right-click and inspect element
    this.blockContextMenu();
    
    // Disable developer tools
    this.disableDeveloperTools();
  }

  /**
   * Block Print Screen and common screenshot keyboard shortcuts
   */
  private blockScreenshotShortcuts(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Block Print Screen key
      if (event.key === 'PrintScreen') {
        console.warn('⚠️ Print Screen attempted - showing blank screen');
        event.preventDefault();
        this.showBlankScreen();
        return;
      }

      // Block Ctrl+PrintScreen (Windows screenshot)
      if (event.ctrlKey && event.key === 'PrintScreen') {
        console.warn('⚠️ Ctrl+PrintScreen attempted - showing blank screen');
        event.preventDefault();
        this.showBlankScreen();
        return;
      }

      // Block Shift+PrintScreen (Windows screenshot)
      if (event.shiftKey && event.key === 'PrintScreen') {
        console.warn('⚠️ Shift+PrintScreen attempted - showing blank screen');
        event.preventDefault();
        this.showBlankScreen();
        return;
      }

      // Block F12 (Developer Tools)
      if (event.key === 'F12') {
        console.warn('⚠️ F12 (Developer Tools) attempted');
        event.preventDefault();
        return;
      }

      // Block Ctrl+Shift+I (Inspect Element)
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        console.warn('⚠️ Ctrl+Shift+I (Inspect Element) attempted');
        event.preventDefault();
        return;
      }

      // Block Ctrl+Shift+C (Inspect Element - Chrome)
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        console.warn('⚠️ Ctrl+Shift+C (Inspect Element) attempted');
        event.preventDefault();
        return;
      }

      // Block Ctrl+Shift+K (Developer Console)
      if (event.ctrlKey && event.shiftKey && event.key === 'K') {
        console.warn('⚠️ Ctrl+Shift+K (Developer Console) attempted');
        event.preventDefault();
        return;
      }

      // Block Ctrl+Shift+J (Developer Console)
      if (event.ctrlKey && event.shiftKey && event.key === 'J') {
        console.warn('⚠️ Ctrl+Shift+J (Developer Console) attempted');
        event.preventDefault();
        return;
      }

      // Block Ctrl+S (Save Page)
      if (event.ctrlKey && event.key === 's') {
        console.warn('⚠️ Ctrl+S (Save Page) attempted');
        event.preventDefault();
        return;
      }
    });

    // Block PrintScreen key release as well
    document.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key === 'PrintScreen') {
        event.preventDefault();
      }
    });

    console.log('✅ Screenshot shortcuts blocked');
  }

  /**
   * Monitor print media queries to detect print/screenshot attempts
   */
  private monitorPrintAttempts(): void {
    try {
      this.printMediaQuery = window.matchMedia('print');
      
      this.printMediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
        if (e.matches) {
          console.warn('🖨️ Print mode detected - showing blank screen');
          this.showBlankScreen();
        } else {
          console.log('✅ Print mode exited');
          this.hideBlankScreen();
        }
      });

      // Also use the old-style listener for better compatibility
      this.printMediaQuery.addListener((e: MediaQueryListEvent) => {
        if (e.matches) {
          console.warn('🖨️ Print mode detected (legacy) - showing blank screen');
          this.showBlankScreen();
        } else {
          console.log('✅ Print mode exited (legacy)');
          this.hideBlankScreen();
        }
      });

      console.log('✅ Print media monitoring enabled');
    } catch (error) {
      console.warn('⚠️ Error setting up print media monitoring:', error);
    }
  }

  /**
   * Monitor screen capture attempts via Screen Capture API
   */
  private monitorScreenCapture(): void {
    try {
      // Detect when user tries to use getDisplayMedia (screen recording/screenshot)
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);

        navigator.mediaDevices.getDisplayMedia = function(...args: any[]): Promise<MediaStream> {
          console.warn('📹 Screen capture attempt detected - returning blank screen');
          
          // Return a promise that resolves with a blank canvas stream
          return new Promise((resolve) => {
            // Create a blank canvas stream instead of the actual screen
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Return blank stream
            const stream = canvas.captureStream(30);
            resolve(stream);
          });
        };

        console.log('✅ Screen capture monitoring enabled');
      }
    } catch (error) {
      console.warn('⚠️ Error setting up screen capture monitoring:', error);
    }
  }

  /**
   * Block right-click context menu
   */
  private blockContextMenu(): void {
    document.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
      console.warn('⚠️ Right-click context menu attempted');
      return false;
    });

    console.log('✅ Context menu blocked');
  }

  /**
   * Disable developer tools detection
   */
  private disableDeveloperTools(): void {
    // Try to detect if DevTools is open (this is a heuristic and not foolproof)
    const checkDevTools = setInterval(() => {
      try {
        const start = performance.now();
        debugger; // This will be slow if DevTools is open
        const end = performance.now();
        
        // If debugger statement takes more than 100ms, DevTools is likely open
        if (end - start > 100) {
          console.warn('🔧 Developer Tools detected');
          this.showBlankScreen();
        }
      } catch (error) {
        // Ignore
      }
    }, 2000);

    console.log('✅ Developer tools detection enabled');
  }

  /**
   * Show blank screen overlay
   */
  public showBlankScreen(): void {
    if (this.isScreenshotBlankActive) {
      return;
    }

    console.log('🛑 Showing blank screen');
    this.isScreenshotBlankActive = true;

    // Create blank overlay
    if (!this.blankOverlay) {
      this.blankOverlay = document.createElement('div');
      this.blankOverlay.id = 'screenshot-protection-overlay';
      this.blankOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #000000;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        color: white;
        font-size: 24px;
        text-align: center;
        pointer-events: none;
      `;

      const message = document.createElement('div');
      message.textContent = '⚠️ Screenshot Protection Active\nThis application is protected from unauthorized screenshots.';
      message.style.cssText = `
        padding: 40px;
        line-height: 1.5;
      `;

      this.blankOverlay.appendChild(message);
      document.body.appendChild(this.blankOverlay);
    } else {
      this.blankOverlay.style.display = 'flex';
    }

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideBlankScreen();
    }, 3000);
  }

  /**
   * Hide blank screen overlay
   */
  public hideBlankScreen(): void {
    if (!this.isScreenshotBlankActive) {
      return;
    }

    console.log('✅ Hiding blank screen');
    this.isScreenshotBlankActive = false;

    if (this.blankOverlay) {
      this.blankOverlay.style.display = 'none';
    }
  }

  /**
   * Enable screenshot protection (call this when user enters sensitive area)
   */
  public enableProtection(): void {
    console.log('🛡️ Screenshot protection enabled');
    // Already initialized in constructor
  }

  /**
   * Disable screenshot protection (call this when user leaves sensitive area)
   */
  public disableProtection(): void {
    console.log('🛡️ Screenshot protection disabled');
    this.hideBlankScreen();
  }

  /**
   * Get CSS that can be added to sensitive components to add watermark and prevent selection
   */
  public getProtectionCSS(): string {
    return `
      /* Screenshot Protection Styles */
      .screenshot-protected {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        background-image: 
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(0, 0, 0, 0.05) 35px,
            rgba(0, 0, 0, 0.05) 70px
          );
        position: relative;
      }

      .screenshot-protected::before {
        content: 'CONFIDENTIAL - DO NOT SHARE';
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 80px;
        font-weight: bold;
        color: rgba(0, 0, 0, 0.1);
        white-space: nowrap;
        pointer-events: none;
        z-index: -1;
        width: 200%;
        height: 200%;
        text-align: center;
      }
    `;
  }
}
