import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { Package } from './FlashUsdtPackages';

interface FlashUsdtPurchaseDialogProps {
  open: boolean;
  selectedPackage: Package | null;
  walletAddress: string;
  isProcessing: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletAddressChange: (address: string) => void;
  onConfirmPurchase: () => void;
}

export const FlashUsdtPurchaseDialog = ({
  open,
  selectedPackage,
  walletAddress,
  isProcessing,
  onOpenChange,
  onWalletAddressChange,
  onConfirmPurchase
}: FlashUsdtPurchaseDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Icon name="ShoppingCart" size={20} className="text-yellow-400 sm:w-6 sm:h-6" />
            Покупка Flash USDT
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Заполните данные для получения токенов
          </DialogDescription>
        </DialogHeader>

        {selectedPackage && (
          <div className="space-y-4 sm:space-y-6">
            <Card className={`p-3 sm:p-4 ${selectedPackage.id === 0 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
              <div className="space-y-1.5 sm:space-y-2">
                {selectedPackage.id === 0 && (
                  <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                      <Icon name="TestTube" size={16} className="text-blue-400 sm:w-5 sm:h-5" />
                      <span className="font-bold text-blue-400 text-xs sm:text-sm">Тестовая покупка</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Получите пробную сумму 10 Flash USDT для проверки качества токена
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Количество:</span>
                  <span className="font-bold text-base sm:text-lg">{selectedPackage.amount.toLocaleString('ru-RU')} Flash USDT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Стоимость:</span>
                  <span className="font-bold text-lg sm:text-xl text-green-400">${selectedPackage.price.toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Срок действия:</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5">120 дней</Badge>
                </div>
              </div>
            </Card>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="wallet" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Icon name="Wallet" size={14} className="sm:w-4 sm:h-4" />
                Адрес кошелька TRC20
              </Label>
              <Input
                id="wallet"
                placeholder="TXm...abc (34 символа)"
                value={walletAddress}
                onChange={(e) => onWalletAddressChange(e.target.value)}
                className="font-mono text-xs sm:text-sm"
                maxLength={34}
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground flex items-start gap-1">
                <Icon name="Info" size={10} className="mt-0.5 flex-shrink-0 sm:w-3 sm:h-3" />
                <span>Укажите адрес TRC20 кошелька для получения Flash USDT токенов</span>
              </p>
            </div>

            <Card className="p-3 sm:p-4 bg-orange-500/5 border-orange-500/20">
              <div className="flex items-start gap-1.5 sm:gap-2">
                <Icon name="AlertCircle" size={14} className="text-orange-400 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
                <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Важно:</p>
                  <ul className="space-y-0.5 sm:space-y-1">
                    <li>• Проверьте правильность адреса перед оплатой</li>
                    <li>• Токены придут в течение 1-3 минут в зависимости от загруженности сети TRON</li>
                    <li>• Срок действия начнется с момента получения</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1 text-xs sm:text-sm"
                disabled={isProcessing}
              >
                Отмена
              </Button>
              <Button
                onClick={onConfirmPurchase}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-800 hover:opacity-90 text-xs sm:text-sm"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Icon name="Loader2" size={14} className="mr-1.5 sm:mr-2 animate-spin sm:w-4 sm:h-4" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Icon name="CreditCard" size={14} className="mr-1.5 sm:mr-2 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Оплатить ${selectedPackage.price.toLocaleString('ru-RU')}</span>
                    <span className="sm:hidden">Оплатить</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};