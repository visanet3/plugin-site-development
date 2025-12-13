import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { notificationEvents } from '@/utils/notificationEvents';

const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
}

const NotificationsPanel = ({ open, onOpenChange, userId }: NotificationsPanelProps) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  useEffect(() => {
    const unsubscribe = notificationEvents.subscribe(() => {
      if (open) {
        fetchNotifications();
      }
    });
    
    return unsubscribe;
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
      toast({
        title: '✅ Готово',
        description: 'Все уведомления отмечены как прочитанные'
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingIds(prev => new Set(prev).add(notificationId));
    
    try {
      const response = await fetch(NOTIFICATIONS_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ 
          action: 'delete_notification', 
          notification_id: notificationId 
        })
      });
      
      if (response.ok) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
          setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(notificationId);
            return newSet;
          });
        }, 300);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const clearAll = async () => {
    try {
      const response = await fetch(NOTIFICATIONS_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ action: 'clear_all_notifications' })
      });
      
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast({
          title: '🗑️ Очищено',
          description: 'Все уведомления удалены'
        });
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
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

  const groupedNotifications = notifications.reduce((acc, notif) => {
    const today = new Date();
    const notifDate = new Date(notif.created_at);
    const diffDays = Math.floor((today.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let group = 'Старые';
    if (diffDays === 0) group = 'Сегодня';
    else if (diffDays === 1) group = 'Вчера';
    else if (diffDays < 7) group = 'На этой неделе';
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(notif);
    return acc;
  }, {} as Record<string, Notification[]>);

  const groupOrder = ['Сегодня', 'Вчера', 'На этой неделе', 'Старые'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[85vh] h-[100vh] sm:h-auto flex flex-col p-0 gap-0 sm:rounded-lg">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                <Icon name="Bell" size={18} className="sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold truncate">Уведомления</h2>
                {unreadCount > 0 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {unreadCount} непрочитанных
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {notifications.length > 0 && (
                <Button
                  onClick={clearAll}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 sm:h-9 sm:px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Icon name="Trash2" size={14} className="sm:mr-1.5" />
                  <span className="hidden sm:inline">Очистить</span>
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  onClick={markAllRead}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:h-9 sm:px-3"
                >
                  <Icon name="CheckCheck" size={14} className="sm:mr-1.5" />
                  <span className="hidden sm:inline">Прочитать все</span>
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Icon name="Loader2" size={28} className="sm:w-8 sm:h-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-xs sm:text-sm text-muted-foreground">Загрузка уведомлений...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Icon name="Bell" size={28} className="sm:w-8 sm:h-8 text-muted-foreground/50" />
              </div>
              <p className="text-base sm:text-lg font-semibold mb-1">Нет уведомлений</p>
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">Вы получите уведомления о важных событиях</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {groupOrder.map(group => {
                const groupNotifications = groupedNotifications[group];
                if (!groupNotifications || groupNotifications.length === 0) return null;
                
                return (
                  <div key={group}>
                    <h3 className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 px-0.5 sm:px-1">
                      {group}
                    </h3>
                    <div className="space-y-2">
                      {groupNotifications.map((notification) => {
                        const isDeleting = deletingIds.has(notification.id);
                        return (
                          <Card
                            key={notification.id}
                            className={`group relative overflow-hidden transition-all duration-300 active:scale-[0.98] sm:hover:shadow-md ${
                              isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                            } ${
                              notification.is_read
                                ? 'bg-card border-border/50 hover:border-border'
                                : notification.type === 'payment'
                                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30 hover:border-green-500/50'
                                : notification.type === 'message'
                                ? 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30 hover:border-blue-500/50'
                                : 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50'
                            }`}
                            onClick={() => !notification.is_read && markNotificationRead(notification.id)}
                          >
                            <div className="p-3 sm:p-4">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                  notification.type === 'payment'
                                    ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20'
                                    : notification.type === 'message'
                                    ? 'bg-gradient-to-br from-blue-500/30 to-blue-500/20'
                                    : 'bg-gradient-to-br from-primary/30 to-primary/20'
                                }`}>
                                  {notification.type === 'payment' ? (
                                    <Icon name="Wallet" size={16} className="sm:w-[18px] sm:h-[18px] text-green-400" />
                                  ) : notification.type === 'message' ? (
                                    <Icon name="Mail" size={16} className="sm:w-[18px] sm:h-[18px] text-blue-400" />
                                  ) : (
                                    <Icon name="Bell" size={16} className="sm:w-[18px] sm:h-[18px] text-primary" />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="font-semibold text-xs sm:text-sm leading-tight">
                                      {notification.title}
                                    </h4>
                                    {!notification.is_read && (
                                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary shrink-0 mt-1 sm:mt-1.5 animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-1.5 sm:mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground/70 flex items-center gap-1">
                                      <Icon name="Clock" size={10} className="sm:w-3 sm:h-3" />
                                      {formatDate(notification.created_at)}
                                    </p>
                                  </div>
                                </div>

                                <Button
                                  onClick={(e) => deleteNotification(notification.id, e)}
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto h-7 w-7 sm:h-8 sm:w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400"
                                  disabled={isDeleting}
                                >
                                  <Icon name={isDeleting ? "Loader2" : "X"} size={14} className={`sm:w-4 sm:h-4 ${isDeleting ? "animate-spin" : ""}`} />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsPanel;