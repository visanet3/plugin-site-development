import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface AdminBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceAction: 'add' | 'subtract';
  balanceUsername: string;
  setBalanceUsername: (username: string) => void;
  balanceAmount: string;
  setBalanceAmount: (amount: string) => void;
  balanceLoading: boolean;
  onAddBalance: () => void;
}

const AdminBalanceDialog = ({
  open,
  onOpenChange,
  balanceAction,
  balanceUsername,
  setBalanceUsername,
  balanceAmount,
  setBalanceAmount,
  balanceLoading,
  onAddBalance
}: AdminBalanceDialogProps) => {
  const quickAmounts = [10, 50, 100, 500];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {balanceAction === 'add' ? 'Пополнение баланса пользователя' : 'Списание баланса пользователя'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Никнейм пользователя</label>
            <Input
              value={balanceUsername}
              onChange={(e) => setBalanceUsername(e.target.value)}
              placeholder="Введите никнейм"
              disabled={balanceLoading}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Сумма (USDT)</label>
            <Input
              type="number"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
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
                onClick={() => setBalanceAmount(amount.toString())}
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
                setBalanceUsername('');
                setBalanceAmount('');
              }}
              disabled={balanceLoading}
            >
              Отмена
            </Button>
            <Button 
              onClick={onAddBalance}
              disabled={balanceLoading || !balanceUsername || !balanceAmount}
              className={balanceAction === 'add' 
                ? "bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
                : "bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800"
              }
            >
              {balanceLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Icon name={balanceAction === 'add' ? 'Check' : 'Minus'} size={16} className="mr-2" />
                  {balanceAction === 'add' ? 'Пополнить' : 'Списать'}
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