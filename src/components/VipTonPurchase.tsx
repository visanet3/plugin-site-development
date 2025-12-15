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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = 'https://functions.poehali.dev/671797ff-2c45-4b83-b351-7c7545147491';
const TON_WALLET = 'UQCF1nZKca68-nGFl7z8CRDMiG5XeiwAf7LKvBu-dA2icqDl';

interface VipTonPurchaseProps {
  user: User | null;
  onShowAuthDialog: () => void;
}

interface VipOrder {
  id: number;
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

const VIP_PACKAGES = [
  { days: 30, price_ton: 1350, popular: false, label: '1 месяц' },
  { days: 90, price_ton: 3645, popular: true, label: '3 месяца', discount: '10%' },
  { days: 180, price_ton: 6480, popular: false, label: '6 месяцев', discount: '20%' },
  { days: 365, price_ton: 11826, popular: false, label: '1 год', discount: '27%' }
];

export const VipTonPurchase = ({ user, onShowAuthDialog }: VipTonPurchaseProps) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<VipOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(VIP_PACKAGES[0]);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}?action=my_orders`, {
        headers: {
          'X-User-Id': user.id.toString()
        }
      });
      const data = await response.json();
      
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  const handleBuyVip = (pkg: typeof VIP_PACKAGES[0]) => {
    if (!user) {
      onShowAuthDialog();
      return;
    }
    
    setSelectedPackage(pkg);
    setShowPaymentDialog(true);
  };

  const handleCreateOrder = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'create_order',
          amount_ton: selectedPackage.price_ton,
          vip_duration_days: selectedPackage.days
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentOrderId(data.order_id);
        toast({
          title: 'Заявка создана',
          description: 'Отправьте TON на указанный адрес и дождитесь подтверждения администратором',
          duration: 7000
        });
        fetchOrders();
      } else {
        throw new Error(data.error || 'Ошибка создания заказа');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать заказ',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(TON_WALLET);
    setCopied(true);
    toast({
      title: 'Скопировано',
      description: 'Адрес кошелька скопирован в буфер обмена'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitTxHash = async () => {
    if (!currentOrderId || !txHash.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите хеш транзакции',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user!.id.toString()
        },
        body: JSON.stringify({
          action: 'update_transaction_hash',
          order_id: currentOrderId,
          transaction_hash: txHash
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Хеш сохранён',
          description: 'Администратор проверит транзакцию и активирует VIP'
        });
        setShowPaymentDialog(false);
        setTxHash('');
        setCurrentOrderId(null);
        fetchOrders();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить хеш транзакции',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Ожидает проверки</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Выполнен</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонён</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
            <Icon name="Crown" size={24} className="text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Покупка VIP статуса</h2>
            <p className="text-muted-foreground">Оплата через криптовалюту TON</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {VIP_PACKAGES.map((pkg) => (
            <Card key={pkg.days} className={`p-4 relative ${pkg.popular ? 'border-yellow-500/50 shadow-lg' : ''}`}>
              {pkg.popular && (
                <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">
                  <Icon name="Star" size={12} className="mr-1" />
                  Популярный
                </Badge>
              )}
              {pkg.discount && (
                <Badge className="absolute -top-2 -left-2 bg-green-500 text-white text-xs">
                  -{pkg.discount}
                </Badge>
              )}
              
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">{pkg.label}</h3>
                <div className="text-3xl font-bold text-yellow-500 mb-1">
                  {pkg.price_ton} TON
                </div>
                <p className="text-xs text-muted-foreground">{pkg.days} дней VIP</p>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="Check" size={14} className="text-green-400" />
                  <span>Доступ к VIP пакетам</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Check" size={14} className="text-green-400" />
                  <span>Приоритетная поддержка</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Check" size={14} className="text-green-400" />
                  <span>Особый бейдж</span>
                </div>
              </div>
              
              <Button
                onClick={() => handleBuyVip(pkg)}
                className={`w-full ${pkg.popular ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-600 hover:to-orange-600' : ''}`}
              >
                <Icon name="ShoppingCart" size={16} className="mr-2" />
                Купить
              </Button>
            </Card>
          ))}
        </div>

        {orders.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Мои заказы</h3>
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{order.vip_duration_days} дней VIP</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Сумма: {order.amount_ton} TON
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Создан: {new Date(order.created_at).toLocaleString('ru-RU')}
                      </p>
                      {order.admin_comment && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Комментарий: {order.admin_comment}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Оплата VIP статуса</DialogTitle>
            <DialogDescription>
              {selectedPackage.label} - {selectedPackage.price_ton} TON
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!currentOrderId ? (
              <>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={20} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-400 mb-2">Как оплатить:</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Создайте заявку на покупку</li>
                        <li>Отправьте {selectedPackage.price_ton} TON на указанный адрес</li>
                        <li>Введите хеш транзакции (опционально)</li>
                        <li>Дождитесь проверки администратором</li>
                      </ol>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleCreateOrder}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-600 hover:to-orange-600"
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Icon name="Plus" size={16} className="mr-2" />
                      Создать заявку
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>Адрес для отправки TON</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={TON_WALLET}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={handleCopyAddress}
                      variant="outline"
                      size="sm"
                    >
                      <Icon name={copied ? "Check" : "Copy"} size={16} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Отправьте {selectedPackage.price_ton} TON на этот адрес
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="txHash">Хеш транзакции (опционально)</Label>
                  <Input
                    id="txHash"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Вставьте хеш транзакции"
                    className="mt-2 font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Это ускорит проверку платежа администратором
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowPaymentDialog(false);
                      setCurrentOrderId(null);
                      setTxHash('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Позже
                  </Button>
                  <Button
                    onClick={handleSubmitTxHash}
                    disabled={!txHash.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Icon name="Check" size={16} className="mr-2" />
                    Отправил
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VipTonPurchase;