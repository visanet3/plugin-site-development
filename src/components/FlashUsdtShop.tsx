import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FlashUsdtShopProps {
  user: User | null;
  onShowAuthDialog: () => void;
}

const FlashUsdtShop = ({ user, onShowAuthDialog }: FlashUsdtShopProps) => {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  const packages = [
    {
      id: 1,
      amount: 100000,
      price: 20000,
      discount: '80%',
      color: 'from-blue-600 to-blue-800',
      borderColor: 'border-blue-500/30',
      icon: 'Package',
      popular: false
    },
    {
      id: 2,
      amount: 500000,
      price: 100000,
      discount: '80%',
      color: 'from-purple-600 to-purple-800',
      borderColor: 'border-purple-500/30',
      icon: 'Boxes',
      popular: true
    },
    {
      id: 3,
      amount: 1000000,
      price: 200000,
      discount: '80%',
      color: 'from-orange-600 to-orange-800',
      borderColor: 'border-orange-500/30',
      icon: 'Warehouse',
      popular: false
    },
    {
      id: 4,
      amount: 5000000,
      price: 1000000,
      discount: '80%',
      color: 'from-red-600 to-red-800',
      borderColor: 'border-red-500/30',
      icon: 'Building',
      popular: false
    }
  ];

  const handlePurchase = (pkg: typeof packages[0]) => {
    if (!user) {
      onShowAuthDialog();
      return;
    }

    setSelectedPackage(pkg.id);
    toast({
      title: 'Покупка Flash USDT',
      description: `Вы выбрали пакет ${pkg.amount.toLocaleString('ru-RU')} Flash USDT за ${pkg.price.toLocaleString('ru-RU')} USDT. Для оформления заказа свяжитесь с администрацией.`
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-800/20 via-yellow-900/10 to-background border border-yellow-800/30 rounded-2xl p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <Badge className="mb-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Icon name="Zap" size={16} className="mr-1" />
            Специальное предложение
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Flash USDT Token
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Временный токен TRC20 со скидкой 80% от номинала
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/50 backdrop-blur border-yellow-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="Percent" size={24} className="text-yellow-400" />
                <h3 className="text-lg font-semibold">Цена</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-400">20%</p>
              <p className="text-sm text-muted-foreground mt-1">от номинальной стоимости</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur border-yellow-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="ShoppingCart" size={24} className="text-yellow-400" />
                <h3 className="text-lg font-semibold">Минимум</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-400">100,000</p>
              <p className="text-sm text-muted-foreground mt-1">Flash USDT к покупке</p>
            </Card>
            
            <Card className="p-6 bg-card/50 backdrop-blur border-yellow-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Icon name="Clock" size={24} className="text-yellow-400" />
                <h3 className="text-lg font-semibold">Срок жизни</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-400">120 дней</p>
              <p className="text-sm text-muted-foreground mt-1">после покупки</p>
            </Card>
          </div>
        </div>
      </div>

      <Card className="p-8 border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Info" size={28} className="text-yellow-400" />
          <h2 className="text-2xl font-bold">Что такое Flash USDT?</h2>
        </div>
        
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Flash USDT</strong> — это временный токен стандарта TRC20, полностью совместимый с экосистемой TRON. 
            Токен имеет ограниченный срок действия и автоматически исчезает через 120 дней после активации.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                <Icon name="CheckCircle2" size={20} className="text-green-400" />
                Преимущества
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Zap" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Мгновенная активация:</strong> Заходит на кошелек без добавления контракта</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Wallet" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Универсальность:</strong> Работает с биржами, DEX и TRC20 кошельками</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="DollarSign" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Выгодная цена:</strong> Всего 20% от номинальной стоимости USDT</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Rocket" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Быстрые транзакции:</strong> Скорость сети TRON (~3 секунды)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Coins" size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Низкие комиссии:</strong> Минимальные gas fees в сети TRON</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                <Icon name="AlertCircle" size={20} className="text-orange-400" />
                Важно знать
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Icon name="Clock" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Срок действия:</strong> Токен автоматически исчезает через 120 дней</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Shield" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Использование:</strong> Подходит для краткосрочных операций и тестирования</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="TrendingUp" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Торговля:</strong> Принимается на DEX и централизованных биржах</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="FileText" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Стандарт:</strong> Полная совместимость с TRC20 протоколом</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Ban" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Автоуничтожение:</strong> Невозможно продлить срок действия токена</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Доступные пакеты</h2>
            <p className="text-muted-foreground">Выберите количество Flash USDT для покупки</p>
          </div>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-lg px-4 py-2">
            Скидка 80%
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                pkg.popular ? 'ring-2 ring-yellow-500/50' : ''
              } ${selectedPackage === pkg.id ? 'ring-2 ring-green-500/50' : ''} ${pkg.borderColor}`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="bg-yellow-500 text-black rounded-tl-none rounded-br-none">
                    <Icon name="Star" size={14} className="mr-1" />
                    Популярный
                  </Badge>
                </div>
              )}

              <div className={`bg-gradient-to-br ${pkg.color} p-6 text-white`}>
                <Icon name={pkg.icon as any} size={48} className="mb-4 opacity-80" />
                <h3 className="text-3xl font-bold mb-2">
                  {pkg.amount.toLocaleString('ru-RU')}
                </h3>
                <p className="text-sm opacity-80">Flash USDT</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Номинал:</span>
                    <span className="font-semibold line-through text-muted-foreground">
                      ${pkg.amount.toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Скидка:</span>
                    <Badge variant="destructive">{pkg.discount}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold">Ваша цена:</span>
                    <span className="text-2xl font-bold text-green-400">
                      ${pkg.price.toLocaleString('ru-RU')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon name="Check" size={14} className="text-green-400" />
                    <span>Мгновенная активация</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" size={14} className="text-green-400" />
                    <span>120 дней использования</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" size={14} className="text-green-400" />
                    <span>Поддержка бирж и DEX</span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full bg-gradient-to-r ${pkg.color} hover:opacity-90`}
                >
                  <Icon name="ShoppingCart" size={16} className="mr-2" />
                  Купить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-8 border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="AlertTriangle" size={28} className="text-red-400" />
          <h2 className="text-2xl font-bold">Предупреждение</h2>
        </div>
        
        <div className="space-y-4 text-muted-foreground">
          <p>
            <strong className="text-foreground">Flash USDT — это временный токен.</strong> Перед покупкой убедитесь, что вы понимаете все условия:
          </p>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Токен автоматически исчезает через 120 дней после активации</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Невозможно конвертировать Flash USDT обратно в обычный USDT после покупки</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Используйте токен только для краткосрочных операций и тестирования</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Администрация не несет ответственности за убытки, связанные с истечением срока действия токена</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span>Минимальная сумма покупки: 100,000 Flash USDT (20,000 USDT)</span>
            </li>
          </ul>
        </div>
      </Card>

      <Card className="p-8 border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="HelpCircle" size={28} className="text-green-400" />
          <h2 className="text-2xl font-bold">Частые вопросы</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Icon name="CircleDot" size={16} className="text-green-400" />
              Как активировать Flash USDT?
            </h3>
            <p className="text-sm text-muted-foreground ml-6">
              После покупки токены автоматически появятся на вашем TRC20 кошельке. Добавление контракта не требуется.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Icon name="CircleDot" size={16} className="text-green-400" />
              На каких биржах принимается Flash USDT?
            </h3>
            <p className="text-sm text-muted-foreground ml-6">
              Токен совместим с любыми TRC20-кошельками, DEX-платформами и централизованными биржами, поддерживающими TRON.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Icon name="CircleDot" size={16} className="text-green-400" />
              Что происходит через 120 дней?
            </h3>
            <p className="text-sm text-muted-foreground ml-6">
              Токены автоматически уничтожаются и исчезают с вашего кошелька. Продление срока действия невозможно.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Icon name="CircleDot" size={16} className="text-green-400" />
              Для чего используется Flash USDT?
            </h3>
            <p className="text-sm text-muted-foreground ml-6">
              Идеально подходит для краткосрочной торговли, арбитража, тестирования DeFi-протоколов и временных операций.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FlashUsdtShop;
