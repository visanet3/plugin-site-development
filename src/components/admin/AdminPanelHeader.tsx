import { useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface AdminPanelHeaderProps {
  onClose: () => void;
  onShowBalanceDialog: () => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  adminNotifications: any[];
  onMarkNotificationsRead: () => void;
}

const AdminPanelHeader = ({
  onClose,
  onShowBalanceDialog,
  showNotifications,
  setShowNotifications,
  adminNotifications,
  onMarkNotificationsRead
}: AdminPanelHeaderProps) => {
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, setShowNotifications]);

  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Icon name="Shield" size={24} className="text-primary sm:w-7 sm:h-7" />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Админ-панель</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          onClick={onShowBalanceDialog}
          className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
        >
          <Icon name="Plus" size={18} className="mr-2" />
          <span className="hidden sm:inline">Пополнить баланс</span>
          <span className="sm:hidden">Баланс</span>
        </Button>
        <div className="relative" ref={notificationsRef}>
          <Button 
            onClick={() => setShowNotifications(!showNotifications)} 
            variant="ghost"
            className="relative px-2 sm:px-3"
          >
            <Icon name="Bell" size={18} className="sm:w-5 sm:h-5" />
            {adminNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center">
                {adminNotifications.length}
              </span>
            )}
          </Button>
          {showNotifications && adminNotifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-[90vw] sm:w-80 bg-card border border-border rounded-lg shadow-lg p-3 sm:p-4 z-50 max-h-[80vh] sm:max-h-96 overflow-y-auto animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Уведомления</h3>
                <Button size="sm" variant="ghost" onClick={onMarkNotificationsRead}>
                  <Icon name="Check" size={16} />
                </Button>
              </div>
              <div className="space-y-2">
                {adminNotifications.map((notif) => (
                  <div key={notif.id} className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="font-semibold text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button onClick={onClose} variant="ghost" className="px-2 sm:px-3">
          <Icon name="X" size={18} className="sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
};

export default AdminPanelHeader;