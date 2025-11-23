import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface ExchangePageProps {
  user: User;
  onRefreshUserBalance?: () => void;
}

const ExchangePage = ({ user, onRefreshUserBalance }: ExchangePageProps) => {
  const { toast } = useToast();
  const [usdtAmount, setUsdtAmount] = useState<string>('');
  const [btcAmount, setBtcAmount] = useState<string>('');
  const [exchangeRate] = useState<number>(0.000015); // 1 USDT = 0.000015 BTC
  const [loading, setLoading] = useState(false);
  const [btcBalance, setBtcBalance] = useState<number>(0);

  useEffect(() => {
    loadBtcBalance();
  }, [user.id]);

  const loadBtcBalance = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'get_btc_balance'
        })
      });

      const data = await response.json();
      if (data.success) {
        setBtcBalance(data.btc_balance || 0);
      }
    } catch (error) {
      console.error('Ошибка загрузки BTC баланса:', error);
    }
  };

  const handleUsdtChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setUsdtAmount(value);
    setBtcAmount((numValue * exchangeRate).toFixed(8));
  };

  const handleBtcChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setBtcAmount(value);
    setUsdtAmount((numValue / exchangeRate).toFixed(2));
  };

  const handleExchange = async () => {
    const usdt = parseFloat(usdtAmount);
    
    if (!usdt || usdt <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive'
      });
      return;
    }

    if (usdt > (user.balance || 0)) {
      toast({
        title: 'Недостаточно средств',
        description: 'На вашем балансе недостаточно USDT',
        variant: 'destructive'
      });
      return;
    }

    if (usdt < 10) {
      toast({
        title: 'Минимальная сумма',
        description: 'Минимальная сумма обмена: 10 USDT',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'exchange_usdt_to_btc',
          usdt_amount: usdt
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Обмен выполнен!',
          description: `Вы обменяли ${usdt} USDT на ${data.btc_received} BTC`
        });
        
        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
        
        loadBtcBalance();
        setUsdtAmount('');
        setBtcAmount('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка обмена',
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
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center">
          <Icon name="ArrowLeftRight" size={24} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Обменник</h1>
          <p className="text-sm text-muted-foreground">Обмен USDT на BTC</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Icon name="DollarSign" size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Number(user.balance || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Баланс USDT</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Icon name="Bitcoin" size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{btcBalance.toFixed(8)}</p>
              <p className="text-xs text-muted-foreground">Баланс BTC</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Icon name="ArrowLeftRight" size={20} className="text-primary" />
              Обмен валюты
            </h3>
            <div className="text-xs text-muted-foreground">
              Курс: 1 USDT = {exchangeRate} BTC
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Отдаете</label>
              <div className="relative">
                <Input
                  type="number"
                  value={usdtAmount}
                  onChange={(e) => handleUsdtChange(e.target.value)}
                  placeholder="0.00"
                  className="pr-16 text-lg"
                  min="0"
                  step="0.01"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon name="DollarSign" size={16} className="text-green-400" />
                  USDT
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="ArrowDown" size={20} className="text-primary" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Получаете</label>
              <div className="relative">
                <Input
                  type="number"
                  value={btcAmount}
                  onChange={(e) => handleBtcChange(e.target.value)}
                  placeholder="0.00000000"
                  className="pr-16 text-lg"
                  min="0"
                  step="0.00000001"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon name="Bitcoin" size={16} className="text-orange-400" />
                  BTC
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Минимальная сумма:</span>
              <span className="font-medium">10 USDT</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Комиссия:</span>
              <span className="font-medium text-green-400">0%</span>
            </div>
          </div>

          <Button
            onClick={handleExchange}
            disabled={loading || !usdtAmount || parseFloat(usdtAmount) < 10}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                Обмен...
              </>
            ) : (
              <>
                <Icon name="ArrowLeftRight" size={18} className="mr-2" />
                Обменять
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Icon name="Info" size={24} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Как это работает?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Обмен происходит мгновенно по текущему курсу</li>
              <li>• Минимальная сумма обмена: 10 USDT</li>
              <li>• Комиссия за обмен: 0%</li>
              <li>• BTC доступны для вывода сразу после обмена</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExchangePage;