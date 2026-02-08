import { useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { AUTH_URL } from '@/lib/api-urls';

interface BtcWithdrawal {
  id: number;
  user_id: number;
  username?: string;
  amount: number;
  currency: string;
  crypto_symbol: string;
  address: string;
  status: string;
  created_at: string;
  processed_at?: string;
  admin_comment?: string;
}

interface AdminBtcWithdrawalsTabProps {
  withdrawals: BtcWithdrawal[];
  currentUser: { id: number };
  onRefresh: () => void;
}

const AdminBtcWithdrawalsTab = ({ withdrawals, currentUser, onRefresh }: AdminBtcWithdrawalsTabProps) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState<number | null>(null);
  const [adminComment, setAdminComment] = useState<{ [key: number]: string }>({});

  const getCryptoColor = (crypto: string) => {
    const colors: Record<string, string> = {
      'BTC': 'orange',
      'ETH': 'blue',
      'BNB': 'yellow',
      'SOL': 'purple',
      'XRP': 'cyan',
      'TRX': 'red'
    };
    return colors[crypto] || 'gray';
  };

  const handleProcessWithdrawal = async (withdrawalId: number, newStatus: 'completed' | 'rejected') => {
    setProcessing(withdrawalId);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'process_btc_withdrawal',
          withdrawal_id: withdrawalId,
          status: newStatus,
          admin_comment: adminComment[withdrawalId] || ''
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: newStatus === 'completed' ? '✅ Вывод подтвержден' : '❌ Вывод отклонен',
          description: newStatus === 'completed' 
            ? 'Криптовалюта успешно отправлена пользователю' 
            : 'Вывод отклонен, средства возвращены на баланс'
        });
        onRefresh();
        setAdminComment(prev => {
          const newComments = { ...prev };
          delete newComments[withdrawalId];
          return newComments;
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обработать заявку',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setProcessing(null);
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter(w => w.status !== 'pending');
  
  // Подсчёт по валютам
  const cryptoCounts = pendingWithdrawals.reduce((acc, w) => {
    const crypto = w.crypto_symbol || w.currency;
    acc[crypto] = (acc[crypto] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const cryptoSummary = Object.entries(cryptoCounts)
    .map(([crypto, count]) => `${crypto}: ${count}`)
    .join(' • ');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
          <Icon name="Coins" size={24} className="text-purple-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Заявки на вывод криптовалют</h2>
          <p className="text-sm text-muted-foreground">
            {pendingWithdrawals.length} в ожидании {cryptoSummary ? `(${cryptoSummary})` : ''} • {processedWithdrawals.length} обработано
          </p>
        </div>
      </div>

      {pendingWithdrawals.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Icon name="CheckCircle" size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Нет активных заявок</h3>
          <p className="text-sm text-muted-foreground">Все заявки на вывод криптовалют обработаны</p>
        </Card>
      )}

      {pendingWithdrawals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ожидают обработки</h3>
          {pendingWithdrawals.map((withdrawal) => {
            const crypto = withdrawal.crypto_symbol || withdrawal.currency;
            const color = getCryptoColor(crypto);
            
            return (
            <Card key={withdrawal.id} className={`p-6 border-${color}-500/30`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon name="User" size={16} className="text-muted-foreground" />
                      <span className="font-semibold">{withdrawal.username || `User #${withdrawal.user_id}`}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded bg-${color}-500/20 text-${color}-400`}>
                        {crypto}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Calendar" size={14} />
                      <span>{new Date(withdrawal.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 bg-${color}-500/20 text-${color}-400 rounded-full text-sm font-medium`}>
                    <Icon name="Clock" size={14} />
                    Ожидает
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Сумма</p>
                    <p className={`text-lg font-bold text-${color}-400`}>{Number(withdrawal.amount).toFixed(8)} {crypto}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{crypto} адрес</p>
                    <p className="text-sm font-mono break-all">{withdrawal.address}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Комментарий администратора (опционально)</label>
                  <Textarea
                    value={adminComment[withdrawal.id] || ''}
                    onChange={(e) => setAdminComment(prev => ({ ...prev, [withdrawal.id]: e.target.value }))}
                    placeholder="Добавьте комментарий к операции..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleProcessWithdrawal(withdrawal.id, 'completed')}
                    disabled={processing === withdrawal.id}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {processing === withdrawal.id ? (
                      <>
                        <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Icon name="CheckCircle" size={18} className="mr-2" />
                        Подтвердить вывод
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleProcessWithdrawal(withdrawal.id, 'rejected')}
                    disabled={processing === withdrawal.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing === withdrawal.id ? (
                      <>
                        <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Icon name="XCircle" size={18} className="mr-2" />
                        Отклонить
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
          })}
        </div>
      )}

      {processedWithdrawals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">История</h3>
          {processedWithdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="p-6 opacity-60">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon name="User" size={16} className="text-muted-foreground" />
                      <span className="font-semibold">{withdrawal.username || `User #${withdrawal.user_id}`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Calendar" size={14} />
                      <span>{new Date(withdrawal.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    withdrawal.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <Icon name={withdrawal.status === 'completed' ? 'CheckCircle' : 'XCircle'} size={14} />
                    {withdrawal.status === 'completed' ? 'Выполнено' : 'Отклонено'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Сумма</p>
                    <p className="text-lg font-bold text-orange-400">{Number(withdrawal.amount).toFixed(8)} {withdrawal.crypto_symbol || withdrawal.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{withdrawal.crypto_symbol || withdrawal.currency} адрес</p>
                    <p className="text-sm font-mono break-all">{withdrawal.address}</p>
                  </div>
                </div>

                {withdrawal.admin_comment && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Комментарий администратора</p>
                    <p className="text-sm">{withdrawal.admin_comment}</p>
                  </div>
                )}

                {withdrawal.processed_at && (
                  <p className="text-xs text-muted-foreground">
                    Обработано: {new Date(withdrawal.processed_at).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBtcWithdrawalsTab;