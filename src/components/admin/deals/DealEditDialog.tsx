import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface DealEditDialogProps {
  editingDeal: any | null;
  editForm: {
    title: string;
    description: string;
    price: string;
    status: string;
    step: string;
  };
  actionLoading: boolean;
  onClose: () => void;
  onFormChange: (form: any) => void;
  onSave: () => void;
}

const DealEditDialog = ({
  editingDeal,
  editForm,
  actionLoading,
  onClose,
  onFormChange,
  onSave
}: DealEditDialogProps) => {
  return (
    <Dialog open={!!editingDeal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактирование сделки #{editingDeal?.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Название</Label>
            <Input
              value={editForm.title}
              onChange={(e) => onFormChange({ ...editForm, title: e.target.value })}
              placeholder="Название сделки"
            />
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea
              value={editForm.description}
              onChange={(e) => onFormChange({ ...editForm, description: e.target.value })}
              placeholder="Описание сделки"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Цена (USDT)</Label>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) => onFormChange({ ...editForm, price: e.target.value })}
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <Label>Статус</Label>
              <Select value={editForm.status} onValueChange={(value) => onFormChange({ ...editForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активна</SelectItem>
                  <SelectItem value="paid">Оплачена</SelectItem>
                  <SelectItem value="sent">Отправлена</SelectItem>
                  <SelectItem value="completed">Завершена</SelectItem>
                  <SelectItem value="cancelled">Отменена</SelectItem>
                  <SelectItem value="dispute">Спор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Шаг</Label>
            <Select value={editForm.step} onValueChange={(value) => onFormChange({ ...editForm, step: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Создана</SelectItem>
                <SelectItem value="buyer_paid">Покупатель оплатил</SelectItem>
                <SelectItem value="seller_sent">Продавец отправил</SelectItem>
                <SelectItem value="completed">Завершена</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={onClose} variant="outline" disabled={actionLoading}>
              Отмена
            </Button>
            <Button onClick={onSave} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Icon name="Loader2" size={14} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" size={14} className="mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealEditDialog;
