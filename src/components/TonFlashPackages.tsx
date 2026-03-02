import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface TonFlashPackagesProps {
  user: User | null;
  onShowAuthDialog: () => void;
  onRefreshUserBalance?: () => void;
}

interface Package {
  id: number;
  name: string;
  price: number;
  amount: number;
  popular?: boolean;
  badge?: string;
  color?: string;
  isTest?: boolean;
  soldOut?: boolean;
}

const packages: Package[] = [
  { id: 0, name: 'Тестовый', price: 100, amount: 10, badge: '🧪 ТЕСТ', color: 'cyan', isTest: true },
  { id: 1, name: 'Стартовый', price: 2470, amount: 10000, color: 'blue' },
  { id: 2, name: 'Базовый', price: 4850, amount: 25000, color: 'blue' },
  { id: 3, name: 'Стандарт', price: 9500, amount: 50000, popular: true, color: 'purple' },
  { id: 4, name: 'Профи', price: 18500, amount: 100000, color: 'purple' },
  { id: 5, name: 'Бизнес', price: 36000, amount: 200000, color: 'violet' },
  { id: 6, name: 'Премиум', price: 70000, amount: 400000, color: 'violet' },
  { id: 7, name: 'Элит', price: 135000, amount: 800000, color: 'pink' },
  { id: 8, name: 'VIP', price: 260000, amount: 1500000, color: 'pink' },
  { id: 9, name: 'Платина', price: 500000, amount: 3000000, color: 'orange' },
  { id: 10, name: 'Бриллиант', price: 950000, amount: 6000000, color: 'orange' },
  { id: 11, name: 'Королевский', price: 1800000, amount: 12000000, color: 'amber' },
  { id: 12, name: 'Императорский', price: 3400000, amount: 25000000, color: 'amber' },
  { id: 13, name: 'Легендарный', price: 6500000, amount: 50000000, color: 'yellow' }
];

const getColorClasses = (color?: string, popular?: boolean, isTest?: boolean) => {
  if (isTest) {
    return {
      border: 'border-cyan-500/70 ring-4 ring-cyan-500/20',
      bg: 'bg-gradient-to-br from-cyan-500/30 via-cyan-400/20 to-cyan-500/10',
      icon: 'bg-gradient-to-br from-cyan-400/40 to-cyan-500/40',
      iconText: 'text-cyan-300',
      title: 'text-cyan-300',
      glow: 'shadow-2xl shadow-cyan-500/50',
      button: 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-600 hover:to-cyan-500',
      badge: 'bg-gradient-to-r from-cyan-500 to-cyan-400 animate-pulse'
    };
  }
  
  if (popular) {
    return {
      border: 'border-purple-500/50',
      bg: 'bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-transparent',
      icon: 'bg-gradient-to-br from-purple-500/30 to-blue-500/30',
      iconText: 'text-purple-400',
      title: 'text-purple-400',
      glow: 'shadow-xl shadow-purple-500/30',
      button: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600',
      badge: 'bg-gradient-to-r from-purple-500 to-blue-500'
    };
  }
  
  const colorMap: Record<string, any> = {
    cyan: {
      border: 'border-cyan-500/30',
      bg: 'bg-gradient-to-br from-cyan-500/10 to-transparent',
      icon: 'bg-cyan-500/20',
      iconText: 'text-cyan-400',
      title: 'text-cyan-400',
      glow: 'hover:shadow-lg hover:shadow-cyan-500/20',
      button: 'border-cyan-500/50 hover:bg-cyan-500/10',
      badge: 'bg-cyan-500'
    },
    blue: {
      border: 'border-blue-500/30',
      bg: 'bg-gradient-to-br from-blue-500/10 to-transparent',
      icon: 'bg-blue-500/20',
      iconText: 'text-blue-400',
      title: '',
      glow: 'hover:shadow-lg hover:shadow-blue-500/20',
      button: 'border-blue-500/50 hover:bg-blue-500/10',
      badge: 'bg-blue-500'
    },
    purple: {
      border: 'border-purple-500/30',
      bg: 'bg-gradient-to-br from-purple-500/10 to-transparent',
      icon: 'bg-purple-500/20',
      iconText: 'text-purple-400',
      title: '',
      glow: 'hover:shadow-lg hover:shadow-purple-500/20',
      button: 'border-purple-500/50 hover:bg-purple-500/10',
      badge: 'bg-purple-500'
    },
    violet: {
      border: 'border-violet-500/30',
      bg: 'bg-gradient-to-br from-violet-500/10 to-transparent',
      icon: 'bg-violet-500/20',
      iconText: 'text-violet-400',
      title: '',
      glow: 'hover:shadow-lg hover:shadow-violet-500/20',
      button: 'border-violet-500/50 hover:bg-violet-500/10',
      badge: 'bg-violet-500'
    },
    pink: {
      border: 'border-pink-500/30',
      bg: 'bg-gradient-to-br from-pink-500/10 to-transparent',
      icon: 'bg-pink-500/20',
      iconText: 'text-pink-400',
      title: '',
      glow: 'hover:shadow-lg hover:shadow-pink-500/20',
      button: 'border-pink-500/50 hover:bg-pink-500/10',
      badge: 'bg-pink-500'
    },
    orange: {
      border: 'border-orange-500/30',
      bg: 'bg-gradient-to-br from-orange-500/10 to-transparent',
      icon: 'bg-orange-500/20',
      iconText: 'text-orange-400',
      title: '',
      glow: 'hover:shadow-lg hover:shadow-orange-500/20',
      button: 'border-orange-500/50 hover:bg-orange-500/10',
      badge: 'bg-orange-500'
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-gradient-to-br from-amber-500/10 to-transparent',
      icon: 'bg-amber-500/20',
      iconText: 'text-amber-400',
      title: '',
      glow: 'hover:shadow-lg hover:shadow-amber-500/20',
      button: 'border-amber-500/50 hover:bg-amber-500/10',
      badge: 'bg-amber-500'
    },
    yellow: {
      border: 'border-yellow-500/30',
      bg: 'bg-gradient-to-br from-yellow-500/10 to-transparent',
      icon: 'bg-yellow-500/20',
      iconText: 'text-yellow-400',
      title: 'text-yellow-400',
      glow: 'hover:shadow-lg hover:shadow-yellow-500/20',
      button: 'border-yellow-500/50 hover:bg-yellow-500/10',
      badge: 'bg-yellow-500'
    }
  };

  return colorMap[color || 'blue'];
};

