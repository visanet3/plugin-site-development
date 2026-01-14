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
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  BTC: { name: 'Bitcoin', icon: 'Bitcoin', emoji: '₿', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg', color: 'text-orange-400', bgColor: 'bg-orange-500/10', decimals: 8, minAmount: 0.0001 },
  ETH: { name: 'Ethereum', icon: 'Gem', emoji: 'Ξ', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg', color: 'text-purple-400', bgColor: 'bg-purple-500/10', decimals: 6, minAmount: 0.001 },
  BNB: { name: 'BNB', icon: 'Coins', emoji: '◆', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', decimals: 5, minAmount: 0.01 },
  SOL: { name: 'Solana', icon: 'Zap', emoji: '◎', logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg', color: 'text-blue-400', bgColor: 'bg-blue-500/10', decimals: 5, minAmount: 0.01 },
  XRP: { name: 'Ripple', icon: 'Waves', emoji: '✕', logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg', color: 'text-cyan-300', bgColor: 'bg-cyan-400/15', decimals: 4, minAmount: 1 },
  TRX: { name: 'Tron', icon: 'Triangle', emoji: '▲', logo: 'https://cryptologos.cc/logos/tron-trx-logo.svg', color: 'text-red-400', bgColor: 'bg-red-500/10', decimals: 2, minAmount: 10 }
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
  
  const [priceHistory, setPriceHistory] = useState<Array<{time: string, price: number}>>([]);

  interface Transaction {
    id: string;
    type: 'buy' | 'sell' | 'withdraw';
    crypto: CryptoSymbol;
    amount: number;
    price: number;
    total: number;
    timestamp: Date;
    status: 'completed' | 'pending';
    address?: string;
  }

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadPrices();
    loadBalances();
    generatePriceHistory();
    
    const interval = setInterval(() => {
      loadPrices();
      generatePriceHistory();
    }, 180000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPrices();
        generatePriceHistory();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user.id]);

  useEffect(() => {
    generatePriceHistory();
  }, [selectedCrypto, buyPrices]);

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

  const generatePriceHistory = () => {
    const currentPrice = buyPrices[selectedCrypto];
    if (!currentPrice) return;
    
    const history = [];
    const now = Date.now();
    const volatility = 0.02;
    
    for (let i = 23; i >= 0; i--) {
      const variation = (Math.random() - 0.5) * volatility;
      const price = currentPrice * (1 + variation - (i * 0.001));
      const time = new Date(now - i * 60 * 60 * 1000);
      history.push({
        time: time.getHours() + ':00',
        price: Number(price.toFixed(2))
      });
    }
    
    setPriceHistory(history);
  };

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
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'sell',
          crypto: selectedCrypto,
          amount: crypto,
          price: sellPrices[selectedCrypto],
          total: data.usdt_received,
          timestamp: new Date(),
          status: 'completed'
        };
        setTransactions(prev => [newTransaction, ...prev]);

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
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'withdraw',
          crypto: withdrawCrypto,
          amount: amount,
          price: sellPrices[withdrawCrypto],
          total: amount * sellPrices[withdrawCrypto],
          timestamp: new Date(),
          status: 'pending',
          address: withdrawAddress
        };
        setTransactions(prev => [newTransaction, ...prev]);

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

  const priceChange24h = priceHistory.length > 1 
    ? ((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price) * 100 
    : 0;

  const getOrderBookData = () => {
    const spread = 0.001;
    const buyOrders = [];
    const sellOrders = [];
    
    for (let i = 0; i < 8; i++) {
      const buyPrice = currentBuyPrice * (1 - spread * (i + 1));
      const sellPrice = currentSellPrice * (1 + spread * (i + 1));
      const amount = (Math.random() * 2 + 0.5).toFixed(cryptoInfo.decimals);
      
      buyOrders.push({
        price: buyPrice.toFixed(2),
        amount: amount,
        total: (buyPrice * parseFloat(amount)).toFixed(2)
      });
      
      sellOrders.push({
        price: sellPrice.toFixed(2),
        amount: amount,
        total: (sellPrice * parseFloat(amount)).toFixed(2)
      });
    }
    
    return { buyOrders, sellOrders };
  };

  const { buyOrders, sellOrders } = getOrderBookData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-purple-500/5">
      <div className="border-b border-border/40 bg-gradient-to-r from-card/80 via-primary/10 to-card/80 backdrop-blur-md shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
                  <Icon name="TrendingUp" size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">Обменник</h1>
                  <p className="text-sm text-muted-foreground">Торговля криптовалютой</p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Общий баланс</p>
                <p className="text-xl font-bold">${getTotalBalanceUSD().toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">USDT</p>
                <p className="text-lg font-semibold text-green-500">${Number(user.balance || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-4 border-border/40">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={cryptoInfo.logo} alt={cryptoInfo.name} className="w-10 h-10" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{selectedCrypto}/USDT</h2>
                      <span className={`text-sm px-2 py-0.5 rounded ${priceChange24h >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{cryptoInfo.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">${currentBuyPrice.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">24ч Объём: ${(Math.random() * 1000000).toFixed(0)}</p>
                </div>
              </div>

              <div className="h-[280px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={priceChange24h >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={priceChange24h >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      domain={['dataMin - 100', 'dataMax + 100']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke={priceChange24h >= 0 ? "#22c55e" : "#ef4444"} 
                      strokeWidth={2}
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {(Object.keys(CRYPTO_INFO) as CryptoSymbol[]).map((symbol) => {
                  const info = CRYPTO_INFO[symbol];
                  const price = buyPrices[symbol];
                  const isActive = selectedCrypto === symbol;
                  
                  return (
                    <button
                      key={symbol}
                      onClick={() => setSelectedCrypto(symbol)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap transform hover:scale-105 ${
                        isActive 
                          ? 'border-primary bg-gradient-to-r from-primary/20 to-purple-500/20 shadow-lg shadow-primary/20' 
                          : 'border-border/40 hover:border-primary/50 hover:bg-gradient-to-r hover:from-muted/50 hover:to-primary/5'
                      }`}
                    >
                      <img src={info.logo} alt={info.name} className="w-6 h-6" />
                      <div className="text-left">
                        <p className="text-sm font-semibold">{symbol}</p>
                        <p className="text-xs text-muted-foreground">${price.toFixed(2)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4 border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell' | 'withdraw')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-11 mb-4 bg-gradient-to-r from-muted/50 to-primary/5">
                  <TabsTrigger value="buy" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-green-500 data-[state=active]:shadow-lg transition-all">
                    <Icon name="ArrowDownCircle" size={16} className="mr-2" />
                    Купить
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-red-500 data-[state=active]:shadow-lg transition-all">
                    <Icon name="ArrowUpCircle" size={16} className="mr-2" />
                    Продать
                  </TabsTrigger>
                  <TabsTrigger value="withdraw" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-purple-500/20 data-[state=active]:shadow-lg transition-all">
                    <Icon name="Send" size={16} className="mr-2" />
                    Вывести
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-3 mt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Доступно USDT</Label>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-semibold">{Number(user.balance || 0).toFixed(2)}</span>
                        <Icon name="DollarSign" size={16} className="text-green-500" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Курс покупки</Label>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-semibold">${currentBuyPrice.toFixed(2)}</span>
                        <Icon name="TrendingUp" size={16} className="text-primary" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <Label className="text-xs">Сумма USDT</Label>
                      <button 
                        onClick={handleMaxUsdt}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        MAX
                      </button>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={usdtAmount}
                      onChange={(e) => handleUsdtToCryptoChange(e.target.value)}
                      className="h-12 text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Минимум: 10 USDT</p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon name="ArrowDownUp" size={16} className="text-primary" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-1.5 block">Получите {selectedCrypto}</Label>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border-2 border-primary/30 shadow-lg">
                      <p className="text-2xl font-bold text-primary">
                        {cryptoAmount || '0'} {selectedCrypto}
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleBuyCrypto} 
                    disabled={loading || priceLoading || !usdtAmount}
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105"
                  >
                    {loading ? (
                      <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                    ) : (
                      <Icon name="ShoppingCart" size={20} className="mr-2" />
                    )}
                    Купить {selectedCrypto}
                  </Button>
                </TabsContent>

                <TabsContent value="sell" className="space-y-3 mt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Баланс {selectedCrypto}</Label>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-semibold">{currentBalance.toFixed(cryptoInfo.decimals)}</span>
                        <img src={cryptoInfo.logo} alt={cryptoInfo.name} className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Курс продажи</Label>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm font-semibold">${currentSellPrice.toFixed(2)}</span>
                        <Icon name="TrendingDown" size={16} className="text-red-500" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <Label className="text-xs">Количество {selectedCrypto}</Label>
                      <button 
                        onClick={handleMaxCrypto}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        MAX
                      </button>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={cryptoAmount}
                      onChange={(e) => handleCryptoToUsdtChange(e.target.value)}
                      className="h-12 text-lg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Минимум: {CRYPTO_INFO[selectedCrypto].minAmount} {selectedCrypto}
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
                      <Icon name="ArrowDownUp" size={16} className="text-white" />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs mb-1.5 block">Получите USDT</Label>
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 shadow-lg">
                      <p className="text-2xl font-bold text-green-500">
                        ${usdtAmount || '0.00'}
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSellCrypto} 
                    disabled={loading || priceLoading || !cryptoAmount}
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-red-500/50 transition-all transform hover:scale-105"
                  >
                    {loading ? (
                      <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                    ) : (
                      <Icon name="TrendingDown" size={20} className="mr-2" />
                    )}
                    Продать {selectedCrypto}
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4 mt-0">
                  <div>
                    <Label className="mb-2">Криптовалюта</Label>
                    <Select 
                      value={withdrawCrypto} 
                      onValueChange={(v) => setWithdrawCrypto(v as CryptoSymbol)}
                    >
                      <SelectTrigger className="h-12 border-2 hover:border-primary/50 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CRYPTO_INFO) as CryptoSymbol[]).map((symbol) => {
                          const info = CRYPTO_INFO[symbol];
                          return (
                            <SelectItem key={symbol} value={symbol}>
                              <div className="flex items-center gap-3">
                                <img src={info.logo} alt={info.name} className="w-6 h-6" />
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
                      className="h-12"
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
                      className="h-12 text-lg"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-lg p-4 shadow-lg">
                    <div className="flex gap-3">
                      <Icon name="Info" size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-semibold text-foreground mb-1">Важная информация</p>
                        <p>Вывод обрабатывается вручную в течение 24 часов. Убедитесь в правильности адреса!</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleWithdraw}
                    disabled={withdrawLoading || !withdrawAddress || !withdrawAmount}
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg hover:shadow-primary/50 transition-all transform hover:scale-105"
                  >
                    {withdrawLoading ? (
                      <Icon name="Loader2" size={20} className="animate-spin mr-2" />
                    ) : (
                      <Icon name="Send" size={20} className="mr-2" />
                    )}
                    Создать заявку на вывод
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="border-border/40">
              <div className="p-4 border-b border-border/40">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon name="BookOpen" size={18} />
                  Стакан заявок
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Цена (USDT)</span>
                      <span className="text-xs text-muted-foreground">Кол-во</span>
                    </div>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1">
                        {sellOrders.map((order, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-red-500/5">
                            <span className="text-red-500 font-mono">{order.price}</span>
                            <span className="text-muted-foreground font-mono">{order.amount}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="py-2 px-3 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg text-center shadow-lg border-2 border-primary/30">
                    <p className="text-lg font-bold">${currentBuyPrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Текущая цена</p>
                  </div>

                  <div>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1">
                        {buyOrders.map((order, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-green-500/5">
                            <span className="text-green-500 font-mono">{order.price}</span>
                            <span className="text-muted-foreground font-mono">{order.amount}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm">
              <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-transparent to-primary/5">
                <h3 className="font-semibold flex items-center gap-2">
                  <Icon name="Wallet" size={18} className="text-primary" />
                  Ваши активы
                </h3>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-2">
                  {(Object.keys(CRYPTO_INFO) as CryptoSymbol[]).map((symbol) => {
                    const info = CRYPTO_INFO[symbol];
                    const balance = balances[symbol];
                    const valueUSD = balance * sellPrices[symbol];
                    
                    return (
                      <div key={symbol} className="flex items-center justify-between p-3 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-purple-500/10 cursor-pointer transition-all hover:shadow-lg border border-transparent hover:border-primary/30 transform hover:scale-105">
                        <div className="flex items-center gap-3">
                          <img src={info.logo} alt={info.name} className="w-8 h-8" />
                          <div>
                            <p className="font-semibold text-sm">{symbol}</p>
                            <p className="text-xs text-muted-foreground">{info.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{balance.toFixed(info.decimals)}</p>
                          <p className="text-xs text-muted-foreground">${valueUSD.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-card via-card to-primary/5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="CheckCircle2" size={22} className="text-primary" />
              Подтверждение сделки
            </DialogTitle>
            <DialogDescription>
              Проверьте детали перед выполнением операции
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/50 to-primary/10 space-y-2 border-2 border-primary/20 shadow-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Операция</span>
                <span className={`font-semibold ${confirmAction === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                  {confirmAction === 'buy' ? 'Покупка' : 'Продажа'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Актив</span>
                <span className="font-semibold">{selectedCrypto}/USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Курс</span>
                <span className="font-semibold">
                  ${confirmAction === 'buy' ? currentBuyPrice.toFixed(2) : currentSellPrice.toFixed(2)}
                </span>
              </div>
              {confirmAction === 'buy' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Платите</span>
                    <span className="font-bold">{usdtAmount} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Получите</span>
                    <span className="font-bold text-green-500">{cryptoAmount} {selectedCrypto}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Продаёте</span>
                    <span className="font-bold">{cryptoAmount} {selectedCrypto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Получите</span>
                    <span className="font-bold text-green-500">{usdtAmount} USDT</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
              <span className="text-sm text-muted-foreground">Обновление курса через</span>
              <span className="text-lg font-bold text-primary">{priceUpdateTimer}с</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="flex-1">
              Отмена
            </Button>
            <Button 
              onClick={confirmAction === 'buy' ? confirmBuyCrypto : confirmSellCrypto}
              className={`flex-1 ${confirmAction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-card via-card to-primary/5">
          <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-transparent to-primary/5">
            <h3 className="font-semibold flex items-center gap-2 text-xl">
              <Icon name="History" size={22} className="text-primary" />
              История транзакций
            </h3>
          </div>
          <ScrollArea className="h-[500px]">
            <div className="p-4">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Icon name="FileText" size={48} className="text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">История транзакций пуста</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Совершите первую операцию</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const cryptoInfo = CRYPTO_INFO[tx.crypto];
                    const isWithdraw = tx.type === 'withdraw';
                    const isBuy = tx.type === 'buy';
                    const isSell = tx.type === 'sell';

                    return (
                      <div 
                        key={tx.id}
                        className="p-4 rounded-lg border-2 hover:shadow-lg transition-all bg-gradient-to-r from-card to-muted/20"
                        style={{
                          borderColor: isBuy ? 'rgba(34, 197, 94, 0.3)' : 
                                      isSell ? 'rgba(239, 68, 68, 0.3)' : 
                                      'rgba(168, 85, 247, 0.3)'
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isBuy ? 'bg-green-500/20' :
                              isSell ? 'bg-red-500/20' :
                              'bg-purple-500/20'
                            }`}>
                              <Icon 
                                name={isWithdraw ? 'Send' : isBuy ? 'TrendingUp' : 'TrendingDown'} 
                                size={20}
                                className={
                                  isBuy ? 'text-green-500' :
                                  isSell ? 'text-red-500' :
                                  'text-purple-500'
                                }
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">
                                  {isWithdraw ? 'Вывод' : isBuy ? 'Покупка' : 'Продажа'}
                                </span>
                                {tx.status === 'pending' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                                    В обработке
                                  </span>
                                )}
                                {tx.status === 'completed' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 border border-green-500/30">
                                    Выполнено
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                  <img src={cryptoInfo.logo} alt={tx.crypto} className="w-4 h-4" />
                                  <span className="font-mono">
                                    {tx.amount.toFixed(cryptoInfo.decimals)} {tx.crypto}
                                  </span>
                                  {!isWithdraw && (
                                    <>
                                      <span>×</span>
                                      <span>${tx.price.toFixed(2)}</span>
                                    </>
                                  )}
                                </div>
                                {tx.address && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Icon name="Wallet" size={12} />
                                    <span className="font-mono truncate max-w-[200px]">{tx.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              isBuy ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {isBuy ? '-' : '+'}{tx.total.toFixed(2)} USDT
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {tx.timestamp.toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default ExchangePage;