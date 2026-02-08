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
  soldOutDate?: string;
  vipOnly?: boolean;
}

interface FlashUsdtPackagesProps {
  packages: Package[];
  onPurchase: (pkg: Package) => void;
  selectedPackageId?: number | null;
  userHasVip?: boolean;
  onBuyVip?: () => void;
}

export const FlashUsdtPackages = ({ packages, onPurchase, selectedPackageId, userHasVip, onBuyVip }: FlashUsdtPackagesProps) => {
  const getAccentColor = (id: number) => {
    const colors = {
      1: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', hover: 'hover:border-blue-500/50' },
      2: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', hover: 'hover:border-purple-500/50' },
      3: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', hover: 'hover:border-orange-500/50' },
      4: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', hover: 'hover:border-red-500/50' },
      5: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', hover: 'hover:border-emerald-500/50' },
      6: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', hover: 'hover:border-cyan-500/50' },
      7: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', hover: 'hover:border-indigo-500/50' },
      8: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', hover: 'hover:border-pink-500/50' },
      9: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', hover: 'hover:border-violet-500/50' },
      10: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', hover: 'hover:border-amber-500/50' },
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
          const isDisabled = pkg.soldOut || (pkg.vipOnly && !userHasVip);
          
          return (
            <Card 
              key={pkg.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                isDisabled ? 'opacity-60' : 'hover:-translate-y-1 cursor-pointer'
              } border-border/50 ${!isDisabled && accent.hover}`}
            >
              {/* Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10 gap-2">
                {pkg.vipOnly && !pkg.soldOut && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-2.5 py-1">
                    <Icon name="Crown" size={12} className="mr-1" />
                    VIP
                  </Badge>
                )}
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
                      {pkg.amount >= 1000000 ? `${(pkg.amount / 1000000).toFixed(1)}M` : `${(pkg.amount / 1000).toFixed(0)}K`}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Flash USDT</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Pricing */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Номинал</span>
                    <span className="line-through text-muted-foreground">${pkg.amount.toLocaleString('ru-RU')}</span>
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
                    <span>120 дней использования</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${accent.bg}`}></div>
                    <span>Стандарт TRC20</span>
                  </div>
                </div>

                {/* Action */}
                {pkg.soldOut ? (
                  <Button disabled className="w-full" variant="secondary">
                    <Icon name="X" size={16} className="mr-2" />
                    Распродано
                  </Button>
                ) : pkg.vipOnly && !userHasVip ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-start gap-2">
                        <Icon name="Lock" size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-yellow-500">VIP доступ</p>
                          <p className="text-muted-foreground leading-relaxed">Требуется VIP статус</p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={onBuyVip} 
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                    >
                      <Icon name="Crown" size={16} className="mr-2" />
                      Купить VIP
                    </Button>
                  </div>
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