import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { triggerUserSync } from '@/utils/userSync';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AUTH_URL = 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03';
const CRYPTO_PRICES_URL = 'https://functions.poehali.dev/f969550a-2586-4760-bff9-57823dd0a0d0';

interface ExchangePageProps {
  user: User;
  onRefreshUserBalance?: () => void;
}

type CryptoSymbol = 'BTC' | 'ETH' | 'BNB' | 'SOL' | 'XRP' | 'TRX';

interface CryptoInfo {
  name: string;
  icon: string;
  color: string;
  decimals: number;
  minAmount: number;
}

const CRYPTO_INFO: Record<CryptoSymbol, CryptoInfo> = {
  BTC: { name: 'Bitcoin', icon: 'Bitcoin', color: 'text-orange-400', decimals: 8, minAmount: 0.0001 },
  ETH: { name: 'Ethereum', icon: 'Gem', color: 'text-purple-400', decimals: 6, minAmount: 0.001 },
  BNB: { name: 'BNB', icon: 'Coins', color: 'text-yellow-400', decimals: 5, minAmount: 0.01 },
  SOL: { name: 'Solana', icon: 'Zap', color: 'text-blue-400', decimals: 5, minAmount: 0.01 },
  XRP: { name: 'Ripple', icon: 'Waves', color: 'text-cyan-400', decimals: 4, minAmount: 1 },
  TRX: { name: 'Tron', icon: 'Triangle', color: 'text-red-400', decimals: 2, minAmount: 10 }
};

