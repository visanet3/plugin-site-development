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
  soldOut?: boolean;
}

interface FlashBtcPackagesProps {
  packages: Package[];
  onPurchase: (pkg: Package) => void;
  selectedPackageId?: number | null;
}

export const FlashBtcPackages = ({ packages, onPurchase, selectedPackageId }: FlashBtcPackagesProps) => {
  const getAccentColor = (id: number) => {
    const colors = {
      1: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', hover: 'hover:border-orange-500/50' },
      2: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', hover: 'hover:border-amber-500/50' },
      3: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', hover: 'hover:border-yellow-500/50' },
      4: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', hover: 'hover:border-red-500/50' },
    };
    return colors[id as keyof typeof colors] || colors[1];
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Выберите пакет</h2>
        <p className="text-muted-foreground">Все пакеты с максимальной скидкой</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => {
          const accent = getAccentColor(pkg.id);
          const isDisabled = pkg.soldOut;
          
          return (
            <Card 
              key={pkg.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                isDisabled ? 'opacity-60' : 'hover:-translate-y-1 cursor-pointer'
              } border-border/50 ${!isDisabled && accent.hover}`}
            >
              {/* Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10 gap-2">
                {pkg.popular && !pkg.soldOut && (
                  <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 ml-auto">
                    <Icon name="TrendingUp" size={12} className="mr-1" />
                    Хит
                  </Badge>
                )}
                {pkg.soldOut && (
                  <Badge variant="destructive" className="text-xs px-2.5 py-1 ml-auto">
                    <Icon name="X" size={12} className="mr-1" />
                    Продано
                  </Badge>
                )}
              </div>

              {/* Header */}
              <div className={`relative ${accent.bg} border-b border-border/50 p-8 pt-16`}>
                <div className="text-center space-y-3">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${accent.bg} border ${accent.border}`}>
                    <Icon name={pkg.icon as any} size={28} className={accent.text} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">
                      {pkg.amount} BTC
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Flash Bitcoin</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Рыночная</span>
                    <span className="line-through text-muted-foreground">
                      ${(pkg.amount * 97000).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Скидка</span>
                    <Badge variant="destructive" className="font-bold">{pkg.discount}</Badge>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Цена</span>
                      <span className="text-2xl font-bold">${pkg.price.toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${accent.bg}`}></div>
                    <span>Мгновенная активация</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${accent.bg}`}></div>
                    <span>42 дня использования</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${accent.bg}`}></div>
                    <span>Работает везде</span>
                  </div>
                </div>

                {/* Action */}
                {pkg.soldOut ? (
                  <Button disabled className="w-full" variant="secondary">
                    <Icon name="X" size={16} className="mr-2" />
                    Распродано
                  </Button>
                ) : (
                  <Button 
                    onClick={() => onPurchase(pkg)} 
                    className={`w-full font-semibold ${accent.bg} ${accent.border} border hover:bg-opacity-20`}
                    variant="outline"
                  >
                    <Icon name="ShoppingCart" size={16} className="mr-2" />
                    Купить
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
