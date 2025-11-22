import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Notification } from '@/types';

const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
}

const NotificationsPanel = ({ open, onOpenChange, userId }: NotificationsPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NOTIFICATIONS_URL}?action=notifications`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (notificationId: number) => {
    try {
      await fetch(NOTIFICATIONS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ action: 'mark_notification_read', notification_id: notificationId })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(NOTIFICATIONS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          action: 'mark_all_read',
          type: 'notifications'
        })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Bell" size={20} />
              Уведомления
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={markAllRead}
                variant="outline"
                size="sm"
              >
                Отметить все как прочитанные
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Bell" size={48} className="mx-auto mb-2 opacity-50" />
              <p>Нет уведомлений</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  notification.is_read
                    ? 'bg-background border-border'
                    : notification.type === 'payment'
                    ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
                    : 'bg-primary/5 border-primary/30'
                }`}
                onClick={() => !notification.is_read && markNotificationRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {notification.type === 'payment' ? (
                        <Icon name="Wallet" size={16} className="text-green-400" />
                      ) : notification.type === 'message' ? (
                        <Icon name="Mail" size={16} className="text-blue-400" />
                      ) : (
                        <Icon name="Bell" size={16} className="text-primary" />
                      )}
                      <h4 className="font-semibold">{notification.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsPanel;