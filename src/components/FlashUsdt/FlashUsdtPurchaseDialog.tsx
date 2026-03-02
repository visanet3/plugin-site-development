import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        {selectedPackage && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#0f1729] to-[#080d1a] border border-white/10">

            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-green-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-yellow-500/5 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
              >
                <Icon name="X" size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/10 border border-green-500/20 flex items-center justify-center">
                  <Icon name="Zap" size={20} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">Покупка Flash USDT</h2>
                  <p className="text-white/40 text-xs">TRC20 · Мгновенная отправка</p>
                </div>
              </div>
            </div>

            <div className="relative px-6 py-5 space-y-5">

              {/* Test notice */}
              {selectedPackage.id === 0 && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Icon name="TestTube" size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-300 font-semibold text-sm">Тестовая покупка</p>
                    <p className="text-blue-300/60 text-xs mt-0.5">Получите 10 Flash USDT для проверки качества токена</p>
                  </div>
                </div>
              )}

              {/* Package summary */}
              <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">Количество</span>
                  <span className="text-white font-bold text-lg">{selectedPackage.amount.toLocaleString('ru-RU')} <span className="text-green-400">USDT</span></span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">Стоимость</span>
                  <span className="text-2xl font-bold text-white">${selectedPackage.price.toLocaleString('ru-RU')}</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">Срок действия</span>
                  <Badge className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-medium">
                    <Icon name="Clock" size={11} className="mr-1" />
                    120 дней
                  </Badge>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">Скидка</span>
                  <Badge className="bg-green-500/15 text-green-400 border border-green-500/20 font-medium">{selectedPackage.discount}</Badge>
                </div>
              </div>

              {/* Wallet input */}
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-medium flex items-center gap-1.5">
                  <Icon name="Wallet" size={13} className="text-white/40" />
                  Адрес кошелька TRC20
                </label>
                <div className="relative">
                  <Input
                    placeholder="TXm...abc (34 символа)"
                    value={walletAddress}
                    onChange={(e) => onWalletAddressChange(e.target.value)}
                    className="font-mono text-sm bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-green-500/50 focus:ring-green-500/10 rounded-xl h-11 pr-10"
                    maxLength={34}
                  />
                  {walletAddress.length === 34 && (
                    <Icon name="CheckCircle2" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                  )}
                </div>
                <p className="text-white/25 text-[11px] flex items-start gap-1">
                  <Icon name="Info" size={11} className="mt-0.5 flex-shrink-0" />
                  Токены поступят на этот адрес в течение 1–3 минут
                </p>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-500/8 border border-orange-500/15">
                <Icon name="AlertTriangle" size={15} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-orange-300/70 text-xs leading-relaxed">
                  Проверьте адрес кошелька перед оплатой — отправка необратима
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1 border-white/10 text-white/50 hover:text-white hover:bg-white/5 hover:border-white/20 bg-transparent rounded-xl h-11"
                  disabled={isProcessing}
                >
                  Отмена
                </Button>
                <Button
                  onClick={onConfirmPurchase}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold rounded-xl h-11 shadow-lg shadow-green-500/20 transition-all"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Icon name="CreditCard" size={16} className="mr-2" />
                      Оплатить ${selectedPackage.price.toLocaleString('ru-RU')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
