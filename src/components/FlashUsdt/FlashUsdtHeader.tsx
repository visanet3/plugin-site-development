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
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 p-8 lg:p-12 space-y-10">
        {/* Header */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-400">Активная акция</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Flash USDT
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Временные токены TRC20 с максимальной скидкой до 84%
            </p>
          </div>

          {/* Contract Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10">
              <Icon name="Shield" size={20} className="text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Контракт TRC20</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-foreground">
                  TR7NH...jLj6t
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="Copy" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={onTestPurchase}
          size="lg"
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 rounded-xl text-base font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
        >
          <Icon name="Sparkles" size={20} className="mr-2" />
          Тестовая покупка — 100 USDT
        </Button>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10">
                <Icon name="TrendingDown" size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold">Скидка</h3>
            </div>
            <p className="text-4xl font-bold">до 84%</p>
            <p className="text-sm text-muted-foreground mt-2">от номинала</p>
          </Card>
          
          <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-500/10">
                <Icon name="Package" size={24} className="text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold">Минимум</h3>
            </div>
            <p className="text-4xl font-bold">100K</p>
            <p className="text-sm text-muted-foreground mt-2">Flash USDT</p>
          </Card>
          
          <Card className="p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10">
                <Icon name="Clock" size={24} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold">Срок</h3>
            </div>
            <p className="text-4xl font-bold">120 дн</p>
            <p className="text-sm text-muted-foreground mt-2">использования</p>
          </Card>
        </div>
      </div>
    </div>
  );
};