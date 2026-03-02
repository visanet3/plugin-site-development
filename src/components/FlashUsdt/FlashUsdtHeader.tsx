import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface FlashUsdtHeaderProps {
  onTestPurchase: () => void;
}

export const FlashUsdtHeader = ({ onTestPurchase }: FlashUsdtHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/50">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5"></div>
      <div className="absolute top-0 right-0 w-[250px] sm:w-[400px] md:w-[500px] h-[250px] sm:h-[400px] md:h-[500px] bg-emerald-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[250px] sm:w-[400px] md:w-[500px] h-[250px] sm:h-[400px] md:h-[500px] bg-teal-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-12 space-y-6 sm:space-y-8 md:space-y-10">
        {/* Header */}
        <div className="space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-emerald-400">Активная акция</span>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Flash USDT
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Временные токены TRC20 с максимальной скидкой до 84%
            </p>
          </div>

          {/* Contract Badge */}
          <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-2xl bg-card/50 border border-border backdrop-blur-sm max-w-full overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 shrink-0">
              <Icon name="Shield" size={16} className="text-blue-400" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Контракт TRC20</p>
              <div className="flex items-center gap-2">
                <code className="text-xs sm:text-sm font-mono text-foreground truncate">
                  TR7NH...jLj6t
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <Icon name="Copy" size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={onTestPurchase}
          size="lg"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 sm:px-8 py-4 sm:py-6 rounded-xl text-sm sm:text-base font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all w-full sm:w-auto"
        >
          <Icon name="Sparkles" size={18} className="mr-2" />
          Тестовая покупка — 100 USDT
        </Button>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
          <Card className="p-3 sm:p-4 md:p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-emerald-500/30 transition-all overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 mb-2 sm:mb-4">
              <div className="flex items-center justify-center w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-emerald-500/10 shrink-0">
                <Icon name="TrendingDown" size={14} className="text-emerald-400" />
              </div>
              <h3 className="text-xs sm:text-base md:text-lg font-semibold leading-tight">Скидка</h3>
            </div>
            <p className="text-xl sm:text-3xl md:text-4xl font-bold">84%</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 sm:mt-2 leading-tight">от номинала</p>
          </Card>
          
          <Card className="p-3 sm:p-4 md:p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-teal-500/30 transition-all overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 mb-2 sm:mb-4">
              <div className="flex items-center justify-center w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-teal-500/10 shrink-0">
                <Icon name="Package" size={14} className="text-teal-400" />
              </div>
              <h3 className="text-xs sm:text-base md:text-lg font-semibold leading-tight">Минимум</h3>
            </div>
            <p className="text-xl sm:text-3xl md:text-4xl font-bold">9.8K</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 sm:mt-2 leading-tight">Flash USDT</p>
          </Card>
          
          <Card className="p-3 sm:p-4 md:p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-cyan-500/30 transition-all overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 mb-2 sm:mb-4">
              <div className="flex items-center justify-center w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-cyan-500/10 shrink-0">
                <Icon name="Clock" size={14} className="text-cyan-400" />
              </div>
              <h3 className="text-xs sm:text-base md:text-lg font-semibold leading-tight">Срок</h3>
            </div>
            <p className="text-xl sm:text-3xl md:text-4xl font-bold">120</p>
            <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 sm:mt-2 leading-tight">дней</p>
          </Card>
        </div>
      </div>
    </div>
  );
};