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
  onOpenChange: (open: boolean) => void;
  onConfirmPayment: () => void;
  onCopyToClipboard: (text: string) => void;
}

export const CryptoPaymentDialog = ({
  open,
  isLoading,
  cryptoPayment,
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
                <Label className="text-xs text-muted-foreground">Адрес кошелька</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-background rounded text-sm break-all">
                    {cryptoPayment.wallet_address}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onCopyToClipboard(cryptoPayment.wallet_address)}
                  >
                    <Icon name="Copy" size={16} />
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="AlertTriangle" size={18} className="text-yellow-400 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-yellow-400">Важно:</p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• Отправляйте только USDT в сети {cryptoPayment.network}</li>
                    <li>• Перевод в другой сети приведёт к потере средств</li>
                    <li>• После отправки нажмите "Я отправил"</li>
                    <li>• Зачисление произойдёт после подтверждения</li>
                  </ul>
                </div>
              </div>
            </div>

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
