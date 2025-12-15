import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const API_URL = 'https://functions.poehali.dev/d545f1eb-6d98-4274-8192-0e8b0140d4b4';

interface AdminWithdrawalControlProps {
  user: User | null;
}

interface UserWithdrawalInfo {
  id: number;
  username: string;
  email: string;
  balance: number;
  withdrawal_blocked: boolean;
  withdrawal_blocked_reason: string | null;
  withdrawal_blocked_at: string | null;
}

export const AdminWithdrawalControl = ({ user }: AdminWithdrawalControlProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithdrawalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithdrawalInfo | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState('Вывод в данный момент недоступен для вас, так как пользователь превысил количество пополнений. Во избежание потери денег, обратитесь в поддержку.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=list`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список пользователей',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockWithdrawal = async () => {
    if (!selectedUser || !user) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'block_withdrawal',
          user_id: selectedUser.id,
          reason: blockReason
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: `Вывод заблокирован для ${selectedUser.username}`
        });
        setShowBlockDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Ошибка блокировки');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось заблокировать вывод',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblockWithdrawal = async (targetUser: UserWithdrawalInfo) => {
    if (!user) return;
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'unblock_withdrawal',
          user_id: targetUser.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: `Вывод разблокирован для ${targetUser.username}`
        });
        fetchUsers();
      } else {
        throw new Error(data.error || 'Ошибка разблокировки');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось разблокировать вывод',
        variant: 'destructive'
      });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md text-center">
          <Icon name="ShieldAlert" size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-bold mb-2">Доступ запрещен</h3>
          <p className="text-muted-foreground">
            У вас нет прав для доступа к этой панели
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Управление выводами средств</h2>
            <p className="text-muted-foreground">
              Блокировка и разблокировка возможности вывода для пользователей
            </p>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Обновить
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пользователи не найдены</p>
              </div>
            ) : (
              users.map((targetUser) => (
                <Card key={targetUser.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{targetUser.username}</h3>
                        {targetUser.withdrawal_blocked && (
                          <Badge variant="destructive" className="text-xs">
                            <Icon name="Ban" size={12} className="mr-1" />
                            Вывод заблокирован
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {targetUser.email} • ID: {targetUser.id}
                      </p>
                      <p className="text-sm">
                        Баланс: <span className="font-semibold">{targetUser.balance.toFixed(2)} USDT</span>
                      </p>
                      {targetUser.withdrawal_blocked && targetUser.withdrawal_blocked_reason && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
                          <p className="text-red-400">{targetUser.withdrawal_blocked_reason}</p>
                          {targetUser.withdrawal_blocked_at && (
                            <p className="text-muted-foreground mt-1">
                              Заблокировано: {new Date(targetUser.withdrawal_blocked_at).toLocaleString('ru-RU')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {targetUser.withdrawal_blocked ? (
                        <Button
                          onClick={() => handleUnblockWithdrawal(targetUser)}
                          variant="outline"
                          size="sm"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        >
                          <Icon name="Unlock" size={16} className="mr-2" />
                          Разблокировать
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedUser(targetUser);
                            setShowBlockDialog(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Icon name="Ban" size={16} className="mr-2" />
                          Заблокировать
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </Card>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Блокировка вывода средств</DialogTitle>
            <DialogDescription>
              Вы блокируете вывод средств для пользователя: <strong>{selectedUser?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Причина блокировки</Label>
              <Textarea
                id="reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
                className="mt-2"
                placeholder="Укажите причину блокировки вывода"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Это сообщение увидит пользователь при попытке вывода средств
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBlockDialog(false);
                setSelectedUser(null);
              }}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleBlockWithdrawal}
              disabled={isSubmitting || !blockReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Блокировка...
                </>
              ) : (
                <>
                  <Icon name="Ban" size={16} className="mr-2" />
                  Заблокировать вывод
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawalControl;
