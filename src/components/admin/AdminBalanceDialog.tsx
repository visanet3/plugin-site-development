import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface AdminBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceUsername: string;
  balanceAmount: string;
  balanceLoading: boolean;
  onUsernameChange: (username: string) => void;
  onAmountChange: (amount: string) => void;
  onAddBalance: () => void;
}

const AdminBalanceDialog = ({
  open,
  onOpenChange,
  balanceUsername,
  balanceAmount,
  balanceLoading,
  onUsernameChange,
  onAmountChange,
  onAddBalance
}: AdminBalanceDialogProps) => {
  const quickAmounts = [10, 50, 100, 500];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Пополнение баланса пользователя</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Никнейм пользователя</label>
            <Input
              value={balanceUsername}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Введите никнейм"
              disabled={balanceLoading}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Сумма (USDT)</label>
            <Input
              type="number"
              value={balanceAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="Введите сумму"
              min="0.01"
              step="0.01"
              disabled={balanceLoading}
            />
          </div>
          <div className="flex gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => onAmountChange(amount.toString())}
                disabled={balanceLoading}
                className="flex-1"
              >
                {amount}
              </Button>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button 
              variant="ghost" 
              onClick={() => {
                onOpenChange(false);
                onUsernameChange('');
                onAmountChange('');
              }}
              disabled={balanceLoading}
            >
              Отмена
            </Button>
            <Button 
              onClick={onAddBalance}
              disabled={balanceLoading || !balanceUsername || !balanceAmount}
              className="bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
            >
              {balanceLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Icon name="Check" size={16} className="mr-2" />
                  Пополнить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBalanceDialog;
