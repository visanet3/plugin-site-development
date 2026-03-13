import { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelHeaderProps {
  onClose: () => void;
  onShowBalanceDialog: (action: 'add' | 'subtract') => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  adminNotifications: { id: number; title: string; message: string; created_at: string }[];
  onMarkNotificationsRead: () => void;
  userId?: string;
  onUsersDeleted?: () => void;
}

const AdminPanelHeader = ({
  onClose,
  onShowBalanceDialog,
  showNotifications,
  setShowNotifications,
  adminNotifications,
  onMarkNotificationsRead,
  userId,
  onUsersDeleted,
}: AdminPanelHeaderProps) => {
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, setShowNotifications]);

  const handleDeleteAllUsers = async () => {
    if (confirmInput !== 'УДАЛИТЬ') return;
    setIsDeleting(true);
    try {
      const { getFuncUrl } = await import('@/utils/funcUrl');
      const url = getFuncUrl('admin');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
        },
        body: JSON.stringify({ action: 'delete_all_users' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка');
      toast({ title: '✅ Готово', description: 'Все пользователи и их данные удалены' });
      setShowConfirm(false);
      setConfirmInput('');
      if (onUsersDeleted) onUsersDeleted();
    } catch (e) {
      toast({ title: '❌ Ошибка', description: e instanceof Error ? e.message : 'Не удалось удалить', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon name="Shield" size={24} className="text-primary sm:w-7 sm:h-7" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Админ-панель</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={() => onShowBalanceDialog('add')}
            className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
          >
            <Icon name="Plus" size={18} className="mr-2" />
            <span className="hidden sm:inline">Пополнить</span>
            <span className="sm:hidden">+</span>
          </Button>
          <Button
            onClick={() => onShowBalanceDialog('subtract')}
            className="bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800"
          >
            <Icon name="Minus" size={18} className="mr-2" />
            <span className="hidden sm:inline">Списание</span>
            <span className="sm:hidden">−</span>
          </Button>
          <Button
            onClick={() => { setShowConfirm(true); setConfirmInput(''); }}
            className="bg-gradient-to-r from-rose-900 to-red-950 hover:from-rose-800 hover:to-red-900 border border-rose-700/40"
            title="Удалить всех пользователей"
          >
            <Icon name="Trash2" size={18} className="mr-2" />
            <span className="hidden sm:inline">Удалить всех</span>
            <span className="sm:hidden text-xs">Удалить</span>
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

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-card border border-rose-700/40 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-rose-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-rose-400">Удалить всех пользователей</h2>
                <p className="text-xs text-muted-foreground">Это действие необратимо</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Будут удалены все пользователи и их данные: балансы, сообщения, темы форума, заказы, транзакции, тикеты и прочее. Останется только аккаунт CMD.
            </p>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Введите <span className="font-mono font-bold text-rose-400">УДАЛИТЬ</span> для подтверждения:</p>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                placeholder="УДАЛИТЬ"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono focus:border-rose-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowConfirm(false); setConfirmInput(''); }}
                disabled={isDeleting}
              >
                Отмена
              </Button>
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold"
                onClick={handleDeleteAllUsers}
                disabled={confirmInput !== 'УДАЛИТЬ' || isDeleting}
              >
                {isDeleting ? (
                  <><Icon name="Loader2" size={15} className="mr-2 animate-spin" />Удаляю...</>
                ) : (
                  <><Icon name="Trash2" size={15} className="mr-2" />Удалить всех</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPanelHeader;