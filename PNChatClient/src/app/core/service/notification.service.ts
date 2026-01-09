import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationPermission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    console.log('🔔 NotificationService initializing...');
    this.initializeNotifications();
    this.registerServiceWorker();
  }

  /**
   * Initialize notifications and request permission if needed
   */
  initializeNotifications(): void {
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support desktop notifications');
      return;
    }

    this.notificationPermission = Notification.permission;
    console.log('📋 Current notification permission:', this.notificationPermission);

    // Request permission if not already granted or denied
    if (Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission from user...');
      Notification.requestPermission().then((permission) => {
        this.notificationPermission = permission;
        console.log('✅ Permission result:', permission);
        if (permission === 'granted') {
          // Once permission is granted, setup push notifications
          this.setupPushNotifications();
        }
      }).catch((error) => {
        console.error('❌ Error requesting notification permission:', error);
      });
    } else if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      // Permission already granted, setup push notifications
      this.setupPushNotifications();
    } else if (Notification.permission === 'denied') {
      console.warn('⚠️ Notification permission denied by user');
    }
  }

  /**
   * Register the service worker
   */
  private registerServiceWorker(): void {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported by this browser');
      return;
    }

    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
        this.serviceWorkerRegistration = registration;
        
        // If notifications are already granted, setup push notifications
        if (Notification.permission === 'granted') {
          this.setupPushNotifications();
        }
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }

  /**
   * Setup push notifications with the service worker
   */
  private setupPushNotifications(): void {
    if (!this.serviceWorkerRegistration) {
      console.log('Service Worker not registered yet');
      return;
    }

    // Check if the browser supports the Push API
    if (!('pushManager' in this.serviceWorkerRegistration)) {
      console.log('Push API not supported by this browser');
      return;
    }

    // Subscribe to push notifications
    this.serviceWorkerRegistration.pushManager.getSubscription()
      .then((subscription) => {
        if (!subscription) {
          // Create a new subscription
          console.log('Creating new push subscription');
          this.subscribeToPush();
        } else {
          console.log('Already subscribed to push notifications');
        }
      })
      .catch((error) => {
        console.error('Error getting push subscription:', error);
      });
  }

  /**
   * Subscribe to push notifications
   */
  private subscribeToPush(): void {
    if (!this.serviceWorkerRegistration) {
      console.log('Service Worker not registered');
      return;
    }

    // Note: In a production environment, you would get this public key from your server
    // This is a placeholder VAPID public key
    const vapidPublicKey = this.urlBase64ToUint8Array(
      'BCElkKbLGJfVaW-z-sH0PkCdJYh8Qy1sFhj0-gy9OB3XClSZWh0RQU6EHPh-Z4FhPJkPEY3jvB2ZGSqhPVUTJqc'
    );

    this.serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    })
      .then((subscription) => {
        console.log('Push subscription successful:', subscription);
        // In a real app, you would send this subscription to your backend
      })
      .catch((error) => {
        console.error('Push subscription failed:', error);
      });
  }

  /**
   * Convert VAPID public key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Show a desktop notification
   */
  showNotification(title: string, options?: NotificationOptions): void {
    console.log('📢 showNotification called with title:', title);
    console.log('📢 Notification permission:', Notification.permission);
    
    if (!this.isNotificationEnabled()) {
      console.warn('⚠️ Notifications are not enabled. Permission:', this.notificationPermission);
      return;
    }

    try {
      console.log('✅ Creating Notification with options:', options);
      const notification = new Notification(title, {
        icon: '/pnchat.ico',
        badge: '/pnchat.ico',
        ...options
      });

      console.log('✅ Notification created successfully');

      // Auto close notification after 5 seconds if on web
      notification.onshow = () => {
        console.log('✅ Notification shown');
        setTimeout(() => {
          notification.close();
          console.log('✅ Notification auto-closed');
        }, 5000);
      };

      // Handle notification click
      notification.onclick = () => {
        console.log('✅ Notification clicked');
        window.focus();
        notification.close();
      };

      notification.onerror = () => {
        console.error('❌ Notification error occurred');
      };
    } catch (error) {
      console.error('❌ Error showing notification:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Show message notification
   */
  showMessageNotification(senderName: string, messagePreview: string, senderAvatar?: string): void {
    console.log('📨 showMessageNotification called from:', senderName);
    this.showNotification(`New message from ${senderName}`, {
      body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
      icon: senderAvatar || '/pnchat.ico',
      tag: 'message-notification',
      requireInteraction: false
    });
  }

  /**
   * Show group notification
   */
  showGroupNotification(groupName: string, senderName: string, messagePreview: string): void {
    console.log('👥 showGroupNotification called in group:', groupName, 'from:', senderName);
    this.showNotification(`${groupName} - ${senderName}`, {
      body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
      icon: '/pnchat.ico',
      tag: 'group-notification',
      requireInteraction: false
    });
  }

  /**
   * Show emergency notification (SOS)
   */
  showEmergencyNotification(senderName: string, emergencyType: 'medical' | 'incident'): void {
    console.log('🚨 showEmergencyNotification called from:', senderName, 'type:', emergencyType);
    const title = emergencyType === 'medical' ? '🚨 Medical Emergency!' : '⚠️ Incident Alert!';
    this.showNotification(`${title} from ${senderName}`, {
      body: `${senderName} has reported a ${emergencyType === 'medical' ? 'medical' : 'incident'} emergency!`,
      icon: '/pnchat.ico',
      tag: 'emergency-notification',
      requireInteraction: true,
      badge: '/pnchat.ico'
    });
  }

  /**
   * Check if notifications are enabled
   */
  isNotificationEnabled(): boolean {
    return 'Notification' in window && this.notificationPermission === 'granted';
  }

  /**
   * Request notification permission
   */
  requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.reject('Notifications not supported');
    }

    return Notification.requestPermission().then((permission) => {
      this.notificationPermission = permission;
      return permission;
    });
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.notificationPermission;
  }
}
