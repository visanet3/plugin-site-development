import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface TopUpDialogProps {
  open: boolean;
  isLoading: boolean;
  topUpAmount: string;
  onOpenChange: (open: boolean) => void;
  onAmountChange: (amount: string) => void;
  onTopUp: () => void;
}

const quickAmounts = [10, 50, 100, 500];

export const TopUpDialog = ({
  open,
  isLoading,
  topUpAmount,
  onOpenChange,
  onAmountChange,
  onTopUp
}: TopUpDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Пополнение баланса</DialogTitle>
          <DialogDescription>
            Выберите сумму или введите свою
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => onAmountChange(amount.toString())}
                className="h-16 text-lg font-semibold"
              >
                {amount} USDT
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Другая сумма</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Введите сумму"
              value={topUpAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              min="1"
              step="1"
            />
          </div>

          <Button 
            onClick={onTopUp}
            disabled={isLoading || !topUpAmount}
            className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
          >
            {isLoading ? (
              <>
                <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <Icon name="CreditCard" size={18} className="mr-2" />
                Пополнить на {topUpAmount || '0'} USDT
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Откроется окно с адресом для перевода USDT
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
