import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface VipFlashPurchaseProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
  onClose?: () => void;
}

const VIP_PACKAGES = [
  { days: 30, price_usdt: 4300, popular: false, label: '1 месяц' },
  { days: 90, price_usdt: 11610, popular: true, label: '3 месяца', discount: '10%' },
  { days: 180, price_usdt: 20640, popular: false, label: '6 месяцев', discount: '20%' },
  { days: 365, price_usdt: 37748, popular: false, label: '1 год', discount: '27%' }
];

export const VipFlashPurchase = ({ user, onShowAuthDialog, onRefreshUserBalance, onClose }: VipFlashPurchaseProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleBuyVip = async (pkg: typeof VIP_PACKAGES[0]) => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    if (user.balance < pkg.price_usdt) {
      toast({
        title: 'Недостаточно средств',
        description: `Необходимо ${pkg.price_usdt} USDT, у вас ${user.balance} USDT`,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'purchase_vip_flash',
          price: pkg.price_usdt,
          duration_days: pkg.days
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'VIP активирован!',
          description: `Статус VIP активирован на ${pkg.days} дней`,
          duration: 5000
        });
        onRefreshUserBalance?.();
        onClose?.();
      } else {
        throw new Error(data.error || 'Ошибка покупки VIP');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось купить VIP',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-transparent border-yellow-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
            <Icon name="Crown" size={24} className="text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Покупка VIP статуса</h2>
            <p className="text-muted-foreground">Оплата через USDT баланс</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {VIP_PACKAGES.map((pkg) => (
            <Card 
              key={pkg.days} 
              className={`p-4 relative transition-all hover:scale-105 ${
                pkg.popular 
                  ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                  : 'border-border/50'
              }`}
            >
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
                  {formatNumber(pkg.price_usdt)} USDT
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
                disabled={loading || !user || user.balance < pkg.price_usdt}
                className={`w-full ${
                  pkg.popular 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
                    : ''
                }`}
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Icon name="ShoppingCart" size={16} className="mr-2" />
                    Купить
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {user && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ваш баланс:</span>
              <span className="text-lg font-bold">{formatNumber(user.balance)} USDT</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VipFlashPurchase;
