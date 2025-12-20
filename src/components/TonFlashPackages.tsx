import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface TonFlashPackagesProps {
  user: User | null;
  onShowAuthDialog: () => void;
}

interface Package {
  id: number;
  name: string;
  price: number;
  amount: number;
  popular?: boolean;
}

const packages: Package[] = [
  { id: 1, name: 'Стартовый', price: 2470, amount: 10000 },
  { id: 2, name: 'Базовый', price: 4850, amount: 25000 },
  { id: 3, name: 'Стандарт', price: 9500, amount: 50000, popular: true },
  { id: 4, name: 'Профи', price: 18500, amount: 100000 },
  { id: 5, name: 'Бизнес', price: 36000, amount: 200000 },
  { id: 6, name: 'Премиум', price: 70000, amount: 400000 },
  { id: 7, name: 'Элит', price: 135000, amount: 800000 },
  { id: 8, name: 'VIP', price: 260000, amount: 1500000 },
  { id: 9, name: 'Платина', price: 500000, amount: 3000000 },
  { id: 10, name: 'Бриллиант', price: 950000, amount: 6000000 },
  { id: 11, name: 'Королевский', price: 1800000, amount: 12000000 },
  { id: 12, name: 'Императорский', price: 3400000, amount: 25000000 },
  { id: 13, name: 'Легендарный', price: 6500000, amount: 50000000 }
];

export const TonFlashPackages = ({ user, onShowAuthDialog }: TonFlashPackagesProps) => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const handlePurchase = (pkg: Package) => {
    if (!user) {
      onShowAuthDialog();
      return;
    }
    setSelectedPackage(pkg);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
      {/* Заголовок */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <Icon name="Gem" size={32} className="text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            TON Flash USDT
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Приобретайте Flash USDT на базе блокчейна TON с мгновенной активацией
        </p>
      </div>

      {/* Сетка пакетов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative group rounded-xl border transition-all duration-300 overflow-hidden ${
              pkg.popular
                ? 'border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-purple-500/10 shadow-lg shadow-blue-500/20'
                : 'border-border bg-card/50 hover:border-blue-500/30 hover:shadow-md'
            }`}
          >
            {pkg.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                Популярный
              </div>
            )}

            <div className="p-5">
              {/* Название пакета */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${
                  pkg.popular 
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
                    : 'bg-muted'
                }`}>
                  <Icon 
                    name={pkg.id <= 3 ? 'Package' : pkg.id <= 6 ? 'Award' : pkg.id <= 9 ? 'Crown' : 'Sparkles'} 
                    size={20} 
                    className={pkg.popular ? 'text-blue-400' : 'text-muted-foreground'}
                  />
                </div>
                <h3 className={`font-bold text-lg ${pkg.popular ? 'text-blue-400' : ''}`}>
                  {pkg.name}
                </h3>
              </div>

              {/* Сумма */}
              <div className="mb-4 p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Получите</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatNumber(pkg.amount)} <span className="text-base text-muted-foreground">USDT</span>
                </div>
              </div>

              {/* Цена */}
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Стоимость</div>
                <div className="text-xl font-bold">
                  {formatNumber(pkg.price)} <span className="text-sm text-muted-foreground">USDT</span>
                </div>
              </div>

              {/* Процент экономии */}
              <div className="mb-4 flex items-center gap-2 text-sm">
                <Icon name="TrendingUp" size={16} className="text-green-400" />
                <span className="text-green-400 font-medium">
                  +{Math.round((pkg.amount / pkg.price - 1) * 100)}% к сумме
                </span>
              </div>

              {/* Кнопка покупки */}
              <Button
                onClick={() => handlePurchase(pkg)}
                className={`w-full ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                    : ''
                }`}
                variant={pkg.popular ? 'default' : 'outline'}
              >
                <Icon name="ShoppingCart" size={16} />
                Приобрести
              </Button>
            </div>

            {/* Анимированный градиент на hover */}
            {!pkg.popular && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}
          </div>
        ))}
      </div>

      {/* Информационные блоки */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <div className="p-5 rounded-xl bg-card/50 border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Icon name="Zap" size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Мгновенная активация</h3>
              <p className="text-sm text-muted-foreground">
                Токены активируются сразу после оплаты
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card/50 border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Icon name="Shield" size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Безопасность TON</h3>
              <p className="text-sm text-muted-foreground">
                Работа на защищенном блокчейне TON
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card/50 border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Icon name="HeadphonesIcon" size={24} className="text-green-400" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Поддержка 24/7</h3>
              <p className="text-sm text-muted-foreground">
                Помощь на всех этапах использования
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно покупки */}
      {selectedPackage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelectedPackage(null)}
        >
          <div 
            className="bg-card border border-border rounded-2xl max-w-md w-full p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Покупка пакета</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPackage(null)}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                <div className="text-sm text-muted-foreground mb-2">Пакет</div>
                <div className="text-xl font-bold text-blue-400 mb-3">{selectedPackage.name}</div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Получите:</span>
                    <span className="font-bold text-green-400">{formatNumber(selectedPackage.amount)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Стоимость:</span>
                    <span className="font-bold">{formatNumber(selectedPackage.price)} USDT</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Выгода:</span>
                    <span className="font-bold text-green-400">+{Math.round((selectedPackage.amount / selectedPackage.price - 1) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="text-sm text-muted-foreground mb-2">Для оплаты отправьте</div>
                <div className="font-mono text-lg font-bold mb-2">{formatNumber(selectedPackage.price)} USDT</div>
                <div className="text-xs text-muted-foreground mb-3">на адрес кошелька:</div>
                <div className="p-3 bg-background rounded-lg border border-border flex items-center gap-2">
                  <code className="text-xs flex-1 break-all">TON_WALLET_ADDRESS_HERE</code>
                  <Button size="sm" variant="ghost">
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Icon name="CheckCircle" size={16} />
                Подтвердить оплату
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setSelectedPackage(null)}>
                Отменить
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              После отправки средств нажмите "Подтвердить оплату"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TonFlashPackages;
