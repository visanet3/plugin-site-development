import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface FlashBtcHeaderProps {
  onTestPurchase: () => void;
}

export const FlashBtcHeader = ({ onTestPurchase }: FlashBtcHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-background to-amber-500/5"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 p-8 lg:p-12 space-y-10">
        {/* Header */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
            <span className="text-sm font-medium text-orange-400">Активная акция</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Flash BTC
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Временный Bitcoin с максимальной скидкой до 86%
            </p>
          </div>

          {/* Info Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10">
              <Icon name="Bitcoin" size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Полная копия BTC</p>
              <p className="text-xs text-muted-foreground">Работает на всех биржах</p>
            </div>
          </div>

          <Button
            onClick={onTestPurchase}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-xl text-base font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
          >
            <Icon name="Sparkles" size={20} className="mr-2" />
            Тестовая покупка — 0.001 BTC
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-orange-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/10">
                <Icon name="TrendingDown" size={24} className="text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold">Скидка</h3>
            </div>
            <p className="text-4xl font-bold">до 86%</p>
            <p className="text-sm text-muted-foreground mt-2">от рыночной цены</p>
          </Card>
          
          <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-amber-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10">
                <Icon name="Package" size={24} className="text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold">Минимум</h3>
            </div>
            <p className="text-4xl font-bold">1 BTC</p>
            <p className="text-sm text-muted-foreground mt-2">Flash Bitcoin</p>
          </Card>
          
          <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-yellow-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-500/10">
                <Icon name="Clock" size={24} className="text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold">Срок</h3>
            </div>
            <p className="text-4xl font-bold">42 дн</p>
            <p className="text-sm text-muted-foreground mt-2">использования</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
