interface VerificationStatus {
  is_verified: boolean;
  request: {
    id: number;
    status: string;
    admin_comment: string | null;
    created_at: string;
    reviewed_at: string | null;
  } | null;
}

type VerificationListener = (status: VerificationStatus | null) => void;

class VerificationCacheManager {
  private cache: Map<number, VerificationStatus> = new Map();
  private listeners: Map<number, Set<VerificationListener>> = new Map();
  private lastFetch: Map<number, number> = new Map();
  private minInterval: number = 30000; // 30 секунд
  private VERIFICATION_URL = 'https://functions.poehali.dev/e0d94580-497a-452f-9044-0ef1b2ff42c8';

  subscribe(userId: number, listener: VerificationListener) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(listener);
    
    return () => {
      const userListeners = this.listeners.get(userId);
      if (userListeners) {
        userListeners.delete(listener);
        if (userListeners.size === 0) {
          this.listeners.delete(userId);
        }
      }
    };
  }

  private notifyListeners(userId: number, status: VerificationStatus) {
    const userListeners = this.listeners.get(userId);
    if (userListeners) {
      userListeners.forEach(listener => listener(status));
    }
  }

  getCached(userId: number): VerificationStatus | null {
    return this.cache.get(userId) || null;
  }

  async fetchStatus(userId: number, forceRefresh: boolean = false): Promise<VerificationStatus | null> {
    const now = Date.now();
    const lastFetch = this.lastFetch.get(userId) || 0;

    if (!forceRefresh && this.cache.has(userId) && now - lastFetch < this.minInterval) {
      return this.cache.get(userId)!;
    }

    try {
      this.lastFetch.set(userId, now);
      
      const response = await fetch(`${this.VERIFICATION_URL}?action=status`, {
        headers: {
          'X-User-Id': userId.toString()
        }
      });
      
      const data = await response.json();
      this.cache.set(userId, data);
      this.notifyListeners(userId, data);
      
      return data;
    } catch (error) {
      console.error('Ошибка загрузки статуса верификации:', error);
      return this.cache.get(userId) || null;
    }
  }

  invalidate(userId: number) {
    this.lastFetch.delete(userId);
    return this.fetchStatus(userId, true);
  }

  clear(userId: number) {
    this.cache.delete(userId);
    this.lastFetch.delete(userId);
  }
}

export const verificationCache = new VerificationCacheManager();

export const triggerVerificationCheck = (userId: number) => {
  return verificationCache.invalidate(userId);
};
