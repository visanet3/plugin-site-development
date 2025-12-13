type UserSyncListener = (user: any) => void;

class UserSyncManager {
  private listeners: Set<UserSyncListener> = new Set();
  private lastSync: number = 0;
  private minInterval: number = 60000; // 60 секунд минимум между синхронизациями
  private syncInProgress: boolean = false;
  private cachedUser: any = null;
  private AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

  subscribe(listener: UserSyncListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(user: any) {
    this.cachedUser = user;
    this.listeners.forEach(listener => listener(user));
  }

  getCachedUser() {
    return this.cachedUser;
  }

  async syncUser(forceSync: boolean = false): Promise<any> {
    const now = Date.now();
    
    if (!forceSync && (this.syncInProgress || now - this.lastSync < this.minInterval)) {
      return this.cachedUser;
    }

    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;

    this.syncInProgress = true;
    this.lastSync = now;

    try {
      const userToSync = JSON.parse(savedUser);
      
      const response = await fetch(this.AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userToSync.id.toString()
        },
        body: JSON.stringify({ action: 'get_user' })
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        if (data.user.is_blocked) {
          localStorage.removeItem('user');
          this.cachedUser = null;
          this.notifyListeners(null);
          return null;
        }
        
        localStorage.setItem('user', JSON.stringify(data.user));
        this.notifyListeners(data.user);
        return data.user;
      }
      
      return this.cachedUser;
    } catch (error) {
      console.error('Ошибка синхронизации пользователя:', error);
      return this.cachedUser;
    } finally {
      this.syncInProgress = false;
    }
  }

  triggerSync() {
    this.syncUser(false);
  }

  forceSyncImmediate() {
    this.lastSync = 0;
    return this.syncUser(true);
  }
}

export const userSyncManager = new UserSyncManager();

export const triggerUserSync = () => {
  userSyncManager.triggerSync();
};

export const forceUserSync = () => {
  return userSyncManager.forceSyncImmediate();
};
