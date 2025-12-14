import { notificationsCache } from './notificationsCache';

type NotificationEventListener = () => void;

class NotificationEventBus {
  private listeners: Set<NotificationEventListener> = new Set();
  private lastTrigger: number = 0;
  private minInterval: number = 30000;

  subscribe(listener: NotificationEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  trigger(userId?: number, userRole?: string) {
    const now = Date.now();
    if (now - this.lastTrigger < this.minInterval) {
      return;
    }
    
    this.lastTrigger = now;
    this.listeners.forEach(listener => listener());
    
    if (userId && userRole) {
      notificationsCache.triggerUpdate(userId, userRole);
    }
  }

  triggerImmediate(userId?: number, userRole?: string) {
    this.lastTrigger = Date.now();
    this.listeners.forEach(listener => listener());
    
    if (userId && userRole) {
      notificationsCache.triggerUpdate(userId, userRole);
    }
  }
}

export const notificationEvents = new NotificationEventBus();

export const triggerNotificationUpdate = (userId?: number, userRole?: string) => {
  notificationEvents.trigger(userId, userRole);
};

export const triggerNotificationUpdateImmediate = (userId?: number, userRole?: string) => {
  notificationEvents.triggerImmediate(userId, userRole);
};