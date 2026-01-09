import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    this.initializeNotifications();
  }

  /**
   * Initialize notifications and request permission if needed
   */
  initializeNotifications(): void {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return;
    }

    this.notificationPermission = Notification.permission;

    // Request permission if not already granted or denied
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        this.notificationPermission = permission;
      });
    }
  }

  /**
   * Show a desktop notification
   */
  showNotification(title: string, options?: NotificationOptions): void {
    if (!this.isNotificationEnabled()) {
      console.log('Notifications are not enabled');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/pnchat.ico',
        badge: '/pnchat.ico',
        ...options
      });

      // Auto close notification after 5 seconds if on web
      notification.onshow = () => {
        setTimeout(() => {
          notification.close();
        }, 5000);
      };

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show message notification
   */
  showMessageNotification(senderName: string, messagePreview: string, senderAvatar?: string): void {
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
