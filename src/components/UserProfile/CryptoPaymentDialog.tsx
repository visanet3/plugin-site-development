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
      <DialogContent className="max-w-4xl">
        <DialogHeader className="space-y-4 pb-6">
          <DialogTitle className="text-3xl font-bold">
            Перевод USDT
          </DialogTitle>
          <DialogDescription className="text-base">
            Отправьте ровно {cryptoPayment?.amount} USDT на указанный адрес кошелька
          </DialogDescription>
        </DialogHeader>

        {cryptoPayment && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left column - Payment info and QR */}
            <div className="space-y-6">
              {/* Amount and Network Card */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-8">
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Сумма к оплате
                    </Label>
                    <div className="text-5xl font-bold text-foreground">
                      {cryptoPayment.amount}
                    </div>
                    <div className="text-2xl font-semibold text-primary mt-1">
                      USDT
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-primary/10">
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Сеть блокчейна
                    </Label>
                    <div className="flex items-center gap-2">
                      <Icon name="Link" size={20} className="text-primary" />
                      <span className="text-xl font-semibold">{cryptoPayment.network}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="rounded-xl bg-muted/30 p-8 border border-border flex flex-col items-center">
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
            <div className="space-y-6">
              {/* Wallet Address */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Адрес кошелька
                </Label>
                <div className="space-y-2">
                  <code 
                    className="block p-4 bg-muted rounded-lg text-sm break-all cursor-pointer select-all hover:bg-muted/80 transition-colors border border-border"
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
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(cryptoPayment.wallet_address);
                      onCopyToClipboard(cryptoPayment.wallet_address);
                    }}
                  >
                    <Icon name="Copy" size={18} className="mr-2" />
                    Скопировать адрес
                  </Button>
                </div>
              </div>

              {/* Warnings */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <Icon name="AlertTriangle" size={20} className="text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-destructive">
                      Отправляйте ТОЧНО {cryptoPayment.amount} USDT
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Биржи берут комиссию — учитывайте это! Отправьте чуть больше, чтобы после комиссии пришло ровно {cryptoPayment.amount} USDT
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <Icon name="Ban" size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-orange-600 dark:text-orange-400 mb-1">
                      Другая сумма = обращение в поддержку
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Неверная сумма не зачислится автоматически. Напишите в поддержку с данными транзакции
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Icon name="Info" size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Только <span className="font-semibold text-foreground">{cryptoPayment.network}</span> • Другая сеть = потеря средств
                  </p>
                </div>
              </div>

              {/* Status message */}
              {checkingStatus && (
                <div className={cn(
                  "p-4 rounded-lg border",
                  checkingStatus.includes('Ошибка') 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : checkingStatus.includes('подтверждён')
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
                )}>
                  <div className="flex items-start gap-3">
                    <Icon 
                      name={
                        checkingStatus.includes('Ошибка') ? 'XCircle' :
                        checkingStatus.includes('подтверждён') ? 'CheckCircle' : 
                        'Loader2'
                      } 
                      size={20} 
                      className={cn(
                        "shrink-0 mt-0.5",
                        checkingStatus.includes('Ошибка') ? 'text-destructive' :
                        checkingStatus.includes('подтверждён') ? 'text-green-500' :
                        'text-blue-500 animate-spin'
                      )} 
                    />
                    <div className="text-sm flex-1">
                      <p className={cn(
                        "font-medium",
                        checkingStatus.includes('Ошибка') ? 'text-destructive' :
                        checkingStatus.includes('подтверждён') ? 'text-green-600 dark:text-green-400' :
                        'text-blue-600 dark:text-blue-400'
                      )}>
                        {checkingStatus}
                      </p>
                      {isLoading && !checkingStatus.includes('Ошибка') && !checkingStatus.includes('подтверждён') && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Это может занять до 30 минут. Проверка каждые 30 секунд.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={onConfirmPayment}
                  disabled={isLoading}
                  size="lg"
                  className="w-full h-14 text-lg font-bold"
                >
                  {isLoading ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Проверка транзакции...
                    </>
                  ) : (
                    <>
                      <Icon name="Check" size={20} className="mr-2" />
                      Я отправил USDT
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  size="lg"
                  className="w-full"
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