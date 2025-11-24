import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const WITHDRAWAL_URL = 'https://functions.poehali.dev/09f16983-ec42-41fe-a7bd-695752ee11c5';

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
  username?: string;
  email?: string;
}

interface AdminWithdrawalsTabProps {
  withdrawals: WithdrawalRequest[];
  currentUser: User;
  onRefresh: () => void;
}

const AdminWithdrawalsTab = ({ withdrawals, currentUser, onRefresh }: AdminWithdrawalsTabProps) => {
  const { toast } = useToast();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('processing');

  const processWithdrawal = async (withdrawalId: number, status: 'completed' | 'rejected') => {
    const confirmMsg = status === 'completed' 
      ? 'Подтвердить вывод средств? Средства будут отправлены на кошелек пользователя.'
      : 'Отклонить заявку? Средства будут возвращены пользователю.';
    
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const response = await fetch(WITHDRAWAL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'process_withdrawal',
          withdrawal_id: withdrawalId,
          status: status,
          comment: adminComment.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Успешно',
          description: status === 'completed' ? 'Вывод подтвержден' : 'Заявка отклонена',
          duration: 5000
        });
        setSelectedWithdrawal(null);
        setAdminComment('');
        onRefresh();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка обработки заявки',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  const filteredWithdrawals = filterStatus === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === filterStatus);

  const stats = {
    pending: withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    total: withdrawals.reduce((sum, w) => w.status === 'processing' || w.status === 'pending' ? sum + Number(w.amount) : sum, 0)
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <Icon name="Clock" size={20} className="text-yellow-400 sm:w-6 sm:h-6" />
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Ожидают</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <Icon name="CheckCircle" size={20} className="text-green-400 sm:w-6 sm:h-6" />
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Завершено</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <Icon name="XCircle" size={20} className="text-red-400 sm:w-6 sm:h-6" />
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Отклонено</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.rejected}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-blue-500/10 border-blue-500/30 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Icon name="DollarSign" size={20} className="text-blue-400 sm:w-6 sm:h-6" />
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">В обработке</p>
              <p className="text-base sm:text-2xl font-bold">{stats.total.toFixed(2)} USDT</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Все
          </Button>
          <Button
            variant={filterStatus === 'processing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('processing')}
          >
            В обработке
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('completed')}
          >
            Завершено
          </Button>
          <Button
            variant={filterStatus === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('rejected')}
          >
            Отклонено
          </Button>
        </div>

        {filteredWithdrawals.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Нет заявок</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredWithdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="p-4 border-border/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-lg">{withdrawal.amount} USDT</span>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div>
                        <p><strong>Пользователь:</strong> {withdrawal.username || withdrawal.email || `ID ${withdrawal.user_id}`}</p>
                        <p><strong>Кошелек:</strong> <span className="font-mono text-xs">{withdrawal.usdt_wallet}</span></p>
                      </div>
                      <div>
                        <p><strong>Создана:</strong> {formatDate(withdrawal.created_at)}</p>
                        {withdrawal.completed_at && (
                          <p><strong>Обработана:</strong> {formatDate(withdrawal.completed_at)}</p>
                        )}
                      </div>
                    </div>
                    {withdrawal.admin_comment && (
                      <p className="mt-2 text-sm text-orange-400">
                        <strong>Комментарий:</strong> {withdrawal.admin_comment}
                      </p>
                    )}
                  </div>
                  {(withdrawal.status === 'processing' || withdrawal.status === 'pending') && (
                    <Button
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                    >
                      <Icon name="Settings" size={18} className="mr-2" />
                      Обработать
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {selectedWithdrawal && (
        <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Обработка заявки #{selectedWithdrawal.id}</DialogTitle>
              <DialogDescription>
                Подтвердите вывод или отклоните заявку с комментарием
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                <div className="space-y-2 text-sm">
                  <p><strong>Сумма:</strong> {selectedWithdrawal.amount} USDT</p>
                  <p><strong>Пользователь:</strong> {selectedWithdrawal.username || selectedWithdrawal.email}</p>
                  <p><strong>Кошелек:</strong></p>
                  <p className="font-mono text-xs bg-card p-2 rounded break-all">{selectedWithdrawal.usdt_wallet}</p>
                  <p><strong>Создана:</strong> {formatDate(selectedWithdrawal.created_at)}</p>
                </div>
              </Card>

              <div>
                <Label htmlFor="admin-comment">Комментарий (необязательно)</Label>
                <Textarea
                  id="admin-comment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Например: Средства отправлены, TxHash: 0x..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => processWithdrawal(selectedWithdrawal.id, 'completed')}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
                >
                  <Icon name="CheckCircle" size={18} className="mr-2" />
                  Подтвердить вывод
                </Button>
                <Button
                  onClick={() => processWithdrawal(selectedWithdrawal.id, 'rejected')}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  <Icon name="XCircle" size={18} className="mr-2" />
                  Отклонить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminWithdrawalsTab;