import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import { Boxes } from '@/components/ui/background-boxes';
import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TopUpDialogProps {
  open: boolean;
  isLoading: boolean;
  topUpAmount: string;
  onOpenChange: (open: boolean) => void;
  onAmountChange: (amount: string) => void;
  onTopUp: () => void;
}

const quickAmounts = [1000, 3500, 5000, 10000, 15000, 50000, 100000];

export const TopUpDialog = ({
  open,
  isLoading,
  topUpAmount,
  onOpenChange,
  onAmountChange,
  onTopUp
}: TopUpDialogProps) => {
  const [sliderValue, setSliderValue] = useState([parseFloat(topUpAmount) || 100]);

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    onAmountChange(value[0].toString());
  };

  const handleQuickAmount = (amount: number) => {
    setSliderValue([amount]);
    onAmountChange(amount.toString());
  };

  const currentAmount = parseFloat(topUpAmount) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden border-2 border-primary/20 bg-background/95 backdrop-blur-xl">
        {/* Animated background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-background via-background/80 to-background z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
          <Boxes />
        </div>

        <DialogHeader className="relative z-30 space-y-3">
          <DialogTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Пополнение баланса
          </DialogTitle>
          <DialogDescription className="text-base">
            Выберите сумму для пополнения вашего баланса
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 relative z-30">
          {/* Current amount display */}
          <motion.div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-teal-900/30 border border-green-500/30 p-6 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
            <Label className="text-sm text-muted-foreground mb-2 block relative z-10">Сумма пополнения</Label>
            <motion.div 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent relative z-10"
              key={currentAmount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {currentAmount.toLocaleString('ru-RU')} USDT
            </motion.div>
            <div className="text-xs text-muted-foreground mt-2 relative z-10">
              ≈ ${currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </motion.div>

          {/* Slider */}
          <div className="space-y-4 px-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100 USDT</span>
              <span>300,000 USDT</span>
            </div>
            <Slider
              value={sliderValue}
              onValueChange={handleSliderChange}
              min={100}
              max={300000}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground px-2">
              <span>Минимум</span>
              <span>Максимум</span>
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Быстрый выбор</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {quickAmounts.map((amount, index) => (
                <motion.div
                  key={amount}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAmount(amount)}
                    className={cn(
                      "w-full h-auto py-3 px-2 text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105",
                      currentAmount === amount 
                        ? "bg-gradient-to-r from-green-800 to-emerald-800 border-green-500 text-white shadow-lg shadow-green-500/30" 
                        : "hover:bg-green-900/20 hover:border-green-500/50"
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Icon name="Coins" size={16} className="sm:w-5 sm:h-5" />
                      <span>{(amount / 1000).toFixed(amount >= 1000 ? 0 : 1)}K</span>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Payment button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={onTopUp}
              disabled={isLoading || !topUpAmount || currentAmount < 100}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Icon name="Zap" size={20} className="mr-2" />
                  Пополнить на {currentAmount.toLocaleString('ru-RU')} USDT
                </>
              )}
            </Button>
          </motion.div>

          {/* Payment info */}
          <motion.div 
            className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-lg p-3 border border-primary/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Icon name="Info" size={14} className="shrink-0" />
            <p>
              После нажатия кнопки откроется окно с адресом для перевода USDT (TRC-20)
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
