import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationDebugService {
  private debugLogs: Array<{timestamp: Date, message: string, data?: any}> = [];
  private maxLogs = 100;

  constructor() {
    this.initializeDebug();
  }

  /**
   * Initialize debugging for notifications
   */
  private initializeDebug(): void {
    // Only enable in development mode
    if (this.isProduction()) return;

    console.log('=== Notification Debug Service Initialized ===');
    
    // Monitor Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        this.log('Service Worker ready', { registration });
        
        // Listen for messages from Service Worker
        navigator.serviceWorker.onmessage = (event) => {
          this.log('Message from Service Worker', event.data);
        };

        // Listen for controller changes
        navigator.serviceWorker.oncontrollerchange = () => {
          this.log('Service Worker controller changed');
        };
      }).catch(error => {
        this.log('Service Worker error', { error });
      });
    }

    // Monitor Notification API
    if ('Notification' in window) {
      this.log('Notification API available', { permission: Notification.permission });
    }
  }

  /**
   * Log a debug message
   */
  log(message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date(),
      message,
      data
    };

    this.debugLogs.push(logEntry);

    // Keep only last N logs
    if (this.debugLogs.length > this.maxLogs) {
      this.debugLogs.shift();
    }

    // Log to console
    console.log(`[NotificationDebug ${logEntry.timestamp.toLocaleTimeString()}] ${message}`, data || '');
  }

  /**
   * Get all debug logs
   */
  getLogs(): Array<{timestamp: Date, message: string, data?: any}> {
    return this.debugLogs;
  }

  /**
   * Print logs to console
   */
  printLogs(): void {
    console.group('=== Notification Debug Logs ===');
    this.debugLogs.forEach(log => {
      console.log(`[${log.timestamp.toLocaleTimeString()}] ${log.message}`, log.data || '');
    });
    console.groupEnd();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.debugLogs, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.debugLogs = [];
    this.log('Debug logs cleared');
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    try {
      return (window as any).ngDevMode === false;
    } catch {
      return false;
    }
  }

  /**
   * Get notification status summary
   */
  getStatusSummary(): any {
    return {
      notificationSupported: 'Notification' in window,
      notificationPermission: (window as any).Notification?.permission || 'N/A',
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerRegistrations: (navigator.serviceWorker as any)?.controller ? 'Active' : 'Not Active',
      pushAPISupported: 'PushManager' in ServiceWorkerRegistration.prototype,
      debugLogsCount: this.debugLogs.length
    };
  }

  /**
   * Print status summary
   */
  printStatusSummary(): void {
    console.group('=== Notification System Status ===');
    const status = this.getStatusSummary();
    Object.entries(status).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
  }
}
