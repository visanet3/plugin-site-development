import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { QRCodeSVG } from 'qrcode.react';

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Перевод USDT</DialogTitle>
          <DialogDescription>
            Отправьте {cryptoPayment?.amount} USDT на адрес ниже
          </DialogDescription>
        </DialogHeader>

        {cryptoPayment && (
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-green-800/10 to-green-900/10 border-green-800/20">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Сумма</Label>
                    <p className="text-2xl font-bold">{cryptoPayment.amount} USDT</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Сеть</Label>
                    <p className="text-lg font-semibold text-green-400">{cryptoPayment.network}</p>
                  </div>
                </div>

                <div className="p-0 rounded-lg mt-4" style={{marginRight: '60px'}}>
                  <QRCodeSVG 
                    value={cryptoPayment.wallet_address}
                    size={143}
                    level="M"
                    fgColor="#ffffff"
                    bgColor="transparent"
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">Адрес кошелька (нажмите для выделения)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code 
                    className="flex-1 p-2 bg-background rounded text-sm break-all cursor-text select-all hover:bg-muted/50 transition-colors"
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
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCopyToClipboard(cryptoPayment.wallet_address);
                    }}
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="AlertTriangle" size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-red-300">Отправляйте ТОЧНО {cryptoPayment.amount} USDT</p>
                    <p className="text-muted-foreground leading-snug">
                      Биржи берут комиссию — учитывайте это! Отправьте чуть больше, чтобы после комиссии пришло ровно {cryptoPayment.amount} USDT
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-r from-orange-500/15 to-yellow-500/15 border border-orange-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon name="Ban" size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-orange-300 mb-1">Другая сумма = обращение в поддержку</p>
                    <p className="text-muted-foreground leading-snug">
                      Неверная сумма не зачислится автоматически. Напишите в поддержку с данными транзакции для ручного пополнения
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Info" size={14} className="text-blue-400 flex-shrink-0" />
                  <p className="leading-snug">
                    Только {cryptoPayment.network} • Другая сеть = потеря средств • Нажмите "Я отправил" после перевода
                  </p>
                </div>
              </div>
            </div>

            {checkingStatus && (
              <div className={`space-y-2 p-4 rounded-lg ${
                checkingStatus.includes('Ошибка') 
                  ? 'bg-red-500/10 border border-red-500/20' 
                  : checkingStatus.includes('подтверждён')
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                <div className="flex items-start gap-2">
                  <Icon 
                    name={
                      checkingStatus.includes('Ошибка') ? 'XCircle' :
                      checkingStatus.includes('подтверждён') ? 'CheckCircle' : 
                      'Loader2'
                    } 
                    size={18} 
                    className={`mt-0.5 ${
                      checkingStatus.includes('Ошибка') ? 'text-red-400' :
                      checkingStatus.includes('подтверждён') ? 'text-green-400' :
                      'text-blue-400 animate-spin'
                    }`} 
                  />
                  <div className="text-sm flex-1">
                    <p className={`font-medium ${
                      checkingStatus.includes('Ошибка') ? 'text-red-400' :
                      checkingStatus.includes('подтверждён') ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
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

            <Button
              onClick={onConfirmPayment}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <Icon name="Check" size={18} className="mr-2" />
                  Я отправил USDT
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Отменить
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};