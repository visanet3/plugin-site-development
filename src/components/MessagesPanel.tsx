import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Message, Notification } from '@/types';

const NOTIFICATIONS_URL = 'https://functions.poehali.dev/6c968792-7d48-41a9-af0a-c92adb047acb';

interface MessagesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
}

const MessagesPanel = ({ open, onOpenChange, userId }: MessagesPanelProps) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({ to_user_id: '', subject: '', content: '' });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NOTIFICATIONS_URL}?action=notifications`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setNotificationsUnread(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${NOTIFICATIONS_URL}?action=messages`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setMessagesUnread(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (activeTab === 'notifications') {
        fetchNotifications();
      } else {
        fetchMessages();
      }
    }
  }, [open, activeTab]);

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

  const markMessageRead = async (messageId: number) => {
    try {
      await fetch(NOTIFICATIONS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ action: 'mark_message_read', message_id: messageId })
      });
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
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
          type: activeTab
        })
      });
      if (activeTab === 'notifications') {
        fetchNotifications();
      } else {
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.to_user_id || !newMessage.subject || !newMessage.content) {
      alert('Заполните все поля');
      return;
    }

    try {
      const response = await fetch(NOTIFICATIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          action: 'send_message',
          ...newMessage
        })
      });

      if (response.ok) {
        setShowNewMessage(false);
        setNewMessage({ to_user_id: '', subject: '', content: '' });
        fetchMessages();
      } else {
        alert('Ошибка отправки сообщения');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Ошибка отправки сообщения');
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Уведомления и сообщения</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'notifications' | 'messages')}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="notifications" className="relative">
                Уведомления
                {notificationsUnread > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {notificationsUnread}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="relative">
                Сообщения
                {messagesUnread > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {messagesUnread}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {activeTab === 'messages' && (
                <Button
                  onClick={() => setShowNewMessage(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Icon name="Plus" size={16} />
                  Новое сообщение
                </Button>
              )}
              <Button
                onClick={markAllRead}
                variant="outline"
                size="sm"
              >
                Отметить все как прочитанные
              </Button>
            </div>
          </div>

          <TabsContent value="notifications" className="space-y-2">
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
                      : 'bg-primary/5 border-primary/30'
                  }`}
                  onClick={() => !notification.is_read && markNotificationRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="Bell" size={16} className="text-primary" />
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
          </TabsContent>

          <TabsContent value="messages" className="space-y-2">
            {showNewMessage && (
              <div className="p-4 rounded-lg border bg-primary/5 border-primary/30 mb-4">
                <h4 className="font-semibold mb-3">Новое сообщение</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">ID получателя</label>
                    <Input
                      type="number"
                      placeholder="Введите ID пользователя"
                      value={newMessage.to_user_id}
                      onChange={(e) => setNewMessage({ ...newMessage, to_user_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Тема</label>
                    <Input
                      placeholder="Тема сообщения"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Сообщение</label>
                    <Textarea
                      placeholder="Текст сообщения"
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={sendMessage}>Отправить</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewMessage(false);
                        setNewMessage({ to_user_id: '', subject: '', content: '' });
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Mail" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Нет сообщений</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    message.is_read || message.from_user_id === userId
                      ? 'bg-background border-border'
                      : 'bg-primary/5 border-primary/30'
                  }`}
                  onClick={() => message.to_user_id === userId && !message.is_read && markMessageRead(message.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {message.from_user_id === userId
                          ? message.to_username[0].toUpperCase()
                          : message.from_username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {message.from_user_id === userId ? (
                              <>
                                <Icon name="ArrowRight" size={14} className="inline mr-1" />
                                {message.to_username}
                              </>
                            ) : (
                              message.from_username
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">{message.subject}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                      </div>
                    </div>
                    {message.to_user_id === userId && !message.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MessagesPanel;
