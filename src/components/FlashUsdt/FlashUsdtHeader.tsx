import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface FlashUsdtHeaderProps {
  onTestPurchase: () => void;
}

export const FlashUsdtHeader = ({ onTestPurchase }: FlashUsdtHeaderProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-yellow-800/20 via-yellow-900/10 to-background border border-yellow-800/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <Badge className="mb-3 sm:mb-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs sm:text-sm">
          <Icon name="Zap" size={14} className="mr-1 sm:w-4 sm:h-4" />
          Специальное предложение
        </Badge>
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent leading-tight">
              Flash USDT Token
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-3">
              Временный токен TRC20 со скидкой 76.6%
            </p>
            <div className="flex items-start gap-2 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
              <Icon name="Shield" size={18} className="text-blue-400 mt-0.5 flex-shrink-0 sm:w-5 sm:h-5" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-blue-300">Токен создан на прокси-контракте оригинального USDT TRC20</p>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] sm:text-xs text-yellow-400 bg-black/20 px-2 py-1 rounded font-mono">
                    TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Скопировать адрес контракта"
                  >
                    <Icon name="Copy" size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={onTestPurchase}
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg shadow-blue-500/30 w-full sm:w-auto text-sm sm:text-base"
            size="lg"
          >
            <Icon name="CircleDollarSign" size={18} className="mr-2 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Купить тестовую сумму (100 USDT)</span>
            <span className="sm:hidden">Тестовая покупка (100 USDT)</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="p-4 sm:p-5 md:p-6 bg-card/50 backdrop-blur border-yellow-500/20">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <Icon name="Percent" size={20} className="text-yellow-400 sm:w-6 sm:h-6" />
              <h3 className="text-base sm:text-lg font-semibold">Цена</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-400">20%</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">от номинала</p>
          </Card>
          
          <Card className="p-4 sm:p-5 md:p-6 bg-card/50 backdrop-blur border-yellow-500/20">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <Icon name="ShoppingCart" size={20} className="text-yellow-400 sm:w-6 sm:h-6" />
              <h3 className="text-base sm:text-lg font-semibold">Минимум</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-400">100K</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Flash USDT</p>
          </Card>
          
          <Card className="p-4 sm:p-5 md:p-6 bg-card/50 backdrop-blur border-yellow-500/20">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <Icon name="Clock" size={20} className="text-yellow-400 sm:w-6 sm:h-6" />
              <h3 className="text-base sm:text-lg font-semibold">Срок</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-400">120 дн.</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">после покупки</p>
          </Card>
        </div>
      </div>
    </div>
  );
};