export const TonFlashPackages = ({ user, onShowAuthDialog, onRefreshUserBalance }: TonFlashPackagesProps) => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tonAddress, setTonAddress] = useState('');
  const { toast } = useToast();

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const handlePurchase = (pkg: Package) => {
    if (!user) {
      onShowAuthDialog();
      return;
    }
    setSelectedPackage(pkg);
    setTonAddress('');
  };

  const confirmPurchase = async () => {
    if (!user || !selectedPackage) return;

    if (!tonAddress.trim()) {
      toast({
        title: '❌ Укажите адрес',
        description: 'Введите адрес TON кошелька для получения Flash USDT',
        variant: 'destructive',
      });
      return;
    }

    if (!tonAddress.startsWith('UQ') && !tonAddress.startsWith('EQ')) {
      toast({
        title: '❌ Неверный формат адреса',
        description: 'Адрес TON должен начинаться с UQ или EQ',
        variant: 'destructive',
      });
      return;
    }

    if (user.balance < selectedPackage.price) {
      toast({
        title: '❌ Недостаточно средств',
        description: `На вашем балансе ${formatNumber(user.balance)} USDT, а требуется ${formatNumber(selectedPackage.price)} USDT`,
        variant: 'destructive',
      });
      return;
    }

    setIsPurchasing(true);

    try {
      const requestBody = {
        userId: user.id,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        amount: selectedPackage.amount,
        type: 'ton-flash',
        tonAddress: tonAddress.trim()
      };
      
      const response = await fetch('https://functions.poehali.dev/84036a5f-dd22-44dd-9e67-e79f064c620e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: '✅ Покупка успешна!',
          description: `${formatNumber(selectedPackage.amount)} TON Flash USDT отправлены на ваш адрес`,
        });
        setSelectedPackage(null);
        setTonAddress('');
        onRefreshUserBalance?.();
      } else {
        const errorMsg = data.error || data.details || 'Ошибка покупки';
        throw new Error(errorMsg);
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка покупки',
        description: error instanceof Error ? error.message : 'Попробуйте позже',
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Анимированный фон */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-10 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in relative">
        {/* Out of Stock Warning */}
        <div className="mb-4 sm:mb-6 md:mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 border-2 border-red-500/50 p-4 sm:p-5 md:p-6 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent"></div>
          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-red-500/20 border-2 border-red-500/50 shrink-0">
              <Icon name="AlertTriangle" size={20} className="text-red-400 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-xl font-bold text-red-400 mb-0.5 sm:mb-1">Товар закончился</h3>
              <p className="text-xs sm:text-sm text-red-300/80 leading-relaxed">Все пакеты TON Flash USDT временно недоступны. Технические специалисты работают над созданием нового товара.</p>
            </div>
          </div>
        </div>

        {/* Заголовок */}
        <div className="mb-12 relative overflow-hidden rounded-3xl">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          
          <div className="relative z-10 p-4 sm:p-8 md:p-10 lg:p-12 text-center space-y-4 sm:space-y-6">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1 sm:py-1.5">
              <Icon name="Gem" size={14} className="mr-1.5 sm:mr-2" />
              Премиум коллекция
            </Badge>
            
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent leading-tight">
                TON Flash USDT
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Премиальные пакеты Flash USDT на блокчейне TON
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-purple-400 font-medium">
                <span className="flex items-center gap-1">
                  <Icon name="Zap" size={16} />
                  Мгновенная активация
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="TrendingUp" size={16} />
                  Максимальная выгода
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Icon name="Shield" size={16} />
                  TON блокчейн
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Сетка пакетов */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mb-10">
          {packages.map((pkg) => {
            const colors = getColorClasses(pkg.color, pkg.popular, pkg.isTest);
            return (
              <div
                key={pkg.id}
                className={`relative group rounded-2xl border-2 transition-all duration-500 overflow-hidden backdrop-blur-sm ${colors.border} ${colors.bg} ${colors.glow}`}
              >
                {/* Бейдж */}
                {(pkg.popular || pkg.badge) && (
                  <div className={`absolute top-0 right-0 ${colors.badge} text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg z-10 ${pkg.isTest ? 'animate-pulse' : ''}`}>
                    {pkg.popular ? '🔥 ХИТ' : pkg.badge}
                  </div>
                )}

                <div className="p-4 sm:p-5 md:p-6">
                  {/* Иконка и название */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${colors.icon} backdrop-blur-sm transition-transform group-hover:scale-110 duration-300`}>
                      <Icon 
                        name={pkg.id === 0 ? 'TestTube' : pkg.id <= 3 ? 'Package' : pkg.id <= 6 ? 'Award' : pkg.id <= 9 ? 'Crown' : 'Sparkles'} 
                        size={24} 
                        className={colors.iconText}
                      />
                    </div>
                    <h3 className={`font-black text-xl ${colors.title}`}>
                      {pkg.name}
                    </h3>
                  </div>

                  {/* Получаемая сумма */}
                  <div className="mb-5 p-3 sm:p-5 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm shadow-inner overflow-hidden">
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Получите</div>
                    <div className="text-xl sm:text-3xl font-black text-green-400 flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                      <span className="truncate">{formatNumber(pkg.amount)}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground font-normal shrink-0">USDT</span>
                    </div>
                  </div>

                  {/* Стоимость */}
                  <div className="mb-4 pb-4 border-b border-white/5 overflow-hidden">
                    <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Стоимость</div>
                    <div className="text-xl sm:text-2xl font-bold flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                      <span className="truncate">{formatNumber(pkg.price)}</span>
                      <span className="text-xs sm:text-sm text-muted-foreground shrink-0">USDT</span>
                    </div>
                  </div>

                  {/* Выгода */}
                  <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <Icon name="TrendingUp" size={18} className="text-green-400 shrink-0" />
                    <span className="text-green-400 font-bold text-sm">
                      +{Math.round((pkg.amount / pkg.price - 1) * 100)}% выгода
                    </span>
                  </div>

                  {/* Кнопка */}
                  <Button
                    disabled
                    className="w-full h-12 text-base font-bold bg-gray-500 text-white opacity-50 cursor-not-allowed"
                  >
                    <Icon name="X" size={18} />
                    Нет в наличии
                  </Button>
                </div>

                {/* Эффект свечения при hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Преимущества */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 shrink-0">
                <Icon name="Zap" size={28} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Мгновенная активация</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Токены активируются автоматически сразу после покупки
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/30 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20 shrink-0">
                <Icon name="Shield" size={28} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Безопасность TON</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Работаем на защищенном и быстром блокчейне TON
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/30 backdrop-blur-sm hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-green-500/20 shrink-0">
                <Icon name="HeadphonesIcon" size={28} className="text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Поддержка 24/7</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Техническая помощь в любое время суток
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Модальное окно покупки */}
        {selectedPackage && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => !isPurchasing && setSelectedPackage(null)}
          >
            <div 
              className="bg-card/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-3xl max-w-md w-full p-8 animate-scale-in shadow-2xl shadow-purple-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Покупка пакета
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => !isPurchasing && setSelectedPackage(null)}
                  className="rounded-full hover:bg-white/10"
                  disabled={isPurchasing}
                >
                  <Icon name="X" size={24} />
                </Button>
              </div>

              <div className="space-y-5 mb-8">
                {/* Информация о пакете */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-transparent border-2 border-purple-500/50 shadow-xl">
                  <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Пакет</div>
                  <div className="text-2xl font-black text-purple-400 mb-5">{selectedPackage.name}</div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2 p-3 rounded-lg bg-black/30">
                      <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Получите:</span>
                      <span className="font-black text-sm sm:text-lg text-green-400 text-right">{formatNumber(selectedPackage.amount)} USDT</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 p-3 rounded-lg bg-black/30">
                      <span className="text-xs sm:text-sm text-muted-foreground shrink-0">Стоимость:</span>
                      <span className="font-bold text-sm sm:text-lg text-right">{formatNumber(selectedPackage.price)} USDT</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <span className="text-xs sm:text-sm font-semibold text-green-400 shrink-0">Выгода:</span>
                      <span className="font-black text-sm sm:text-lg text-green-400">+{Math.round((selectedPackage.amount / selectedPackage.price - 1) * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Адрес TON кошелька */}
                <div className="p-5 rounded-2xl bg-muted/50 border-2 border-border backdrop-blur-sm">
                  <label className="block text-sm font-semibold text-muted-foreground mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Wallet" size={16} />
                      Адрес TON кошелька
                    </div>
                  </label>
                  <input
                    type="text"
                    value={tonAddress}
                    onChange={(e) => setTonAddress(e.target.value)}
                    placeholder="UQxxx... или EQxxx..."
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border-2 border-white/10 focus:border-purple-500/50 transition-colors text-sm font-mono outline-none"
                    disabled={isPurchasing}
                  />
                  <p className="text-xs text-muted-foreground mt-2 flex items-start gap-2">
                    <Icon name="Info" size={12} className="shrink-0 mt-0.5" />
                    <span>Flash USDT будут отправлены на этот адрес</span>
                  </p>
                </div>

                {/* Баланс пользователя */}
                {user && (
                  <div className="p-5 rounded-2xl bg-muted/50 border-2 border-border backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground font-semibold">Ваш баланс:</span>
                      <span className={`font-black text-xl ${user.balance >= selectedPackage.price ? 'text-green-400' : 'text-red-400'}`}>
                        {formatNumber(user.balance)} USDT
                      </span>
                    </div>
                    {user.balance < selectedPackage.price && (
                      <div className="flex items-start gap-3 mt-4 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                        <Icon name="AlertCircle" size={20} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400 font-medium leading-relaxed">
                          Недостаточно средств. Необходимо пополнить баланс на <span className="font-bold">{formatNumber(selectedPackage.price - user.balance)} USDT</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Кнопки */}
              <div className="space-y-3">
                <Button 
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/30"
                  onClick={confirmPurchase}
                  disabled={isPurchasing || !user || user.balance < selectedPackage.price || !tonAddress.trim()}
                >
                  {isPurchasing ? (
                    <>
                      <Icon name="Loader2" size={20} className="animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Icon name="ShoppingCart" size={20} />
                      Купить за {formatNumber(selectedPackage.price)} USDT
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-2" 
                  onClick={() => setSelectedPackage(null)}
                  disabled={isPurchasing}
                >
                  Отменить
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-5 leading-relaxed">
                Оплата спишется с вашего баланса на сайте
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TonFlashPackages;