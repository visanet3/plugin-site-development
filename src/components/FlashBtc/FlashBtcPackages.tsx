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
}

interface FlashBtcPackagesProps {
  packages: Package[];
  onPurchase: (pkg: Package) => void;
  selectedPackageId?: number | null;
}

export const FlashBtcPackages = ({ packages, onPurchase, selectedPackageId }: FlashBtcPackagesProps) => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4 md:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">Доступные пакеты</h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Выберите количество Flash BTC</p>
        </div>
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs sm:text-sm md:text-base px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5">
          Выгодные предложения
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {packages.map((pkg) => {
          const getBorderAndHover = (id: number) => {
            if (id === 1) return 'border-2 border-orange-400/30 hover:border-orange-400/80 hover:shadow-2xl hover:shadow-orange-400/40';
            if (id === 2) return 'border-2 border-purple-400/30 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-400/40';
            if (id === 3) return 'border-2 border-pink-400/30 hover:border-pink-400/80 hover:shadow-2xl hover:shadow-pink-400/40';
            return 'border-2 border-cyan-400/30 hover:border-cyan-400/80 hover:shadow-2xl hover:shadow-cyan-400/40';
          };
          
          return (
          <Card 
            key={pkg.id}
            className={`relative overflow-hidden transition-all duration-300 ${pkg.soldOut ? 'opacity-60' : 'hover:scale-105'} ${getBorderAndHover(pkg.id)} ${
              pkg.popular ? 'ring-2 ring-yellow-500/50' : ''
            } ${selectedPackageId === pkg.id ? 'ring-2 ring-green-500/50' : ''} ${pkg.soldOut ? 'grayscale' : ''} group`}
          >
            {pkg.soldOut && (
              <div className="absolute top-0 right-0 z-10">
                <Badge className="bg-red-600 text-white rounded-tl-none rounded-br-none text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                  <Icon name="XCircle" size={12} className="mr-0.5 sm:mr-1 sm:w-[14px] sm:h-[14px]" />
                  Распродано
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
                    pkg.id === 1 ? 'hsl(30, 100%, 35%)' : pkg.id === 2 ? 'hsl(250, 100%, 30%)' : pkg.id === 3 ? 'hsl(330, 100%, 30%)' : 'hsl(200, 100%, 25%)',
                    pkg.id === 1 ? 'hsl(50, 100%, 65%)' : pkg.id === 2 ? 'hsl(270, 100%, 65%)' : pkg.id === 3 ? 'hsl(350, 100%, 60%)' : 'hsl(180, 100%, 65%)',
                    pkg.id === 1 ? 'hsl(40, 90%, 40%)' : pkg.id === 2 ? 'hsl(260, 90%, 35%)' : pkg.id === 3 ? 'hsl(340, 90%, 35%)' : 'hsl(160, 90%, 35%)',
                    pkg.id === 1 ? 'hsl(45, 100%, 75%)' : pkg.id === 2 ? 'hsl(265, 100%, 70%)' : pkg.id === 3 ? 'hsl(345, 100%, 75%)' : 'hsl(190, 100%, 75%)'
                  ]}
                />
              </div>
              <div className="relative z-10 bg-black/70 p-3 sm:p-4 md:p-5 lg:p-6 text-white">
                <Icon name={pkg.icon as any} size={28} className="mb-2 sm:mb-3 md:mb-4 opacity-80 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 drop-shadow-lg" />
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                  {pkg.amount} BTC
                </h3>
                <p className="text-[10px] sm:text-xs opacity-80">Flash Bitcoin</p>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3">
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Номинал:</span>
                  <span className="text-xs sm:text-sm font-semibold line-through text-muted-foreground">
                    {pkg.amount} BTC
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
                  <span>42 дня использования</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon name="Check" size={10} className="text-green-400 sm:w-3 sm:h-3" />
                  <span>Поддержка бирж и кошельков</span>
                </div>
              </div>

              <Button
                onClick={() => !pkg.soldOut && onPurchase(pkg)}
                disabled={pkg.soldOut}
                className={`w-full bg-gradient-to-r ${pkg.color} hover:opacity-90 text-xs sm:text-sm md:text-base py-2 sm:py-2.5 ${pkg.soldOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {pkg.soldOut ? (
                  <>
                    <Icon name="XCircle" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                    Распродано
                  </>
                ) : (
                  <>
                    <Icon name="ShoppingCart" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                    Купить
                  </>
                )}
              </Button>
            </div>
          </Card>
          );
        })}
      </div>
    </div>
  );
};