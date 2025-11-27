import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface AdminBtcBalanceDialogProps {
  open: boolean;
  onClose: () => void;
  username: string;
  currentBalance: number;
  onSubmit: (action: 'add' | 'subtract', amount: number) => void;
  loading: boolean;
}

const AdminBtcBalanceDialog = ({ 
  open, 
  onClose, 
  username, 
  currentBalance,
  onSubmit,
  loading 
}: AdminBtcBalanceDialogProps) => {
  const [action, setAction] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }
    onSubmit(action, parsedAmount);
  };

  const handleClose = () => {
    setAmount('');
    setAction('add');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Bitcoin" size={20} className="text-orange-500" />
            Управление BTC балансом
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Пользователь</Label>
            <p className="font-semibold">{username}</p>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Текущий баланс BTC</Label>
            <p className="font-semibold text-orange-500">
              ₿ {currentBalance.toFixed(8)} BTC
            </p>
          </div>

          <div>
            <Label>Действие</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={action === 'add' ? 'default' : 'outline'}
                onClick={() => setAction('add')}
                className="flex-1"
              >
                <Icon name="Plus" size={16} className="mr-2" />
                Начислить
              </Button>
              <Button
                variant={action === 'subtract' ? 'default' : 'outline'}
                onClick={() => setAction('subtract')}
                className="flex-1"
              >
                <Icon name="Minus" size={16} className="mr-2" />
                Списать
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="btc-amount">Сумма BTC</Label>
            <Input
              id="btc-amount"
              type="number"
              step="0.00000001"
              min="0"
              placeholder="0.00000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !amount || parseFloat(amount) <= 0}
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Icon name={action === 'add' ? 'Plus' : 'Minus'} size={16} className="mr-2" />
                  {action === 'add' ? 'Начислить' : 'Списать'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBtcBalanceDialog;
