import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface FlashUsdtOrder {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  wallet_address: string;
  network: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  cancelled_reason?: string;
}

interface AdminFlashUsdtTabProps {
  orders: FlashUsdtOrder[];
  currentUser: User;
  onRefresh: () => void;
}

const AdminFlashUsdtTab = ({ orders, currentUser, onRefresh }: AdminFlashUsdtTabProps) => {
  const [selectedOrder, setSelectedOrder] = useState<FlashUsdtOrder | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершен';
      case 'pending':
        return 'В обработке';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold">Заказы Flash USDT</h2>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <Icon name="RefreshCw" size={16} className="mr-2" />
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Icon name="Clock" size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingOrders.length}</p>
              <p className="text-xs text-muted-foreground">В обработке</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Icon name="CheckCircle2" size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedOrders.length}</p>
              <p className="text-xs text-muted-foreground">Завершено</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Icon name="XCircle" size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{cancelledOrders.length}</p>
              <p className="text-xs text-muted-foreground">Отменено</p>
            </div>
          </div>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <Icon name="Package" size={48} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Нет заказов Flash USDT</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card 
              key={order.id} 
              className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                expandedOrderId === order.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => toggleOrderDetails(order.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono text-muted-foreground">#{order.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Пользователь:</span>
                      <span className="ml-2 font-medium">{order.username}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Сумма:</span>
                      <span className="ml-2 font-bold text-primary">{order.amount} USDT</span>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-muted-foreground">Дата:</span>
                      <span className="ml-2">{new Date(order.created_at).toLocaleString('ru-RU')}</span>
                    </div>
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Кошелек получателя:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-muted/50 px-3 py-2 rounded text-xs font-mono break-all">
                            {order.wallet_address}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(order.wallet_address);
                            }}
                          >
                            <Icon name="Copy" size={14} />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Сеть:</p>
                        <span className="inline-flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium">
                          <Icon name="Network" size={12} />
                          {order.network || 'TRC-20'}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">ID пользователя:</p>
                        <span className="font-mono text-sm">{order.user_id}</span>
                      </div>

                      {order.completed_at && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Завершен:</p>
                          <span className="text-sm">{new Date(order.completed_at).toLocaleString('ru-RU')}</span>
                        </div>
                      )}

                      {order.cancelled_reason && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Причина отмены:</p>
                          <p className="text-sm text-red-400">{order.cancelled_reason}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Icon 
                  name={expandedOrderId === order.id ? "ChevronUp" : "ChevronDown"} 
                  size={20} 
                  className="text-muted-foreground flex-shrink-0" 
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFlashUsdtTab;