const ExchangePage = ({ user, onRefreshUserBalance }: ExchangePageProps) => {
  const { toast } = useToast();
  const [prices, setPrices] = useState<Record<CryptoSymbol, number>>({
    BTC: 0, ETH: 0, BNB: 0, SOL: 0, XRP: 0, TRX: 0
  });
  const [balances, setBalances] = useState<Record<CryptoSymbol, number>>({
    BTC: 0, ETH: 0, BNB: 0, SOL: 0, XRP: 0, TRX: 0
  });
  
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoSymbol>('BTC');
  const [usdtAmount, setUsdtAmount] = useState<string>('');
  const [cryptoAmount, setCryptoAmount] = useState<string>('');
  const [priceLoading, setPriceLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawCrypto, setWithdrawCrypto] = useState<CryptoSymbol>('BTC');
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'buy' | 'sell' | null>(null);
  const [priceUpdateTimer, setPriceUpdateTimer] = useState(60);
  const [priceLoadTime, setPriceLoadTime] = useState<Date | null>(null);

  useEffect(() => {
    loadPrices();
    loadBalances();
  }, [user.id]);

  useEffect(() => {
    if (showConfirmDialog && priceLoadTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - priceLoadTime.getTime()) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setPriceUpdateTimer(remaining);
        
        if (remaining === 0) {
          loadPrices();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showConfirmDialog, priceLoadTime]);

  const loadPrices = async () => {
    try {
      const response = await fetch(CRYPTO_PRICES_URL);
      const data = await response.json();
      
      if (data.success && data.prices) {
        setPrices(data.prices);
        setPriceLoadTime(new Date());
        setPriceUpdateTimer(60);
      }
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const loadBalances = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'get_crypto_balances'
        })
      });

      const data = await response.json();
      if (data.success && data.balances) {
        setBalances(data.balances);
      }
    } catch (error) {
      console.error('Ошибка загрузки балансов:', error);
    }
  };

  const handleUsdtToCryptoChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setUsdtAmount(value);
    const price = prices[selectedCrypto];
    if (price > 0 && numValue > 0) {
      const result = numValue / price;
      const decimals = CRYPTO_INFO[selectedCrypto].decimals;
      setCryptoAmount(result > 0 ? result.toFixed(decimals) : '0');
    } else {
      setCryptoAmount('');
    }
  };

  const handleCryptoToUsdtChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setCryptoAmount(value);
    const price = prices[selectedCrypto];
    if (price > 0 && numValue > 0) {
      const result = numValue * price;
      setUsdtAmount(result > 0 ? result.toFixed(2) : '0.00');
    } else {
      setUsdtAmount('');
    }
  };

  const handleMaxUsdt = () => {
    const maxAmount = Number(user.balance || 0);
    if (maxAmount > 0) {
      handleUsdtToCryptoChange(maxAmount.toFixed(2));
    }
  };

  const handleMaxCrypto = () => {
    const balance = balances[selectedCrypto];
    if (balance > 0) {
      const decimals = CRYPTO_INFO[selectedCrypto].decimals;
      handleCryptoToUsdtChange(balance.toFixed(decimals));
    }
  };

  const handleBuyCrypto = async () => {
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

    await loadPrices();
    setConfirmAction('buy');
    setShowConfirmDialog(true);
  };

  const confirmBuyCrypto = async () => {
    const usdt = parseFloat(usdtAmount);
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'exchange_usdt_to_crypto',
          usdt_amount: usdt,
          crypto_symbol: selectedCrypto,
          crypto_price: prices[selectedCrypto]
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Обмен выполнен!',
          description: `Вы обменяли ${usdt} USDT на ${data.crypto_received} ${selectedCrypto}`
        });
        
        triggerUserSync();
        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
        
        loadBalances();
        setUsdtAmount('');
        setCryptoAmount('');
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

  const handleSellCrypto = async () => {
    const crypto = parseFloat(cryptoAmount);
    
    if (!crypto || crypto <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive'
      });
      return;
    }

    if (crypto > balances[selectedCrypto]) {
      toast({
        title: 'Недостаточно средств',
        description: `На вашем балансе недостаточно ${selectedCrypto}`,
        variant: 'destructive'
      });
      return;
    }

    const minAmount = CRYPTO_INFO[selectedCrypto].minAmount;
    if (crypto < minAmount) {
      toast({
        title: 'Минимальная сумма',
        description: `Минимальная сумма обмена: ${minAmount} ${selectedCrypto}`,
        variant: 'destructive'
      });
      return;
    }

    await loadPrices();
    setConfirmAction('sell');
    setShowConfirmDialog(true);
  };

  const confirmSellCrypto = async () => {
    const crypto = parseFloat(cryptoAmount);
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'exchange_crypto_to_usdt',
          crypto_amount: crypto,
          crypto_symbol: selectedCrypto,
          crypto_price: prices[selectedCrypto]
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Обмен выполнен!',
          description: `Вы обменяли ${crypto} ${selectedCrypto} на ${data.usdt_received} USDT`
        });
        
        triggerUserSync();
        if (onRefreshUserBalance) {
          onRefreshUserBalance();
        }
        
        loadBalances();
        setUsdtAmount('');
        setCryptoAmount('');
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
    
    if (!amount || amount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive'
      });
      return;
    }

    if (!withdrawAddress.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите адрес кошелька',
        variant: 'destructive'
      });
      return;
    }

    const balance = balances[withdrawCrypto];
    if (amount > balance) {
      toast({
        title: 'Недостаточно средств',
        description: `На балансе ${balance.toFixed(CRYPTO_INFO[withdrawCrypto].decimals)} ${withdrawCrypto}`,
        variant: 'destructive'
      });
      return;
    }

    const minWithdraw = CRYPTO_INFO[withdrawCrypto].minAmount * 10;
    if (amount < minWithdraw) {
      toast({
        title: 'Минимальная сумма',
        description: `Минимум для вывода: ${minWithdraw} ${withdrawCrypto}`,
        variant: 'destructive'
      });
      return;
    }

    setWithdrawLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify({
          action: 'withdraw_crypto',
          crypto_symbol: withdrawCrypto,
          amount: amount,
          address: withdrawAddress
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Заявка создана',
          description: `Вывод ${amount} ${withdrawCrypto} будет обработан в течение 24 часов`
        });
        
        loadBalances();
        setWithdrawAddress('');
        setWithdrawAmount('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Ошибка вывода',
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
      setWithdrawLoading(false);
    }
  };

  const currentPrice = prices[selectedCrypto];
  const currentBalance = balances[selectedCrypto];
  const cryptoInfo = CRYPTO_INFO[selectedCrypto];

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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Icon name="DollarSign" size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{Number(user.balance || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">USDT</p>
            </div>
          </div>
        </Card>

        {(['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX'] as CryptoSymbol[]).slice(0, 3).map(symbol => (
          <Card key={symbol} className="p-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-${symbol === 'BTC' ? 'orange' : symbol === 'ETH' ? 'purple' : 'yellow'}-500/20 flex items-center justify-center`}>
                <Icon name={CRYPTO_INFO[symbol].icon as any} size={16} className={CRYPTO_INFO[symbol].color} />
              </div>
              <div>
                <p className="text-lg font-bold">{balances[symbol].toFixed(CRYPTO_INFO[symbol].decimals)}</p>
                <p className="text-xs text-muted-foreground">{symbol}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buy">Купить</TabsTrigger>
          <TabsTrigger value="sell">Продать</TabsTrigger>
          <TabsTrigger value="withdraw">Вывод</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Выберите криптовалюту</Label>
                <Select value={selectedCrypto} onValueChange={(v) => setSelectedCrypto(v as CryptoSymbol)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CRYPTO_INFO).map(symbol => (
                      <SelectItem key={symbol} value={symbol}>
                        <div className="flex items-center gap-2">
                          <Icon name={CRYPTO_INFO[symbol as CryptoSymbol].icon as any} size={16} />
                          {symbol} - {CRYPTO_INFO[symbol as CryptoSymbol].name}
                          {!priceLoading && ` ($${prices[symbol as CryptoSymbol].toLocaleString()})`}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Отдаете USDT</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Баланс: {Number(user.balance || 0).toFixed(2)}</span>
                      <Button variant="outline" size="sm" onClick={handleMaxUsdt} className="h-6 px-2 text-xs">
                        Все
                      </Button>
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={usdtAmount}
                    onChange={(e) => handleUsdtToCryptoChange(e.target.value)}
                    placeholder="0.00"
                    className="text-lg"
                  />
                </div>

                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="ArrowDown" size={20} className="text-primary" />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Получаете {selectedCrypto}</Label>
                  <Input
                    type="number"
                    value={cryptoAmount}
                    readOnly
                    placeholder={`0.${'0'.repeat(cryptoInfo.decimals)}`}
                    className="text-lg bg-muted/50"
                  />
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Курс {selectedCrypto}:</span>
                  <span className="font-medium">${currentPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleBuyCrypto}
                disabled={loading || !usdtAmount || parseFloat(usdtAmount) < 10 || priceLoading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {loading ? 'Обмен...' : `Купить ${selectedCrypto}`}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Выберите криптовалюту</Label>
                <Select value={selectedCrypto} onValueChange={(v) => setSelectedCrypto(v as CryptoSymbol)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CRYPTO_INFO).map(symbol => (
                      <SelectItem key={symbol} value={symbol}>
                        <div className="flex items-center gap-2">
                          <Icon name={CRYPTO_INFO[symbol as CryptoSymbol].icon as any} size={16} />
                          {symbol} - {CRYPTO_INFO[symbol as CryptoSymbol].name}
                          {!priceLoading && ` ($${prices[symbol as CryptoSymbol].toLocaleString()})`}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Отдаете {selectedCrypto}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Баланс: {currentBalance.toFixed(cryptoInfo.decimals)}
                      </span>
                      <Button variant="outline" size="sm" onClick={handleMaxCrypto} className="h-6 px-2 text-xs">
                        Все
                      </Button>
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={cryptoAmount}
                    onChange={(e) => handleCryptoToUsdtChange(e.target.value)}
                    placeholder={`0.${'0'.repeat(cryptoInfo.decimals)}`}
                    className="text-lg"
                  />
                </div>

                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="ArrowDown" size={20} className="text-primary" />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Получаете USDT</Label>
                  <Input
                    type="number"
                    value={usdtAmount}
                    readOnly
                    placeholder="0.00"
                    className="text-lg bg-muted/50"
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Минимальная сумма:</span>
                  <span className="font-medium">{cryptoInfo.minAmount} {selectedCrypto}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Комиссия:</span>
                  <span className="font-medium text-green-400">0%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Курс {selectedCrypto}:</span>
                  <span className="font-medium">${currentPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleSellCrypto}
                disabled={loading || !cryptoAmount || parseFloat(cryptoAmount) < cryptoInfo.minAmount || priceLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {loading ? 'Обмен...' : `Продать ${selectedCrypto}`}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Выберите криптовалюту</Label>
                <Select value={withdrawCrypto} onValueChange={(v) => setWithdrawCrypto(v as CryptoSymbol)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CRYPTO_INFO).map(symbol => (
                      <SelectItem key={symbol} value={symbol}>
                        <div className="flex items-center gap-2">
                          <Icon name={CRYPTO_INFO[symbol as CryptoSymbol].icon as any} size={16} />
                          {symbol} - {CRYPTO_INFO[symbol as CryptoSymbol].name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Адрес кошелька</Label>
                <Input
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder={`Введите адрес ${withdrawCrypto}`}
                  className="font-mono"
                />
              </div>

              <div>
                <Label className="mb-2 block">Сумма {withdrawCrypto}</Label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`0.${'0'.repeat(CRYPTO_INFO[withdrawCrypto].decimals)}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Доступно: {balances[withdrawCrypto].toFixed(CRYPTO_INFO[withdrawCrypto].decimals)} {withdrawCrypto}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Минимум:</span>
                  <span className="font-medium">{CRYPTO_INFO[withdrawCrypto].minAmount * 10} {withdrawCrypto}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Комиссия сети:</span>
                  <span className="font-medium text-orange-400">~{CRYPTO_INFO[withdrawCrypto].minAmount} {withdrawCrypto}</span>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !withdrawAddress || !withdrawAmount}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {withdrawLoading ? 'Обработка...' : `Вывести ${withdrawCrypto}`}
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
              <li>• Курс обновляется каждую минуту</li>
              <li>• Комиссия за обмен: 0% (уже включена в курс +1.5%)</li>
              <li>• Минимум для покупки: 10 USDT</li>
              <li>• Вывод обрабатывается в течение 24 часов</li>
              <li>• Поддерживаются: BTC, ETH, BNB, SOL, XRP, TRX</li>
            </ul>
          </div>
        </div>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="AlertCircle" size={24} className="text-orange-500" />
              Подтверждение обмена
            </DialogTitle>
            <DialogDescription>
              Проверьте детали операции перед подтверждением
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${priceUpdateTimer > 10 ? 'bg-green-500 animate-pulse' : 'bg-orange-500 animate-pulse'}`} />
                <span className="text-sm font-medium">
                  {priceUpdateTimer > 10 ? 'Курс актуален' : 'Обновление курса...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Clock" size={16} className="text-muted-foreground" />
                <span className="text-sm font-mono font-semibold">
                  {Math.floor(priceUpdateTimer / 60)}:{(priceUpdateTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Курс {selectedCrypto}:</span>
                <span className="font-bold text-lg text-green-400">
                  ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="border-t border-border/50 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Вы отдаёте:</span>
                  <span className="font-semibold">
                    {confirmAction === 'buy' ? `${usdtAmount} USDT` : `${cryptoAmount} ${selectedCrypto}`}
                  </span>
                </div>
              </div>

              <div className="border-t border-border/50 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Вы получите:</span>
                  <span className="font-bold text-lg text-green-400">
                    {confirmAction === 'buy' ? `${cryptoAmount} ${selectedCrypto}` : `${usdtAmount} USDT`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <Icon name="Info" size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p>Курс зафиксирован на 1 минуту. После курс будет обновлен.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={confirmAction === 'buy' ? confirmBuyCrypto : confirmSellCrypto}
              className="bg-gradient-to-r from-green-500 to-green-600"
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExchangePage;
