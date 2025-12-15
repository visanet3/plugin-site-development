import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Warp } from '@paper-design/shaders-react';

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
        {packages.map((pkg) => {
          const getGlowColor = (id: number): 'blue' | 'purple' | 'green' | 'orange' => {
            if (id === 1) return 'blue';
            if (id === 2) return 'purple';
            if (id === 3) return 'green';
            return 'orange';
          };

          const getBorderAndHover = (id: number) => {
            if (pkg.soldOut) return 'border-2 border-gray-600/30 opacity-70';
            if (id === 1) return 'border-2 border-cyan-400/30 hover:border-cyan-400/80 hover:shadow-2xl hover:shadow-cyan-400/40';
            if (id === 2) return 'border-2 border-purple-400/30 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-400/40';
            if (id === 3) return 'border-2 border-green-400/30 hover:border-green-400/80 hover:shadow-2xl hover:shadow-green-400/40';
            return 'border-2 border-orange-400/30 hover:border-orange-400/80 hover:shadow-2xl hover:shadow-orange-400/40';
          };
          
          return (
          <Card 
            key={pkg.id}
            className={`relative overflow-hidden transition-all duration-300 ${pkg.soldOut ? '' : 'hover:scale-105'} ${getBorderAndHover(pkg.id)} ${
              pkg.popular ? 'ring-2 ring-yellow-500/50' : ''
            } ${selectedPackageId === pkg.id ? 'ring-2 ring-green-500/50' : ''} group`}
          >
            {pkg.soldOut && (
              <div className="absolute top-0 right-0 z-10">
                <Badge className="bg-red-500 text-white rounded-tl-none rounded-br-none text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                  <Icon name="X" size={12} className="mr-0.5 sm:mr-1 sm:w-[14px] sm:h-[14px]" />
                  Распродано
                </Badge>
              </div>
            )}
            {pkg.vipOnly && !pkg.soldOut && (
              <div className="absolute top-0 left-0 z-10">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-tr-none rounded-bl-none text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold">
                  <Icon name="Crown" size={12} className="mr-0.5 sm:mr-1 sm:w-[14px] sm:h-[14px]" />
                  VIP
                </Badge>
              </div>
            )}
            {pkg.popular && !pkg.soldOut && (
              <div className="absolute top-0 right-0 z-10">
                <Badge className="bg-yellow-500 text-black rounded-tl-none rounded-br-none text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                  <Icon name="Star" size={12} className="mr-0.5 sm:mr-1 sm:w-[14px] sm:h-[14px]" />
                  Популярный
                </Badge>
              </div>
            )}

            <div className="relative overflow-hidden">
              <div className="absolute inset-0">
                <Warp
                  style={{ height: '100%', width: '100%' }}
                  proportion={0.3 + (pkg.id * 0.05)}
                  softness={0.8 + (pkg.id * 0.1)}
                  distortion={0.15 + (pkg.id * 0.02)}
                  swirl={0.6 + (pkg.id * 0.05)}
                  swirlIterations={8 + pkg.id}
                  shape={pkg.id % 2 === 0 ? 'checks' : 'dots'}
                  shapeScale={0.08 + (pkg.id * 0.01)}
                  scale={1}
                  rotation={0}
                  speed={0.5}
                  colors={[
                    pkg.id === 1 ? 'hsl(200, 100%, 25%)' : pkg.id === 2 ? 'hsl(280, 100%, 30%)' : pkg.id === 3 ? 'hsl(120, 100%, 25%)' : 'hsl(30, 100%, 35%)',
                    pkg.id === 1 ? 'hsl(180, 100%, 65%)' : pkg.id === 2 ? 'hsl(320, 100%, 60%)' : pkg.id === 3 ? 'hsl(140, 100%, 60%)' : 'hsl(50, 100%, 65%)',
                    pkg.id === 1 ? 'hsl(160, 90%, 35%)' : pkg.id === 2 ? 'hsl(340, 90%, 40%)' : pkg.id === 3 ? 'hsl(100, 90%, 30%)' : 'hsl(40, 90%, 40%)',
                    pkg.id === 1 ? 'hsl(190, 100%, 75%)' : pkg.id === 2 ? 'hsl(300, 100%, 70%)' : pkg.id === 3 ? 'hsl(130, 100%, 70%)' : 'hsl(45, 100%, 75%)'
                  ]}
                />
              </div>
              <div className="relative z-10 bg-black/70 p-3 sm:p-4 md:p-5 lg:p-6 text-white">
                <Icon name={pkg.icon as any} size={28} className="mb-2 sm:mb-3 md:mb-4 opacity-80 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                  {pkg.amount.toLocaleString('ru-RU')}
                </h3>
                <p className="text-[10px] sm:text-xs opacity-80">Flash USDT</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3">
              {pkg.soldOut ? (
                <div className="mb-2 sm:mb-3">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 w-full justify-center">
                    <Icon name="ShoppingBag" size={10} className="mr-1 sm:w-3 sm:h-3" />
                    Все пакеты выкуплены
                  </Badge>
                </div>
              ) : (
                <div className="mb-2 sm:mb-3">
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/40 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 w-full justify-center">
                    <Icon name="TrendingUp" size={10} className="mr-1 sm:w-3 sm:h-3" />
                    Подорожание из-за новогодних праздников
                  </Badge>
                </div>
              )}
              
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

              {pkg.soldOut ? (
                <div className="space-y-2">
                  <Button
                    disabled
                    className="w-full bg-gray-600 text-gray-300 cursor-not-allowed text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                  >
                    <Icon name="X" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                    Распродано
                  </Button>
                  {pkg.soldOutDate && (
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center">
                      Последний пакет выкуплен: {pkg.soldOutDate}
                    </p>
                  )}
                </div>
              ) : pkg.vipOnly && !userHasVip ? (
                <div className="space-y-2">
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3">
                    <div className="flex items-start gap-2">
                      <Icon name="Crown" size={16} className="text-yellow-500 shrink-0 mt-0.5 sm:w-5 sm:h-5" />
                      <div className="text-[10px] sm:text-xs">
                        <p className="font-semibold text-yellow-500 mb-1">Требуется VIP статус</p>
                        <p className="text-muted-foreground leading-relaxed">
                          Этот пакет доступен только для VIP-пользователей
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={onBuyVip}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                  >
                    <Icon name="Crown" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                    Купить VIP
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => onPurchase(pkg)}
                  className={`w-full bg-gradient-to-r ${pkg.color} hover:opacity-90 text-xs sm:text-sm md:text-base py-2 sm:py-2.5`}
                >
                  <Icon name="ShoppingCart" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
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