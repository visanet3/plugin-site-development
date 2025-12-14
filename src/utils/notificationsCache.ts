const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';
const CACHE_DURATION = 30000;
const MIN_UPDATE_INTERVAL = 30000;

interface NotificationCounts {
  notifications: number;
  messages: number;
  adminNotifications?: number;
}

interface NotificationSubscriber {
  id: string;
  callback: (counts: NotificationCounts) => void;
}

class NotificationsCache {
  private cache: NotificationCounts | null = null;
  private cacheTimestamp: number = 0;
  private lastUpdateTimestamp: number = 0;
  private subscribers: NotificationSubscriber[] = [];
  private isUpdating: boolean = false;
  private updatePromise: Promise<NotificationCounts | null> | null = null;

  subscribe(callback: (counts: NotificationCounts) => void): () => void {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.push({ id, callback });
    
    if (this.cache) {
      callback(this.cache);
    }
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub.id !== id);
    };
  }

  private notifySubscribers(counts: NotificationCounts) {
    this.subscribers.forEach(sub => sub.callback(counts));
  }

  async getCounts(userId: number, userRole: string, force: boolean = false): Promise<NotificationCounts | null> {
    const now = Date.now();
    
    if (!force && this.cache && (now - this.cacheTimestamp) < CACHE_DURATION) {
      return this.cache;
    }
    
    if (!force && (now - this.lastUpdateTimestamp) < MIN_UPDATE_INTERVAL) {
      return this.cache;
    }
    
    if (this.isUpdating && this.updatePromise) {
      return this.updatePromise;
    }
    
    this.isUpdating = true;
    this.updatePromise = this.fetchCounts(userId, userRole);
    
    try {
      const counts = await this.updatePromise;
      if (counts) {
        this.cache = counts;
        this.cacheTimestamp = now;
        this.lastUpdateTimestamp = now;
        this.notifySubscribers(counts);
      }
      return counts;
    } finally {
      this.isUpdating = false;
      this.updatePromise = null;
    }
  }

  private async fetchCounts(userId: number, userRole: string): Promise<NotificationCounts | null> {
    try {
      const requests = [
        fetch(`${NOTIFICATIONS_URL}?action=notifications`, {
          headers: { 'X-User-Id': userId.toString() }
        }),
        fetch(`${NOTIFICATIONS_URL}?action=messages`, {
          headers: { 'X-User-Id': userId.toString() }
        })
      ];

      if (userRole === 'admin') {
        const ADMIN_URL = 'https://functions.poehali.dev/d4678b1c-2acd-40bb-b8c5-cefe8d14fad4';
        requests.push(
          fetch(`${ADMIN_URL}?action=admin_notifications_unread_count`, {
            headers: { 'X-User-Id': userId.toString() }
          })
        );
      }

      const responses = await Promise.all(requests);
      const [notifRes, msgRes, adminNotifRes] = responses;

      if (notifRes.ok && msgRes.ok) {
        const notifData = await notifRes.json();
        const msgData = await msgRes.json();
        
        const counts: NotificationCounts = {
          notifications: notifData.unread_count || 0,
          messages: msgData.unread_count || 0
        };

        if (adminNotifRes && adminNotifRes.ok) {
          const adminNotifData = await adminNotifRes.json();
          counts.adminNotifications = adminNotifData.unread_count || 0;
        }

        return counts;
      }
      return null;
    } catch (error) {
      console.error('[NotificationsCache] Fetch error:', error);
      return null;
    }
  }

  triggerUpdate(userId: number, userRole: string) {
    this.getCounts(userId, userRole, true);
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
    this.lastUpdateTimestamp = 0;
  }
}

export const notificationsCache = new NotificationsCache();

export function triggerNotificationUpdate(userId: number, userRole: string) {
  notificationsCache.triggerUpdate(userId, userRole);
}
