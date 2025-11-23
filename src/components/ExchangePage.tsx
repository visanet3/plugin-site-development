import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';

interface ExchangePageProps {
  user: User;
  onRefreshUserBalance?: () => void;
}

const ExchangePage = ({ user, onRefreshUserBalance }: ExchangePageProps) => {
  const { toast } = useToast();
  const [usdtAmount, setUsdtAmount] = useState<string>('');
  const [btcAmount, setBtcAmount] = useState<string>('');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [prevBtcPrice, setPrevBtcPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [loading, setLoading] = useState(false);
  const [btcBalance, setBtcBalance] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    loadBtcBalance();
    loadBtcPrice();
    const interval = setInterval(loadBtcPrice, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  const loadBtcPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await response.json();
      const newPrice = data.bitcoin.usd;
      
      if (btcPrice > 0) {
        setPrevBtcPrice(btcPrice);
        if (newPrice > btcPrice) {
          setPriceChange('up');
        } else if (newPrice < btcPrice) {
          setPriceChange('down');
        } else {
          setPriceChange('neutral');
        }
        
        setTimeout(() => setPriceChange('neutral'), 2000);
      }
      
      setBtcPrice(newPrice);
    } catch (error) {
      console.error('Ошибка загрузки курса BTC:', error);
      if (btcPrice === 0) {
        setBtcPrice(65000);
      }
    } finally {
      setPriceLoading(false);
    }
  };

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

  const handleUsdtToBtcChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setUsdtAmount(value);
    if (btcPrice > 0) {
      setBtcAmount((numValue / btcPrice).toFixed(8));
    }
  };

  const handleBtcToUsdtChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setBtcAmount(value);
    if (btcPrice > 0) {
      setUsdtAmount((numValue * btcPrice).toFixed(2));
    }
  };

  const handleExchangeUsdtToBtc = async () => {
    const usdt = parseFloat(usdtAmount);
    
    if (!usdt || usdt <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive'
      });
      return;
    }

    if (usdt > Number(user.balance || 0)) {
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
          usdt_amount: usdt,
          btc_price: btcPrice
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

  const handleExchangeBtcToUsdt = async () => {
    const btc = parseFloat(btcAmount);
    
    if (!btc || btc <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive'
      });
      return;
    }

    if (btc > btcBalance) {
      toast({
        title: 'Недостаточно средств',
        description: 'На вашем балансе недостаточно BTC',
        variant: 'destructive'
      });
      return;
    }

    if (btc < 0.0001) {
      toast({
        title: 'Минимальная сумма',
        description: 'Минимальная сумма обмена: 0.0001 BTC',
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
          action: 'exchange_btc_to_usdt',
          btc_amount: btc,
          btc_price: btcPrice
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Обмен выполнен!',
          description: `Вы обменяли ${btc} BTC на ${data.usdt_received} USDT`
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

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!withdrawAddress.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите BTC адрес',
        variant: 'destructive'
      });
      return;
    }

    if (!amount || amount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive'
      });
      return;
    }

    if (amount > btcBalance) {
      toast({
        title: 'Недостаточно средств',
        description: 'На вашем балансе недостаточно BTC',
        variant: 'destructive'
      });
      return;
    }

    if (amount < 0.001) {
      toast({
        title: 'Минимальная сумма',
        description: 'Минимальная сумма вывода: 0.001 BTC',
        variant: 'destructive'
      });
      return;
    }

    setWithdrawLoading(true);

    try {
      console.log('🔵 Отправка запроса на вывод BTC:', {
        action: 'withdraw_btc',
        btc_amount: amount,
        btc_address: withdrawAddress,
        user_id: user.id
      });

      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'withdraw_btc',
          btc_amount: amount,
          btc_address: withdrawAddress
        })
      });

      console.log('📡 Статус ответа:', response.status);

      const data = await response.json();
      console.log('📦 Ответ сервера:', data);

      if (data.success) {
        toast({
          title: '✅ Заявка на вывод принята!',
          description: 'Ваш вывод находится на рассмотрении. Среднее время рассмотрения от 2 минут до 1 часа'
        });
        
        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
        
        loadBtcBalance();
        setWithdrawAddress('');
        setWithdrawAmount('');
      } else {
        console.error('❌ Ошибка вывода:', data.error);
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка вывода',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('💥 Исключение при выводе:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setWithdrawLoading(false);
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
          <p className="text-sm text-muted-foreground">Обмен и вывод криптовалюты</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${
              priceChange === 'up' ? 'bg-green-500/30 scale-110' : 
              priceChange === 'down' ? 'bg-red-500/30 scale-110' : 
              'bg-blue-500/20'
            }`}>
              <Icon 
                name={priceChange === 'up' ? 'TrendingUp' : priceChange === 'down' ? 'TrendingDown' : 'TrendingUp'} 
                size={20} 
                className={`transition-colors duration-500 ${
                  priceChange === 'up' ? 'text-green-400' : 
                  priceChange === 'down' ? 'text-red-400' : 
                  'text-blue-400'
                }`}
              />
            </div>
            <div className="flex-1">
              <p className={`text-2xl font-bold transition-all duration-500 ${
                priceChange === 'up' ? 'text-green-400 scale-105' : 
                priceChange === 'down' ? 'text-red-400 scale-105' : 
                ''
              }`}>
                {priceLoading ? '...' : `$${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Курс BTC</p>
                {priceChange !== 'neutral' && (
                  <span className={`text-xs font-medium ${priceChange === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange === 'up' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="usdt-to-btc" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usdt-to-btc">USDT → BTC</TabsTrigger>
          <TabsTrigger value="btc-to-usdt">BTC → USDT</TabsTrigger>
          <TabsTrigger value="withdraw">Вывод BTC</TabsTrigger>
        </TabsList>

        <TabsContent value="usdt-to-btc" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon name="ArrowRight" size={20} className="text-primary" />
                  Обмен USDT на BTC
                </h3>
                <div className={`text-xs font-medium transition-colors duration-500 ${
                  priceChange === 'up' ? 'text-green-400' : 
                  priceChange === 'down' ? 'text-red-400' : 
                  'text-muted-foreground'
                }`}>
                  1 BTC = ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Отдаете</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={usdtAmount}
                      onChange={(e) => handleUsdtToBtcChange(e.target.value)}
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
                      readOnly
                      placeholder="0.00000000"
                      className="pr-16 text-lg bg-muted/50"
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
                onClick={handleExchangeUsdtToBtc}
                disabled={loading || !usdtAmount || parseFloat(usdtAmount) < 10 || priceLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Обмен...
                  </>
                ) : (
                  <>
                    <Icon name="ArrowRight" size={18} className="mr-2" />
                    Обменять USDT на BTC
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="btc-to-usdt" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon name="ArrowLeft" size={20} className="text-primary" />
                  Обмен BTC на USDT
                </h3>
                <div className={`text-xs font-medium transition-colors duration-500 ${
                  priceChange === 'up' ? 'text-green-400' : 
                  priceChange === 'down' ? 'text-red-400' : 
                  'text-muted-foreground'
                }`}>
                  1 BTC = ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Отдаете</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={btcAmount}
                      onChange={(e) => handleBtcToUsdtChange(e.target.value)}
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
                      value={usdtAmount}
                      readOnly
                      placeholder="0.00"
                      className="pr-16 text-lg bg-muted/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Icon name="DollarSign" size={16} className="text-green-400" />
                      USDT
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Минимальная сумма:</span>
                  <span className="font-medium">0.0001 BTC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Комиссия:</span>
                  <span className="font-medium text-green-400">0%</span>
                </div>
              </div>

              <Button
                onClick={handleExchangeBtcToUsdt}
                disabled={loading || !btcAmount || parseFloat(btcAmount) < 0.0001 || priceLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Обмен...
                  </>
                ) : (
                  <>
                    <Icon name="ArrowLeft" size={18} className="mr-2" />
                    Обменять BTC на USDT
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Icon name="Send" size={20} className="text-primary" />
                <h3 className="text-lg font-semibold">Вывод BTC</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">BTC адрес получателя</Label>
                  <Input
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="bc1q..."
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Сумма BTC</Label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00000000"
                    step="0.00000001"
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Доступно: {btcBalance.toFixed(8)} BTC
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Минимальная сумма:</span>
                  <span className="font-medium">0.001 BTC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Комиссия сети:</span>
                  <span className="font-medium text-orange-400">~0.0001 BTC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Время обработки:</span>
                  <span className="font-medium">До 24 часов</span>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !withdrawAddress || !withdrawAmount || parseFloat(withdrawAmount) < 0.001}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {withdrawLoading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={18} className="mr-2" />
                    Вывести BTC
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Icon name="Info" size={24} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Как это работает?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Обмен происходит мгновенно по текущему рыночному курсу</li>
              <li>• Курс обновляется каждые 10 секунд с биржи CoinGecko</li>
              <li>• Комиссия за обмен: 0%</li>
              <li>• Минимум для обмена: 10 USDT или 0.0001 BTC</li>
              <li>• Минимум для вывода BTC: 0.001 BTC</li>
              <li>• Вывод обрабатывается администратором в течение 24 часов</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExchangePage;