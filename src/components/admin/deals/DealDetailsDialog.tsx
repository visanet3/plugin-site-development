import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

interface DealDetailsDialogProps {
  selectedDeal: any | null;
  onClose: () => void;
  getStatusBadge: (status: string) => JSX.Element;
  getStepBadge: (step: string) => JSX.Element;
}

const DealDetailsDialog = ({
  selectedDeal,
  onClose,
  getStatusBadge,
  getStepBadge
}: DealDetailsDialogProps) => {
  return (
    <Dialog open={!!selectedDeal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детали сделки #{selectedDeal?.id}</DialogTitle>
        </DialogHeader>
        {selectedDeal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Статус</p>
                <div className="mt-1">{getStatusBadge(selectedDeal.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Шаг</p>
                <div className="mt-1">{getStepBadge(selectedDeal.step)}</div>
              </div>
            </div>
            
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Название</p>
              <h3 className="font-semibold text-lg">{selectedDeal.title}</h3>
            </Card>

            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Описание</p>
              <p className="whitespace-pre-wrap">{selectedDeal.description}</p>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4 bg-green-500/5 border-green-500/20">
                <p className="text-sm text-muted-foreground mb-2">💰 Цена</p>
                <p className="text-2xl font-bold text-green-400">{Number(selectedDeal.price || 0).toFixed(2)} USDT</p>
              </Card>
              
              <Card className="p-4 bg-orange-500/5 border-orange-500/20">
                <p className="text-sm text-muted-foreground mb-2">💸 Комиссия</p>
                <p className="text-2xl font-bold text-orange-400">{Number(selectedDeal.commission || 0).toFixed(2)} USDT</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">👤 Продавец</p>
                <p className="font-semibold">{selectedDeal.seller_name || selectedDeal.seller_username}</p>
                <p className="text-xs text-muted-foreground">ID: {selectedDeal.seller_id}</p>
              </Card>

              {selectedDeal.buyer_id && (
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">🛒 Покупатель</p>
                  <p className="font-semibold">{selectedDeal.buyer_name || selectedDeal.buyer_username}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedDeal.buyer_id}</p>
                </Card>
              )}
            </div>

            <Card className="p-4 bg-muted/30">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Создана:</span>
                  <span>{new Date(selectedDeal.created_at).toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Обновлена:</span>
                  <span>{new Date(selectedDeal.updated_at).toLocaleString('ru-RU')}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DealDetailsDialog;
