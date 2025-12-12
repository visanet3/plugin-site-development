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

const quickAmounts = [30, 100, 500, 1000, 5000, 10000, 50000, 100000];

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

  const handleQuickAmount = (amount: number) => {
    onAmountChange(amount.toString());
  };

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000)}K`;
    return amount.toString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="space-y-2 md:space-y-3 pb-3 md:pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-primary/10 rounded-lg md:rounded-xl">
              <Icon name="Wallet" size={20} className="text-primary md:w-7 md:h-7" />
            </div>
            <div>
              <DialogTitle className="text-lg md:text-2xl font-bold">
                Пополнение баланса
              </DialogTitle>
              <DialogDescription className="text-[10px] md:text-sm">
                Быстрое пополнение через USDT (TRC-20)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {/* Left column - Amount input */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-3">
              <Label className="text-sm md:text-base font-semibold flex items-center gap-2">
                <Icon name="DollarSign" size={16} className="text-primary" />
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
                  className={cn(
                    "h-16 md:h-20 text-xl md:text-3xl font-bold pr-24 text-center transition-all",
                    currentAmount >= 30 && currentAmount <= 1000000 && "border-primary/50 bg-primary/5"
                  )}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg md:text-2xl font-bold text-primary pointer-events-none">
                  USDT
                </div>
              </div>
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">
                  Минимум: <span className="font-semibold text-foreground">30 USDT</span>
                </span>
                <span className="text-muted-foreground">
                  Максимум: <span className="font-semibold text-foreground">1,000,000 USDT</span>
                </span>
              </div>
            </div>

            {/* Quick amounts */}
            <div className="space-y-2 md:space-y-3">
              <Label className="text-xs md:text-sm font-medium text-muted-foreground">
                Быстрый выбор:
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => handleQuickAmount(amount)}
                    className={cn(
                      "h-12 md:h-14 flex flex-col items-center justify-center gap-1 text-xs md:text-sm font-semibold transition-all",
                      currentAmount === amount 
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                        : "hover:bg-muted hover:border-primary/50 hover:scale-105"
                    )}
                  >
                    <span className="text-sm md:text-base font-bold">
                      {formatAmount(amount)}
                    </span>
                    <span className="text-[8px] md:text-[10px] text-muted-foreground">
                      USDT
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment button */}
            <Button 
              onClick={onTopUp}
              disabled={isLoading || !topUpAmount || currentAmount < 30 || currentAmount > 1000000}
              size="lg"
              className="w-full h-14 md:h-16 text-base md:text-xl font-bold shadow-lg"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin md:w-6 md:h-6" />
                  <span>Обработка платежа...</span>
                </>
              ) : (
                <>
                  <Icon name="CreditCard" size={20} className="mr-2 md:w-6 md:h-6" />
                  {currentAmount >= 30 && currentAmount <= 1000000 ? (
                    <span>Пополнить на {currentAmount.toLocaleString('ru-RU')} USDT</span>
                  ) : (
                    'Пополнить баланс'
                  )}
                </>
              )}
            </Button>
            
            {(currentAmount < 30 || currentAmount > 1000000) && currentAmount > 0 && (
              <p className="text-xs md:text-sm text-center text-destructive font-medium">
                {currentAmount < 30 ? '⚠️ Минимальная сумма: 30 USDT' : '⚠️ Максимальная сумма: 1,000,000 USDT'}
              </p>
            )}
          </div>

          {/* Right column - Info blocks */}
          <div className="space-y-3 md:space-y-4">
            {/* Payment info */}
            <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-3 md:p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon name="Info" size={18} className="text-blue-500" />
                <h3 className="font-semibold text-sm md:text-base">Способ оплаты</h3>
              </div>
              <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
                <p>После подтверждения откроется окно с адресом кошелька для перевода</p>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <Icon name="Wallet" size={14} className="text-primary" />
                  <span className="font-mono text-xs font-semibold">USDT (TRC-20)</span>
                </div>
              </div>
            </div>

            {/* Processing time */}
            <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-3 md:p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="Clock" size={18} className="text-green-500" />
                <h3 className="font-semibold text-sm md:text-base">Время зачисления</h3>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Средства поступят на баланс в течение <span className="font-semibold text-foreground">5-15 минут</span> после подтверждения транзакции
              </p>
            </div>

            {/* Security */}
            <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-3 md:p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Icon name="Shield" size={18} className="text-purple-500" />
                <h3 className="font-semibold text-sm md:text-base">Безопасность</h3>
              </div>
              <ul className="space-y-1 text-xs md:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={14} className="mt-0.5 text-green-500 shrink-0" />
                  <span>Все транзакции защищены</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={14} className="mt-0.5 text-green-500 shrink-0" />
                  <span>Автоматическое подтверждение</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={14} className="mt-0.5 text-green-500 shrink-0" />
                  <span>Поддержка 24/7</span>
                </li>
              </ul>
            </div>

            {/* Bonus info */}
            {currentAmount >= 10000 && (
              <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-3 md:p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon name="Gift" size={18} className="text-amber-500" />
                  <h3 className="font-semibold text-sm md:text-base">Бонус</h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  При пополнении от 10,000 USDT вы получаете приоритетную поддержку!
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};