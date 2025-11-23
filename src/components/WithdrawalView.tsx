import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const WITHDRAWAL_URL = 'https://functions.poehali.dev/09f16983-ec42-41fe-a7bd-695752ee11c5';

interface WithdrawalViewProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount: number;
  usdt_wallet: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export const WithdrawalView = ({ user, onShowAuthDialog, onRefreshUserBalance }: WithdrawalViewProps) => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState('');

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
      checkNotifications();
      
      const interval = setInterval(() => {
        checkNotifications();
        fetchWithdrawals();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchWithdrawals = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${WITHDRAWAL_URL}?action=my_withdrawals`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      if (data.withdrawals) {
        setWithdrawals(data.withdrawals);
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNotifications = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${WITHDRAWAL_URL}?action=get_notifications`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      
      if (data.notifications && data.notifications.length > 0) {
        data.notifications.forEach((notif: any) => {
          toast({
            title: 'Уведомление о выводе',
            description: notif.message,
            duration: 10000
          });
        });

        await fetch(WITHDRAWAL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString()
          },
          body: JSON.stringify({
            action: 'mark_notifications_read'
          })
        });

        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
        fetchWithdrawals();
      }
    } catch (error) {
      console.error('Ошибка проверки уведомлений:', error);
    }
  };

  const createWithdrawal = async () => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    const amountNum = parseFloat(amount);

    const usdtCommission = 5.0;
    const totalRequired = amountNum + usdtCommission;

    if (!amount || isNaN(amountNum) || amountNum < 100) {
      toast({
        title: 'Ошибка',
        description: 'Минимальная сумма вывода - 100 USDT',
        variant: 'destructive'
      });
      return;
    }

    if (!wallet.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите USDT кошелек',
        variant: 'destructive'
      });
      return;
    }

    if (totalRequired > user.balance) {
      toast({
        title: 'Недостаточно средств',
        description: `Требуется ${totalRequired} USDT (вкл. комиссию ${usdtCommission} USDT). На балансе: ${user.balance} USDT`,
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(WITHDRAWAL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create_withdrawal',
          amount: amountNum,
          usdt_wallet: wallet.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateDialog(false);
        setAmount('');
        setWallet('');
        fetchWithdrawals();
        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
        toast({
          title: 'Заявка создана',
          description: 'Ваша заявка на вывод находится в обработке. Пожалуйста, ожидайте.',
          duration: 7000
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать заявку',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка соединения с сервером',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { text: 'Ожидает', variant: 'secondary' },
      processing: { text: 'В обработке', variant: 'default' },
      completed: { text: 'Завершено', variant: 'outline' },
      rejected: { text: 'Отклонено', variant: 'destructive' }
    };
    const badge = badges[status] || badges.pending;
    return <Badge variant={badge.variant}>{badge.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="p-12 text-center">
          <Icon name="Lock" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Требуется авторизация</h2>
          <p className="text-muted-foreground mb-6">Войдите для доступа к выводу средств</p>
          <Button onClick={onShowAuthDialog}>
            <Icon name="LogIn" size={18} className="mr-2" />
            Войти
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Вывод средств</h1>
          <p className="text-muted-foreground">
            Вывод USDT на личный кошелек
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-lg shadow-orange-500/30"
        >
          <Icon name="ArrowDownToLine" size={18} className="mr-2" />
          Создать заявку
        </Button>
      </div>

      <Card className="p-6 bg-gradient-to-br from-green-600/10 to-green-700/5 border-green-600/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon name="Wallet" size={24} className="text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Как работает вывод средств?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Минимальная сумма:</strong> 100 USDT</p>
              <p>• <strong>Комиссия вывода:</strong> 5 USDT (списывается с баланса)</p>
              <p>• <strong>Время обработки:</strong> заявки обрабатываются системой автоматически</p>
              <p>• <strong>Уведомления:</strong> вы получите уведомление о статусе заявки</p>
              <p>• <strong>Важно:</strong> убедитесь, что указали правильный USDT кошелек</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Icon name="Wallet" size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Доступно</p>
              <p className="text-2xl font-bold">{user.balance} USDT</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">В обработке</p>
              <p className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'processing' || w.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
              <Icon name="CheckCircle" size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Завершено</p>
              <p className="text-2xl font-bold">
                {withdrawals.filter(w => w.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icon name="History" size={20} className="text-indigo-400" />
          История заявок
        </h3>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Загрузка...</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Нет заявок на вывод</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="p-4 bg-card/50 border-border/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon name="ArrowDownToLine" size={20} className="text-muted-foreground" />
                      <span className="font-semibold text-lg">{withdrawal.amount} USDT</span>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Кошелек:</strong> {withdrawal.usdt_wallet}</p>
                      <p><strong>Создана:</strong> {formatDate(withdrawal.created_at)}</p>
                      {withdrawal.completed_at && (
                        <p><strong>Обработана:</strong> {formatDate(withdrawal.completed_at)}</p>
                      )}
                      {withdrawal.admin_comment && (
                        <p className="text-orange-400"><strong>Комментарий:</strong> {withdrawal.admin_comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать заявку на вывод</DialogTitle>
            <DialogDescription>
              Минимальная сумма вывода - 100 USDT. Убедитесь в правильности адреса кошелька.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Сумма (USDT)</Label>
              <Input
                id="amount"
                type="number"
                min="100"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Доступно: {user.balance} USDT
              </p>
              {amount && parseFloat(amount) > 0 && (
                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-xs">
                  <p className="text-muted-foreground">Комиссия вывода: <span className="font-semibold text-orange-400">5 USDT</span></p>
                  <p className="text-muted-foreground mt-1">Итого спишется: <span className="font-semibold text-foreground">{(parseFloat(amount) + 5).toFixed(2)} USDT</span></p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="wallet">USDT кошелек (TRC20)</Label>
              <Input
                id="wallet"
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="Введите адрес вашего USDT кошелька"
              />
              <p className="text-xs text-orange-400 mt-1">
                ⚠️ Внимательно проверьте адрес! Возврат невозможен.
              </p>
            </div>

            <Button
              onClick={createWithdrawal}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500"
            >
              {isSubmitting ? 'Обработка...' : 'Создать заявку'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};