import { Dialog, DialogContent } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        {selectedPackage && (
          <div className="bg-[#0a0e1a] border border-[#1e2535] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

            {/* Top accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Icon name="Zap" size={15} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm tracking-wide">FLASH USDT</p>
                  <p className="text-[#4a5568] text-[11px] tracking-widest uppercase">TRC-20 Network</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-7 h-7 rounded-lg bg-white/3 hover:bg-white/8 border border-white/5 flex items-center justify-center text-[#4a5568] hover:text-white/70 transition-all"
              >
                <Icon name="X" size={13} />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#1e2535] mx-6" />

            <div className="px-6 pt-5 pb-6 space-y-5">

              {/* Test notice */}
              {selectedPackage.id === 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-500/5 border border-sky-500/15">
                  <Icon name="FlaskConical" size={14} className="text-sky-400 flex-shrink-0" />
                  <p className="text-sky-400/80 text-xs">Тестовая покупка — 10 Flash USDT для проверки</p>
                </div>
              )}

              {/* Amount hero */}
              <div className="text-center py-4">
                <p className="text-[#4a5568] text-xs uppercase tracking-widest mb-1">Вы получите</p>
                <p className="text-4xl font-bold text-white tracking-tight">
                  {selectedPackage.amount.toLocaleString('ru-RU')}
                  <span className="text-emerald-400 ml-2 text-2xl font-semibold">USDT</span>
                </p>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <span className="text-[#4a5568] text-sm line-through">${(selectedPackage.price / (1 - parseFloat(selectedPackage.discount) / 100)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/15">−{selectedPackage.discount}</span>
                </div>
              </div>

              {/* Details table */}
              <div className="rounded-xl border border-[#1e2535] divide-y divide-[#1e2535]">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[#4a5568] text-xs uppercase tracking-wider">К оплате</span>
                  <span className="text-white font-bold text-base">${selectedPackage.price.toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[#4a5568] text-xs uppercase tracking-wider">Срок действия</span>
                  <span className="text-[#8892a4] text-sm">120 дней</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[#4a5568] text-xs uppercase tracking-wider">Зачисление</span>
                  <span className="text-[#8892a4] text-sm">1–3 минуты</span>
                </div>
              </div>

              {/* Wallet input */}
              <div className="space-y-2">
                <label className="text-[#4a5568] text-[11px] uppercase tracking-widest">
                  Адрес кошелька TRC20
                </label>
                <div className="relative">
                  <Input
                    placeholder="T... (34 символа)"
                    value={walletAddress}
                    onChange={(e) => onWalletAddressChange(e.target.value)}
                    className="font-mono text-sm bg-[#0d1220] border-[#1e2535] text-white placeholder:text-[#2a3347] focus-visible:border-emerald-500/40 focus-visible:ring-0 rounded-xl h-12 pr-10"
                    maxLength={34}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {walletAddress.length === 34
                      ? <Icon name="CheckCircle2" size={15} className="text-emerald-400" />
                      : <Icon name="Wallet" size={15} className="text-[#2a3347]" />
                    }
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Icon name="ShieldAlert" size={13} className="text-amber-500/60 mt-0.5 flex-shrink-0" />
                <p className="text-[#5a6478] text-[11px] leading-relaxed">
                  Отправка токенов необратима. Убедитесь в правильности адреса перед оплатой.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-1">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="w-24 border-[#1e2535] text-[#4a5568] hover:text-white/60 hover:bg-white/3 bg-transparent rounded-xl h-11 text-sm shrink-0"
                  disabled={isProcessing}
                >
                  Отмена
                </Button>
                <Button
                  onClick={onConfirmPurchase}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#050a10] font-bold rounded-xl h-11 text-sm transition-all shadow-[0_0_24px_rgba(16,185,129,0.2)] hover:shadow-[0_0_32px_rgba(16,185,129,0.35)]"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Icon name="Loader2" size={15} className="mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      Оплатить ${selectedPackage.price.toLocaleString('ru-RU')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#1e2535] to-transparent" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};