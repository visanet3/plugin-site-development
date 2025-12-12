import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface CryptoPaymentDialogProps {
  open: boolean;
  isLoading: boolean;
  cryptoPayment: any;
  checkingStatus?: string;
  checkAttempt?: number;
  onOpenChange: (open: boolean) => void;
  onConfirmPayment: () => void;
  onCopyToClipboard: (text: string) => void;
}

export const CryptoPaymentDialog = ({
  open,
  isLoading,
  cryptoPayment,
  checkingStatus,
  checkAttempt,
  onOpenChange,
  onConfirmPayment,
  onCopyToClipboard
}: CryptoPaymentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="space-y-2 md:space-y-3 pb-3 md:pb-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* USDT Logo with Tron Badge */}
            <div className="relative">
              {/* USDT Circle */}
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#26A17B] flex items-center justify-center shadow-lg p-2 md:p-2.5">
                <img 
                  src="https://cryptologos.cc/logos/tether-usdt-logo.svg" 
                  alt="USDT"
                  className="w-full h-full"
                />
              </div>
              {/* Tron Logo Badge */}
              <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-5 h-5 md:w-7 md:h-7 rounded-full bg-[#FF060A] flex items-center justify-center shadow-md border-2 border-background p-1">
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="white">
                  <path d="M 7.5,4 L 24.5,4 L 28,10 L 16,28 L 4,10 Z M 16,7 L 9,11 L 12,17 L 16,25 L 20,17 L 23,11 Z" />
                </svg>
              </div>
            </div>
            <div>
              <DialogTitle className="text-lg md:text-2xl font-bold flex items-center gap-2">
                Перевод USDT
              </DialogTitle>
              <DialogDescription className="text-[10px] md:text-sm">
                Отправьте ровно {cryptoPayment?.amount} USDT на указанный адрес
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {cryptoPayment && (
          <div className="grid md:grid-cols-2 gap-3 md:gap-8">
            {/* Left column - Payment info and QR */}
            <div className="space-y-3 md:space-y-6">
              {/* Amount and Network Card */}
              <div className="rounded-lg md:rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-3 md:p-8">
                <div className="flex items-center justify-between md:block">
                  <div>
                    <Label className="text-[10px] md:text-sm font-medium text-muted-foreground mb-1 md:mb-2 block">
                      Сумма к оплате
                    </Label>
                    <div className="text-2xl md:text-5xl font-bold text-foreground">
                      {cryptoPayment.amount}
                    </div>
                    <div className="text-base md:text-2xl font-semibold text-primary">
                      USDT
                    </div>
                  </div>
                  
                  <div className="md:pt-4 md:border-t md:border-primary/10 md:mt-4">
                    <Label className="text-[10px] md:text-sm font-medium text-muted-foreground mb-1 md:mb-2 block">
                      Сеть
                    </Label>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Icon name="Link" size={14} className="text-primary md:w-5 md:h-5" />
                      <span className="text-sm md:text-xl font-semibold">{cryptoPayment.network}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code - hide on mobile */}
              <div className="hidden md:flex rounded-xl bg-muted/30 p-8 border border-border flex-col items-center">
                <Label className="text-sm font-medium mb-4 block text-center">
                  QR-код для сканирования
                </Label>
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG 
                    value={cryptoPayment.wallet_address}
                    size={200}
                    level="M"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Отсканируйте камерой телефона
                </p>
              </div>
            </div>

            {/* Right column - Wallet address and warnings */}
            <div className="space-y-3 md:space-y-6">
              {/* Wallet Address */}
              <div className="space-y-2 md:space-y-3">
                <Label className="text-xs md:text-sm font-medium">
                  Адрес кошелька
                </Label>
                <div className="space-y-2">
                  <code 
                    className="block p-2.5 md:p-4 bg-muted rounded-lg text-[10px] md:text-sm break-all cursor-pointer select-all hover:bg-muted/80 transition-colors border border-border"
                    onClick={(e) => {
                      const range = document.createRange();
                      range.selectNodeContents(e.currentTarget);
                      const selection = window.getSelection();
                      if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                      }
                      onCopyToClipboard(cryptoPayment.wallet_address);
                    }}
                  >
                    {cryptoPayment.wallet_address}
                  </code>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-9 md:h-12 text-xs md:text-base"
                    onClick={() => {
                      navigator.clipboard.writeText(cryptoPayment.wallet_address);
                      onCopyToClipboard(cryptoPayment.wallet_address);
                    }}
                  >
                    <Icon name="Copy" size={14} className="mr-2 md:w-[18px] md:h-[18px]" />
                    Скопировать адрес
                  </Button>
                </div>
              </div>

              {/* Warnings - detailed */}
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <Icon name="AlertTriangle" size={16} className="text-destructive shrink-0 mt-0.5 md:w-5 md:h-5" />
                  <div className="text-[10px] md:text-sm space-y-1">
                    <p className="font-bold text-destructive">
                      Отправляйте ТОЧНО {cryptoPayment.amount} USDT
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Биржи и кошельки берут комиссию. Убедитесь, что на адрес придёт именно {cryptoPayment.amount} USDT. Любое отклонение требует ручной проверки.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <Icon name="Ban" size={16} className="text-orange-500 shrink-0 mt-0.5 md:w-5 md:h-5" />
                  <div className="text-[10px] md:text-sm space-y-1">
                    <p className="font-bold text-orange-600 dark:text-orange-400">
                      Неправильная сумма — обращайтесь в поддержку
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Если отправите больше или меньше указанной суммы, автоматическое зачисление не сработает. Потребуется связаться с суппортом.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Icon name="Network" size={16} className="text-blue-500 shrink-0 mt-0.5 md:w-5 md:h-5" />
                  <div className="text-[10px] md:text-sm space-y-1">
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      Используйте только сеть <span className="font-mono">{cryptoPayment.network}</span>
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Перевод через другую сеть (ERC-20, BEP-20 и др.) приведёт к безвозвратной потере средств. Проверьте сеть перед отправкой!
                    </p>
                  </div>
                </div>
              </div>

              {/* Status message */}
              {checkingStatus && (
                <div className={cn(
                  "p-2.5 md:p-4 rounded-lg border",
                  checkingStatus.includes('Ошибка') 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : checkingStatus.includes('подтверждён')
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
                )}>
                  <div className="flex items-start gap-2 md:gap-3">
                    <Icon 
                      name={
                        checkingStatus.includes('Ошибка') ? 'XCircle' :
                        checkingStatus.includes('подтверждён') ? 'CheckCircle' : 
                        'Loader2'
                      } 
                      size={16} 
                      className={cn(
                        "shrink-0 mt-0.5 md:w-5 md:h-5",
                        checkingStatus.includes('Ошибка') ? 'text-destructive' :
                        checkingStatus.includes('подтверждён') ? 'text-green-500' :
                        'text-blue-500 animate-spin'
                      )} 
                    />
                    <div className="text-xs md:text-sm flex-1">
                      <p className={cn(
                        "font-medium",
                        checkingStatus.includes('Ошибка') ? 'text-destructive' :
                        checkingStatus.includes('подтверждён') ? 'text-green-600 dark:text-green-400' :
                        'text-blue-600 dark:text-blue-400'
                      )}>
                        {checkingStatus}
                      </p>
                      {isLoading && !checkingStatus.includes('Ошибка') && !checkingStatus.includes('подтверждён') && (
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                          Проверка каждые 30 сек
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 md:space-y-3">
                <Button
                  onClick={onConfirmPayment}
                  disabled={isLoading}
                  size="lg"
                  className="w-full h-11 md:h-14 text-sm md:text-lg font-bold"
                >
                  {isLoading ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin md:w-5 md:h-5" />
                      <span className="hidden sm:inline">Проверка транзакции...</span>
                      <span className="sm:hidden">Проверка...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="Check" size={16} className="mr-2 md:w-5 md:h-5" />
                      Я отправил USDT
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  size="lg"
                  className="w-full h-9 md:h-12 text-xs md:text-base"
                >
                  Отменить
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};