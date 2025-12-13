type NotificationEventListener = () => void;

class NotificationEventBus {
  private listeners: Set<NotificationEventListener> = new Set();
  private lastTrigger: number = 0;
  private minInterval: number = 30000; // 30 секунд минимум между обновлениями

  subscribe(listener: NotificationEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  trigger() {
    const now = Date.now();
    if (now - this.lastTrigger < this.minInterval) {
      return;
    }
    
    this.lastTrigger = now;
    this.listeners.forEach(listener => listener());
  }

  triggerImmediate() {
    this.lastTrigger = Date.now();
    this.listeners.forEach(listener => listener());
  }
}

export const notificationEvents = new NotificationEventBus();

export const triggerNotificationUpdate = () => {
  notificationEvents.trigger();
};

export const triggerNotificationUpdateImmediate = () => {
  notificationEvents.triggerImmediate();
};
