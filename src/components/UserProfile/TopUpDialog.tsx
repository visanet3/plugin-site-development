import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface TopUpDialogProps {
  open: boolean;
  isLoading: boolean;
  topUpAmount: string;
  onOpenChange: (open: boolean) => void;
  onAmountChange: (amount: string) => void;
  onTopUp: () => void;
}

export const TopUpDialog = ({
  open,
  isLoading,
  topUpAmount,
  onOpenChange,
  onAmountChange,
  onTopUp
}: TopUpDialogProps) => {
  const currentAmount = parseFloat(topUpAmount) || 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    onAmountChange(value || '0');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="space-y-2 md:space-y-4 pb-3 md:pb-6">
          <DialogTitle className="text-xl md:text-3xl font-bold">
            Пополнение баланса
          </DialogTitle>
          <DialogDescription className="text-xs md:text-base hidden md:block">
            Выберите сумму для пополнения вашего баланса USDT
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* Amount input */}
          <div className="space-y-3 md:space-y-4">
            <Label className="text-sm md:text-base font-medium">
              Введите сумму пополнения
            </Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={topUpAmount === '0' ? '' : topUpAmount}
                onChange={handleInputChange}
                placeholder="Введите сумму"
                className="h-14 md:h-16 text-lg md:text-2xl font-bold pr-20 text-center"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-base md:text-xl font-semibold text-primary pointer-events-none">
                USDT
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground text-center">
              Минимальная сумма: <span className="font-semibold text-foreground">100 USDT</span>
              {' • '}
              Максимальная: <span className="font-semibold text-foreground">300,000 USDT</span>
            </p>
          </div>

          {/* Info block */}
          <div className="flex items-start gap-3 text-xs md:text-sm text-muted-foreground bg-blue-500/5 rounded-lg p-3 md:p-4 border border-blue-500/20">
            <Icon name="Info" size={16} className="shrink-0 mt-0.5 text-blue-500 md:w-[18px] md:h-[18px]" />
            <div>
              <p className="font-medium text-foreground mb-1">Способ оплаты</p>
              <p className="text-[10px] md:text-xs">
                После подтверждения откроется окно с адресом кошелька для перевода USDT (TRC-20)
              </p>
            </div>
          </div>

          {/* Payment button */}
          <div className="space-y-2 md:space-y-3">
            <Button 
              onClick={onTopUp}
              disabled={isLoading || !topUpAmount || currentAmount < 100 || currentAmount > 300000}
              size="lg"
              className="w-full h-12 md:h-16 text-base md:text-lg font-bold"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Обработка платежа...</span>
                  <span className="sm:hidden">Обработка...</span>
                </>
              ) : (
                <>
                  <Icon name="ArrowRight" size={18} className="mr-2 md:w-5 md:h-5" />
                  {currentAmount > 0 ? (
                    <>
                      <span className="hidden sm:inline">Пополнить на {currentAmount.toLocaleString('ru-RU')} USDT</span>
                      <span className="sm:hidden">Пополнить {currentAmount.toLocaleString('ru-RU')}</span>
                    </>
                  ) : (
                    'Пополнить баланс'
                  )}
                </>
              )}
            </Button>
            
            {(currentAmount < 100 || currentAmount > 300000) && currentAmount > 0 && (
              <p className="text-[10px] md:text-xs text-center text-destructive">
                {currentAmount < 100 ? 'Минимальная сумма: 100 USDT' : 'Максимальная сумма: 300,000 USDT'}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};