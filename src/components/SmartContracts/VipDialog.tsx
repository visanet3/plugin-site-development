import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface VipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  isPurchasing: boolean;
  onPurchase: () => void;
}

const VipDialog = ({ open, onOpenChange, user, isPurchasing, onPurchase }: VipDialogProps) => {
  const userBalance = Number(user?.balance) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Icon name="Crown" size={24} className="text-amber-400" />
            VIP Привилегия
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Стоимость:</span>
                <span className="text-xl font-bold text-amber-400">1250 USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Срок действия:</span>
                <span className="font-semibold">30 дней</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ваш баланс:</span>
                <span className={`font-bold ${userBalance >= 1250 ? 'text-green-400' : 'text-red-400'}`}>
                  {userBalance.toFixed(2)} USDT
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-amber-400">Преимущества VIP:</p>
            <ul className="space-y-2">
              {[
                'Полный доступ к коду Flash USDT контракта',
                'Возможность копировать критические части',
                'Доступ к будущим премиум-контрактам',
                'Приоритетная поддержка'
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Icon name="CheckCircle" size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {userBalance < 1250 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm flex items-start gap-2">
                <Icon name="AlertCircle" size={18} className="flex-shrink-0 mt-0.5" />
                <span>Недостаточно средств. Пополните баланс на {(1250 - userBalance).toFixed(2)} USDT</span>
              </p>
            </div>
          )}

          <Button
            onClick={onPurchase}
            disabled={isPurchasing || userBalance < 1250}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold"
          >
            {isPurchasing ? 'Обработка...' : 'Купить VIP за 1250 USDT'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VipDialog;