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

const API_URL = 'https://functions.poehali.dev/671797ff-2c45-4b83-b351-7c7545147491';

interface AdminVipTonTabProps {
  currentUser: User;
  onRefresh: () => void;
}

interface VipTonOrder {
  id: number;
  user_id: number;
  username: string;
  email: string;
  amount_ton: number;
  ton_wallet_address: string;
  status: 'pending' | 'completed' | 'rejected';
  vip_duration_days: number;
  user_transaction_hash: string | null;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export const AdminVipTonTab = ({ currentUser, onRefresh }: AdminVipTonTabProps) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<VipTonOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<VipTonOrder | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?action=admin_orders`, {
        headers: {
          'X-User-Id': currentUser.id.toString()
        }
      });
      const data = await response.json();
      
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заказы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOrder) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'admin_approve',
          order_id: selectedOrder.id,
          admin_comment: adminComment
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: data.message
        });
        setShowApproveDialog(false);
        setSelectedOrder(null);
        setAdminComment('');
        fetchOrders();
        onRefresh();
      } else {
        throw new Error(data.error || 'Ошибка подтверждения');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось подтвердить заказ',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify({
          action: 'admin_reject',
          order_id: selectedOrder.id,
          admin_comment: adminComment || 'Отклонено администратором'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Успешно',
          description: data.message
        });
        setShowRejectDialog(false);
        setSelectedOrder(null);
        setAdminComment('');
        fetchOrders();
      } else {
        throw new Error(data.error || 'Ошибка отклонения');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отклонить заказ',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Ожидает</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Выполнен</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонён</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">VIP заказы через TON</h3>
          <p className="text-sm text-muted-foreground">
            Управление заявками на покупку VIP статуса
            {pendingCount > 0 && (
              <span className="ml-2 text-yellow-400">
                • {pendingCount} ожидает проверки
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Обновить
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="ShoppingBag" size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Нет заказов на VIP через TON</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg">{order.username}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-muted-foreground">Email:</span>{' '}
                      <span>{order.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Сумма:</span>{' '}
                      <span className="font-semibold text-yellow-400">{order.amount_ton} TON</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">VIP период:</span>{' '}
                      <span>{order.vip_duration_days} дней</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID заказа:</span>{' '}
                      <span>#{order.id}</span>
                    </div>
                  </div>
                  
                  {order.user_transaction_hash && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 mb-2">
                      <p className="text-xs text-muted-foreground mb-1">Хеш транзакции:</p>
                      <p className="text-xs font-mono break-all text-blue-400">
                        {order.user_transaction_hash}
                      </p>
                    </div>
                  )}
                  
                  {order.admin_comment && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mb-2">
                      <p className="text-xs text-yellow-400">{order.admin_comment}</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Создан: {new Date(order.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                
                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowApproveDialog(true);
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Icon name="Check" size={16} className="mr-2" />
                      Выдать VIP
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowRejectDialog(true);
                      }}
                      size="sm"
                      variant="destructive"
                    >
                      <Icon name="X" size={16} className="mr-2" />
                      Отклонить
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение VIP заказа</DialogTitle>
            <DialogDescription>
              Вы выдаёте VIP статус на {selectedOrder?.vip_duration_days} дней пользователю: <strong>{selectedOrder?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={20} className="text-green-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-400 mb-1">Что произойдёт:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>VIP статус будет выдан пользователю</li>
                    <li>Срок действия: {selectedOrder?.vip_duration_days} дней</li>
                    <li>Заказ будет помечен как выполненный</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="approve-comment">Комментарий (опционально)</Label>
              <Textarea
                id="approve-comment"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={3}
                className="mt-2"
                placeholder="Добавьте комментарий к заказу"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setSelectedOrder(null);
                setAdminComment('');
              }}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Выдача VIP...
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  Подтвердить и выдать VIP
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонение VIP заказа</DialogTitle>
            <DialogDescription>
              Вы отклоняете заказ пользователя: <strong>{selectedOrder?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reject-comment">Причина отклонения</Label>
              <Textarea
                id="reject-comment"
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={3}
                className="mt-2"
                placeholder="Укажите причину отклонения заказа"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedOrder(null);
                setAdminComment('');
              }}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Отклонение...
                </>
              ) : (
                <>
                  <Icon name="X" size={16} className="mr-2" />
                  Отклонить заказ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVipTonTab;
