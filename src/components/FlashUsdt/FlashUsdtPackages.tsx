import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export interface Package {
  id: number;
  amount: number;
  price: number;
  discount: string;
  color: string;
  borderColor: string;
  icon: string;
  popular: boolean;
}

interface FlashUsdtPackagesProps {
  packages: Package[];
  onPurchase: (pkg: Package) => void;
  selectedPackageId?: number | null;
}

export const FlashUsdtPackages = ({ packages, onPurchase, selectedPackageId }: FlashUsdtPackagesProps) => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4 md:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">Доступные пакеты</h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Выберите количество Flash USDT</p>
        </div>
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs sm:text-sm md:text-base px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5">
          Скидка 76.6%
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id}
            className={`relative overflow-hidden transition-all duration-300 sm:hover:scale-105 ${
              pkg.popular ? 'ring-2 ring-yellow-500/50' : ''
            } ${selectedPackageId === pkg.id ? 'ring-2 ring-green-500/50' : ''} ${pkg.borderColor}`}
          >
            {pkg.popular && (
              <div className="absolute top-0 right-0 z-10">
                <Badge className="bg-yellow-500 text-black rounded-tl-none rounded-br-none text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                  <Icon name="Star" size={12} className="mr-0.5 sm:mr-1 sm:w-[14px] sm:h-[14px]" />
                  Популярный
                </Badge>
              </div>
            )}

            <div className={`bg-gradient-to-br ${pkg.color} p-3 sm:p-4 md:p-5 lg:p-6 text-white`}>
              <Icon name={pkg.icon as any} size={28} className="mb-2 sm:mb-3 md:mb-4 opacity-80 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12" />
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                {pkg.amount.toLocaleString('ru-RU')}
              </h3>
              <p className="text-[10px] sm:text-xs opacity-80">Flash USDT</p>
            </div>

            <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3">
              <div className="mb-2 sm:mb-3">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 w-full justify-center">
                  <Icon name="TrendingUp" size={10} className="mr-1 sm:w-3 sm:h-3" />
                  Подорожание из-за новогодних праздников
                </Badge>
              </div>
              
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Номинал:</span>
                  <span className="text-xs sm:text-sm font-semibold line-through text-muted-foreground">
                    ${pkg.amount.toLocaleString('ru-RU')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Скидка:</span>
                  <Badge variant="destructive" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">{pkg.discount}</Badge>
                </div>
                <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t">
                  <span className="text-xs sm:text-sm font-semibold">Ваша цена:</span>
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-400">
                    ${pkg.price.toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Icon name="Check" size={10} className="text-green-400 sm:w-3 sm:h-3" />
                  <span>Мгновенная активация</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="Check" size={10} className="text-green-400 sm:w-3 sm:h-3" />
                  <span>120 дней использования</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="Check" size={10} className="text-green-400 sm:w-3 sm:h-3" />
                  <span>Поддержка бирж и DEX</span>
                </div>
              </div>

              <Button
                onClick={() => onPurchase(pkg)}
                className={`w-full bg-gradient-to-r ${pkg.color} hover:opacity-90 text-xs sm:text-sm md:text-base py-2 sm:py-2.5`}
              >
                <Icon name="ShoppingCart" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                Купить
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};