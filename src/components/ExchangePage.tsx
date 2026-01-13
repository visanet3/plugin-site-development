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
  emoji: string;
  logo: string;
  color: string;
  bgColor: string;
  decimals: number;
  minAmount: number;
}

const CRYPTO_INFO: Record<CryptoSymbol, CryptoInfo> = {
  BTC: { name: 'Bitcoin', icon: 'Bitcoin', emoji: '₿', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', color: 'text-orange-400', bgColor: 'bg-orange-500/10', decimals: 8, minAmount: 0.0001 },
  ETH: { name: 'Ethereum', icon: 'Gem', emoji: 'Ξ', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', color: 'text-purple-400', bgColor: 'bg-purple-500/10', decimals: 6, minAmount: 0.001 },
  BNB: { name: 'BNB', icon: 'Coins', emoji: '◆', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', decimals: 5, minAmount: 0.01 },
  SOL: { name: 'Solana', icon: 'Zap', emoji: '◎', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png', color: 'text-blue-400', bgColor: 'bg-blue-500/10', decimals: 5, minAmount: 0.01 },
  XRP: { name: 'Ripple', icon: 'Waves', emoji: '✕', logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png', color: 'text-cyan-300', bgColor: 'bg-cyan-400/15', decimals: 4, minAmount: 1 },
  TRX: { name: 'Tron', icon: 'Triangle', emoji: '▲', logo: 'https://cryptologos.cc/logos/tron-trx-logo.png', color: 'text-red-400', bgColor: 'bg-red-500/10', decimals: 2, minAmount: 10 }
};

const ExchangePage = ({ user, onRefreshUserBalance }: ExchangePageProps) => {
  const { toast } = useToast();
  const [buyPrices, setBuyPrices] = useState<Record<CryptoSymbol, number>>({
    BTC: 0, ETH: 0, BNB: 0, SOL: 0, XRP: 0, TRX: 0
  });
  const [sellPrices, setSellPrices] = useState<Record<CryptoSymbol, number>>({
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
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'withdraw'>('buy');

  useEffect(() => {
    loadPrices();
    loadBalances();
    
    const interval = setInterval(loadPrices, 180000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPrices();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      
      if (data.success && data.buy_prices && data.sell_prices) {
        setBuyPrices(data.buy_prices);
        setSellPrices(data.sell_prices);
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
    const price = buyPrices[selectedCrypto];
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
    const price = sellPrices[selectedCrypto];
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
          crypto_price: buyPrices[selectedCrypto]
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Обмен выполнен!',
          description: `Вы обменяли ${usdt} USDT на ${data.crypto_received} ${selectedCrypto}`
        });
        
        setTimeout(() => {
          triggerUserSync();
          if (onRefreshUserBalance) {
            onRefreshUserBalance();
          }
          loadBalances();
        }, 5000);
        
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
          crypto_price: sellPrices[selectedCrypto]
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '✅ Обмен выполнен!',
          description: `Вы обменяли ${crypto} ${selectedCrypto} на ${data.usdt_received} USDT`
        });
        
        setTimeout(() => {
          triggerUserSync();
          if (onRefreshUserBalance) {
            onRefreshUserBalance();
          }
          loadBalances();
        }, 5000);
        
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
        
        setTimeout(() => {
          triggerUserSync();
          if (onRefreshUserBalance) {
            onRefreshUserBalance();
          }
          loadBalances();
        }, 5000);
        
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

  const currentBuyPrice = buyPrices[selectedCrypto];
  const currentSellPrice = sellPrices[selectedCrypto];
  const currentBalance = balances[selectedCrypto];
  const cryptoInfo = CRYPTO_INFO[selectedCrypto];

  const getTotalBalanceUSD = () => {
    let total = Number(user.balance || 0);
    Object.keys(CRYPTO_INFO).forEach(symbol => {
      const cryptoSymbol = symbol as CryptoSymbol;
      total += balances[cryptoSymbol] * sellPrices[cryptoSymbol];
    });
    return total;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Баланс */}
      <Card className="mb-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Общий баланс</p>
            <h2 className="text-3xl font-bold">${getTotalBalanceUSD().toFixed(2)}</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">USDT</p>
            <p className="text-xl font-semibold">${Number(user.balance || 0).toFixed(2)}</p>
          </div>
        </div>
      </Card>

      {/* Основная карточка */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell' | 'withdraw')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="buy" className="text-base">
              <Icon name="ArrowDownCircle" size={18} className="mr-2" />
              Купить
            </TabsTrigger>
            <TabsTrigger value="sell" className="text-base">
              <Icon name="ArrowUpCircle" size={18} className="mr-2" />
              Продать
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="text-base">
              <Icon name="Send" size={18} className="mr-2" />
              Вывести
            </TabsTrigger>
          </TabsList>

          {/* Выбор криптовалюты */}
          <div className="mb-6">
            <Label className="text-sm mb-2 block">Криптовалюта</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.keys(CRYPTO_INFO) as CryptoSymbol[]).map((symbol) => {
                const info = CRYPTO_INFO[symbol];
                const isActive = selectedCrypto === symbol;
                return (
                  <button
                    key={symbol}
                    onClick={() => activeTab !== 'withdraw' && setSelectedCrypto(symbol)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{info.emoji}</div>
                    <div className="text-xs font-semibold">{symbol}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <TabsContent value="buy" className="space-y-4 mt-0">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-muted-foreground">Вы платите</Label>
                <button 
                  onClick={handleMaxUsdt}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Макс: ${Number(user.balance || 0).toFixed(2)}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={usdtAmount}
                  onChange={(e) => handleUsdtToCryptoChange(e.target.value)}
                  className="text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
                <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 min-w-[100px]">
                  <Icon name="DollarSign" size={20} className="text-green-500" />
                  <span className="font-semibold">USDT</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <div className="bg-background border-4 border-card rounded-full p-2">
                <Icon name="ArrowDown" size={24} className="text-primary" />
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-muted-foreground">Вы получите</Label>
                <span className="text-xs text-muted-foreground">
                  Курс: ${currentBuyPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={cryptoAmount}
                  readOnly
                  className="text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 min-w-[100px] ${cryptoInfo.bgColor}`}>
                  <span className="text-xl">{cryptoInfo.emoji}</span>
                  <span className="font-semibold">{selectedCrypto}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleBuyCrypto} 
              disabled={loading || priceLoading || !usdtAmount}
              size="lg"
              className="w-full text-lg h-14"
            >
              {loading ? 'Обработка...' : `Купить ${selectedCrypto}`}
            </Button>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 mt-0">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-muted-foreground">Вы продаёте</Label>
                <button 
                  onClick={handleMaxCrypto}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Баланс: {currentBalance.toFixed(cryptoInfo.decimals)} {selectedCrypto}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cryptoAmount}
                  onChange={(e) => handleCryptoToUsdtChange(e.target.value)}
                  className="text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 min-w-[100px] ${cryptoInfo.bgColor}`}>
                  <span className="text-xl">{cryptoInfo.emoji}</span>
                  <span className="font-semibold">{selectedCrypto}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <div className="bg-background border-4 border-card rounded-full p-2">
                <Icon name="ArrowDown" size={24} className="text-primary" />
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-xs text-muted-foreground">Вы получите</Label>
                <span className="text-xs text-muted-foreground">
                  Курс: ${currentSellPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={usdtAmount}
                  readOnly
                  className="text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
                <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 min-w-[100px]">
                  <Icon name="DollarSign" size={20} className="text-green-500" />
                  <span className="font-semibold">USDT</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSellCrypto} 
              disabled={loading || priceLoading || !cryptoAmount}
              size="lg"
              className="w-full text-lg h-14"
            >
              {loading ? 'Обработка...' : `Продать ${selectedCrypto}`}
            </Button>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4 mt-0">
            <div className="space-y-4">
              <div>
                <Label className="mb-2">Выберите криптовалюту</Label>
                <Select 
                  value={withdrawCrypto} 
                  onValueChange={(v) => setWithdrawCrypto(v as CryptoSymbol)}
                >
                  <SelectTrigger className="h-14">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CRYPTO_INFO) as CryptoSymbol[]).map((symbol) => {
                      const info = CRYPTO_INFO[symbol];
                      return (
                        <SelectItem key={symbol} value={symbol}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{info.emoji}</span>
                            <div>
                              <div className="font-semibold">{symbol}</div>
                              <div className="text-xs text-muted-foreground">
                                Баланс: {balances[symbol].toFixed(info.decimals)}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2">Адрес кошелька</Label>
                <Input
                  placeholder="Введите адрес получателя"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="h-14"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Сумма</Label>
                  <span className="text-xs text-muted-foreground">
                    Мин: {CRYPTO_INFO[withdrawCrypto].minAmount * 10} {withdrawCrypto}
                  </span>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="h-14 text-lg"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2">
                  <Icon name="Info" size={16} className="mt-0.5 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Вывод обрабатывается вручную в течение 24 часов
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleWithdraw}
                disabled={withdrawLoading || !withdrawAddress || !withdrawAmount}
                size="lg"
                className="w-full text-lg h-14"
              >
                {withdrawLoading ? 'Отправка...' : 'Создать заявку на вывод'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Крипто-балансы */}
      <div className="mt-6 grid gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground px-2">Ваши активы</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(CRYPTO_INFO) as CryptoSymbol[]).map((symbol) => {
            const info = CRYPTO_INFO[symbol];
            const balance = balances[symbol];
            const valueUSD = balance * sellPrices[symbol];
            
            return (
              <Card key={symbol} className={`p-4 ${info.bgColor} border-primary/10`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{info.emoji}</span>
                    <div>
                      <p className="font-semibold">{symbol}</p>
                      <p className="text-xs text-muted-foreground">{info.name}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold">{balance.toFixed(info.decimals)}</p>
                  <p className="text-sm text-muted-foreground">≈ ${valueUSD.toFixed(2)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Диалог подтверждения */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите операцию</DialogTitle>
            <DialogDescription>
              {confirmAction === 'buy' ? (
                <>Вы покупаете {cryptoAmount} {selectedCrypto} за {usdtAmount} USDT</>
              ) : (
                <>Вы продаёте {cryptoAmount} {selectedCrypto} за {usdtAmount} USDT</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Курс</span>
              <span className="font-semibold">
                ${confirmAction === 'buy' ? currentBuyPrice.toFixed(2) : currentSellPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Обновление через</span>
              <span className="font-semibold">{priceUpdateTimer}с</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Отмена
            </Button>
            <Button onClick={confirmAction === 'buy' ? confirmBuyCrypto : confirmSellCrypto}>
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExchangePage;
