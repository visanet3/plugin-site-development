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
import { CryptoDropdown, CryptoOption } from '@/components/ui/crypto-dropdown';
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
  XRP: { name: 'Ripple', icon: 'Waves', emoji: '✕', logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', decimals: 4, minAmount: 1 },
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

  useEffect(() => {
    loadPrices();
    loadBalances();
    const interval = setInterval(loadPrices, 60000);
    return () => clearInterval(interval);
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
          crypto_price: sellPrices[selectedCrypto]
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <Icon name="ArrowLeftRight" size={28} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Обменник криптовалют</h1>
            <p className="text-sm text-muted-foreground">Мгновенный обмен и вывод</p>
          </div>
        </div>
        
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Общий баланс</p>
            <p className="text-2xl font-bold text-green-400">
              ${getTotalBalanceUSD().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
      </div>

      {/* Balances Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Wallet" size={20} className="text-primary" />
          Ваши балансы
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* USDT Balance */}
          <Card className="p-4 hover:shadow-lg transition-all duration-300 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center p-1.5">
                  <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" alt="Tether" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-semibold">USDT</p>
                  <p className="text-xs text-muted-foreground">Tether</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xl font-bold">{Number(user.balance || 0).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ ${Number(user.balance || 0).toFixed(2)}
              </p>
            </div>
          </Card>

          {/* Crypto Balances */}
          {(Object.keys(CRYPTO_INFO) as CryptoSymbol[]).map(symbol => {
            const info = CRYPTO_INFO[symbol];
            const balance = balances[symbol];
            const price = sellPrices[symbol];
            const usdValue = balance * price;
            
            return (
              <Card 
                key={symbol} 
                className={`p-4 hover:shadow-lg transition-all duration-300 border-opacity-20 bg-gradient-to-br from-opacity-5 to-transparent ${
                  symbol === 'BTC' ? 'border-orange-500/20' :
                  symbol === 'ETH' ? 'border-purple-500/20' :
                  symbol === 'BNB' ? 'border-yellow-500/20' :
                  symbol === 'SOL' ? 'border-blue-500/20' :
                  symbol === 'XRP' ? 'border-cyan-500/20' :
                  'border-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl ${info.bgColor} flex items-center justify-center p-1.5`}>
                      <img src={info.logo} alt={info.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="font-semibold">{symbol}</p>
                      <p className="text-xs text-muted-foreground">{info.name}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold">{balance.toFixed(info.decimals)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Exchange Interface */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Exchange Card */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="buy" className="text-base">
                <Icon name="TrendingUp" size={18} className="mr-2" />
                Купить
              </TabsTrigger>
              <TabsTrigger value="sell" className="text-base">
                <Icon name="TrendingDown" size={18} className="mr-2" />
                Продать
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="text-base">
                <Icon name="Send" size={18} className="mr-2" />
                Вывести
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-6">
              <Card className="p-6 bg-gradient-to-br from-green-500/5 to-transparent">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base">Выберите криптовалюту</Label>
                    <CryptoDropdown
                      options={Object.keys(CRYPTO_INFO).map(symbol => {
                        const info = CRYPTO_INFO[symbol as CryptoSymbol];
                        return {
                          id: symbol,
                          label: symbol,
                          name: info.name,
                          logo: info.logo,
                          price: buyPrices[symbol as CryptoSymbol],
                          color: info.color.replace('text-', '')
                        };
                      })}
                      value={selectedCrypto}
                      onValueChange={(v) => setSelectedCrypto(v as CryptoSymbol)}
                      showPrices={true}
                      priceLoading={priceLoading}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-base">Вы отдаёте</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Доступно: {Number(user.balance || 0).toFixed(2)} USDT
                          </span>
                          <Button variant="outline" size="sm" onClick={handleMaxUsdt} className="h-8 px-3">
                            MAX
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={usdtAmount}
                          onChange={(e) => handleUsdtToCryptoChange(e.target.value)}
                          placeholder="0.00"
                          className="h-14 text-xl pl-12"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" alt="Tether" className="w-5 h-5 object-contain" />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <span className="text-lg font-semibold text-muted-foreground">USDT</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-background">
                        <Icon name="ArrowDown" size={24} className="text-primary" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-base mb-2 block">Вы получите</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={cryptoAmount}
                          readOnly
                          placeholder={`0.${'0'.repeat(cryptoInfo.decimals)}`}
                          className="h-14 text-xl pl-12 bg-muted/50"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <Icon name={cryptoInfo.icon as any} size={20} className={cryptoInfo.color} />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <span className="text-lg font-semibold text-muted-foreground">{selectedCrypto}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Курс покупки:</span>
                      <span className="font-semibold">1 {selectedCrypto} = ${currentBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Комиссия сервиса:</span>
                      <span className="font-semibold text-orange-400">+2%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Минимум:</span>
                      <span className="font-semibold">10 USDT</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBuyCrypto}
                    disabled={loading || !usdtAmount || parseFloat(usdtAmount) < 10 || priceLoading}
                    className="w-full h-12 text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {loading ? (
                      <>
                        <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Icon name="ShoppingCart" size={20} className="mr-2" />
                        Купить {selectedCrypto}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="sell" className="mt-6">
              <Card className="p-6 bg-gradient-to-br from-orange-500/5 to-transparent">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base">Выберите криптовалюту</Label>
                    <CryptoDropdown
                      options={Object.keys(CRYPTO_INFO).map(symbol => {
                        const info = CRYPTO_INFO[symbol as CryptoSymbol];
                        return {
                          id: symbol,
                          label: symbol,
                          name: info.name,
                          logo: info.logo,
                          price: sellPrices[symbol as CryptoSymbol],
                          color: info.color.replace('text-', '')
                        };
                      })}
                      value={selectedCrypto}
                      onValueChange={(v) => setSelectedCrypto(v as CryptoSymbol)}
                      showPrices={true}
                      priceLoading={priceLoading}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-base">Вы отдаёте</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Доступно: {currentBalance.toFixed(cryptoInfo.decimals)} {selectedCrypto}
                          </span>
                          <Button variant="outline" size="sm" onClick={handleMaxCrypto} className="h-8 px-3">
                            MAX
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={cryptoAmount}
                          onChange={(e) => handleCryptoToUsdtChange(e.target.value)}
                          placeholder={`0.${'0'.repeat(cryptoInfo.decimals)}`}
                          className="h-14 text-xl pl-12"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <img src={cryptoInfo.logo} alt={cryptoInfo.name} className="w-5 h-5 object-contain" />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <span className="text-lg font-semibold text-muted-foreground">{selectedCrypto}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-background">
                        <Icon name="ArrowDown" size={24} className="text-primary" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-base mb-2 block">Вы получите</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={usdtAmount}
                          readOnly
                          placeholder="0.00"
                          className="h-14 text-xl pl-12 bg-muted/50"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" alt="Tether" className="w-5 h-5 object-contain" />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <span className="text-lg font-semibold text-muted-foreground">USDT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Курс продажи:</span>
                      <span className="font-semibold">1 {selectedCrypto} = ${currentSellPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Комиссия сервиса:</span>
                      <span className="font-semibold text-orange-400">-2%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Минимум:</span>
                      <span className="font-semibold">{cryptoInfo.minAmount} {selectedCrypto}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSellCrypto}
                    disabled={loading || !cryptoAmount || parseFloat(cryptoAmount) < cryptoInfo.minAmount || priceLoading}
                    className="w-full h-12 text-base bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    {loading ? (
                      <>
                        <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Icon name="ArrowLeftRight" size={20} className="mr-2" />
                        Продать {selectedCrypto}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="withdraw" className="mt-6">
              <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-transparent">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-base">Выберите криптовалюту</Label>
                    <CryptoDropdown
                      options={Object.keys(CRYPTO_INFO).map(symbol => {
                        const info = CRYPTO_INFO[symbol as CryptoSymbol];
                        const balance = balances[symbol as CryptoSymbol];
                        return {
                          id: symbol,
                          label: symbol,
                          name: `Баланс: ${balance.toFixed(info.decimals)}`,
                          logo: info.logo,
                          color: info.color.replace('text-', '')
                        };
                      })}
                      value={withdrawCrypto}
                      onValueChange={(v) => setWithdrawCrypto(v as CryptoSymbol)}
                      showPrices={false}
                      priceLoading={false}
                    />
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">Адрес кошелька</Label>
                    <Input
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder={`Введите адрес ${withdrawCrypto}`}
                      className="h-12 font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Проверьте адрес перед отправкой. Транзакции необратимы.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base">Сумма</Label>
                      <span className="text-sm text-muted-foreground">
                        Доступно: {balances[withdrawCrypto].toFixed(CRYPTO_INFO[withdrawCrypto].decimals)} {withdrawCrypto}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder={`0.${'0'.repeat(CRYPTO_INFO[withdrawCrypto].decimals)}`}
                        className="h-12 text-lg pl-12"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <img src={CRYPTO_INFO[withdrawCrypto].logo} alt={CRYPTO_INFO[withdrawCrypto].name} className="w-5 h-5 object-contain" />
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <span className="font-semibold text-muted-foreground">{withdrawCrypto}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Минимум для вывода:</span>
                      <span className="font-semibold">{CRYPTO_INFO[withdrawCrypto].minAmount * 10} {withdrawCrypto}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Комиссия сети:</span>
                      <span className="font-semibold text-orange-400">~{CRYPTO_INFO[withdrawCrypto].minAmount} {withdrawCrypto}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Время обработки:</span>
                      <span className="font-semibold">До 24 часов</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawLoading || !withdrawAddress || !withdrawAmount}
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {withdrawLoading ? (
                      <>
                        <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Icon name="Send" size={20} className="mr-2" />
                        Вывести {withdrawCrypto}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          {/* Live Prices */}
          <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="TrendingUp" size={20} className="text-blue-500" />
              <h3 className="font-semibold">Текущие курсы</h3>
            </div>
            <div className="space-y-3">
              {(Object.keys(CRYPTO_INFO) as CryptoSymbol[]).map(symbol => {
                const info = CRYPTO_INFO[symbol];
                const buyPrice = buyPrices[symbol];
                const sellPrice = sellPrices[symbol];
                return (
                  <div key={symbol} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <img src={info.logo} alt={info.name} className="w-4 h-4 object-contain" />
                      <span className="font-medium text-sm">{symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-xs text-green-400">
                        {priceLoading ? '...' : `↑ $${buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      </div>
                      <div className="font-semibold text-xs text-orange-400">
                        {priceLoading ? '...' : `↓ $${sellPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Обновляется каждую минуту
            </p>
          </Card>

          {/* Info */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Info" size={20} className="text-primary" />
              <h3 className="font-semibold">Информация</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                <span>Мгновенный обмен по рыночному курсу</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                <span>Спред покупки/продажи 2%</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                <span>Поддержка 6 криптовалют</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                <span>Вывод в течение 24 часов</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="text-green-400 mt-0.5" />
                <span>Безопасные транзакции</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Icon name="AlertCircle" size={24} className="text-orange-500" />
              Подтверждение обмена
            </DialogTitle>
            <DialogDescription>
              Проверьте детали перед подтверждением
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${priceUpdateTimer > 10 ? 'bg-green-500 animate-pulse' : 'bg-orange-500 animate-pulse'}`} />
                <span className="text-sm font-medium">
                  {priceUpdateTimer > 10 ? 'Курс актуален' : 'Обновление...'}
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
                  ${confirmAction === 'buy' ? currentBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : currentSellPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
              <p>Курс зафиксирован на 1 минуту. После обновится автоматически.</p>
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
              <Icon name="Check" size={18} className="mr-2" />
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExchangePage;