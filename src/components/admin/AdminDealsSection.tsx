import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const DEALS_URL = 'https://functions.poehali.dev/8a665174-b0af-4138-82e0-a9422dbb8fc4';

interface AdminDealsSectionProps {
  deals: any[];
  currentUserId: number;
  onRefresh: () => void;
}

const AdminDealsSection = ({ deals, currentUserId, onRefresh }: AdminDealsSectionProps) => {
  const { toast } = useToast();
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [editingDeal, setEditingDeal] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    status: '',
    step: ''
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: 'Активна', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      paid: { label: 'Оплачена', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      sent: { label: 'Отправлена', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      completed: { label: 'Завершена', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      cancelled: { label: 'Отменена', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      dispute: { label: 'Спор', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    };
    const { label, className } = statusMap[status] || { label: status, className: '' };
    return <Badge className={className}>{label}</Badge>;
  };

  const getStepBadge = (step: string) => {
    const stepMap: Record<string, string> = {
      created: 'Создана',
      buyer_paid: 'Покупатель оплатил',
      seller_sent: 'Продавец отправил',
      completed: 'Завершена'
    };
    return <Badge variant="outline" className="text-xs">{stepMap[step] || step}</Badge>;
  };

  const filteredDeals = deals.filter(deal => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return deal.status === 'active' || deal.status === 'paid' || deal.status === 'sent';
    if (filterStatus === 'disputes') return deal.status === 'dispute';
    return deal.status === filterStatus;
  });

  const handleEdit = (deal: any) => {
    setEditingDeal(deal);
    setEditForm({
      title: deal.title,
      description: deal.description,
      price: deal.price.toString(),
      status: deal.status,
      step: deal.step
    });
  };

  const handleSaveEdit = async () => {
    if (!editingDeal) return;
    setActionLoading(true);

    try {
      const response = await fetch(DEALS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_update_deal',
          deal_id: editingDeal.id,
          title: editForm.title,
          description: editForm.description,
          price: parseFloat(editForm.price),
          status: editForm.status,
          step: editForm.step
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: '✅ Сделка обновлена',
          description: 'Изменения успешно сохранены'
        });
        setEditingDeal(null);
        onRefresh();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось обновить сделку',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (dealId: number) => {
    if (!confirm('Удалить эту сделку? Это действие необратимо.')) return;
    setActionLoading(true);

    try {
      const response = await fetch(DEALS_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_delete_deal',
          deal_id: dealId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: '🗑️ Сделка удалена',
          description: 'Сделка успешно удалена из системы'
        });
        onRefresh();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось удалить сделку',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceComplete = async (dealId: number) => {
    if (!confirm('Принудительно завершить эту сделку? Средства будут переведены продавцу.')) return;
    setActionLoading(true);

    try {
      const response = await fetch(DEALS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_complete_deal',
          deal_id: dealId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: '✅ Сделка завершена',
          description: 'Сделка принудительно завершена администратором'
        });
        onRefresh();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось завершить сделку',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDeal = async (dealId: number) => {
    if (!confirm('Отменить эту сделку? Средства будут возвращены покупателю.')) return;
    setActionLoading(true);

    try {
      const response = await fetch(DEALS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId.toString()
        },
        body: JSON.stringify({
          action: 'admin_cancel_deal',
          deal_id: dealId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: '❌ Сделка отменена',
          description: 'Сделка отменена администратором'
        });
        onRefresh();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось отменить сделку',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка подключения к серверу',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Управление сделками</h2>
          <p className="text-sm text-muted-foreground">Всего сделок: {deals.length}</p>
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Фильтр по статусу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сделки</SelectItem>
            <SelectItem value="active">Активные</SelectItem>
            <SelectItem value="disputes">Споры</SelectItem>
            <SelectItem value="completed">Завершенные</SelectItem>
            <SelectItem value="cancelled">Отмененные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredDeals.length === 0 ? (
          <Card className="p-8 text-center">
            <Icon name="Package" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Нет сделок для отображения</p>
          </Card>
        ) : (
          filteredDeals.map((deal) => (
            <Card key={deal.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-lg">{deal.title}</h3>
                      {getStatusBadge(deal.status)}
                      {getStepBadge(deal.step)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{deal.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-primary">{deal.price.toFixed(2)} USDT</p>
                    <p className="text-xs text-muted-foreground">ID: {deal.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">👤 Продавец</p>
                    <p className="font-medium">{deal.seller_name || deal.seller_username}</p>
                    <p className="text-xs text-muted-foreground">ID: {deal.seller_id}</p>
                  </div>
                  {deal.buyer_id && (
                    <div>
                      <p className="text-muted-foreground mb-1">🛒 Покупатель</p>
                      <p className="font-medium">{deal.buyer_name || deal.buyer_username}</p>
                      <p className="text-xs text-muted-foreground">ID: {deal.buyer_id}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Clock" size={14} />
                  <span>Создана: {new Date(deal.created_at).toLocaleString('ru-RU')}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                  <Button 
                    onClick={() => setSelectedDeal(deal)} 
                    size="sm" 
                    variant="outline"
                  >
                    <Icon name="Eye" size={14} className="mr-1.5" />
                    Подробнее
                  </Button>
                  <Button 
                    onClick={() => handleEdit(deal)} 
                    size="sm" 
                    variant="outline"
                  >
                    <Icon name="Edit" size={14} className="mr-1.5" />
                    Редактировать
                  </Button>
                  {deal.status === 'dispute' && (
                    <>
                      <Button 
                        onClick={() => handleForceComplete(deal.id)} 
                        size="sm" 
                        variant="default"
                        disabled={actionLoading}
                      >
                        <Icon name="CheckCircle" size={14} className="mr-1.5" />
                        Завершить
                      </Button>
                      <Button 
                        onClick={() => handleCancelDeal(deal.id)} 
                        size="sm" 
                        variant="secondary"
                        disabled={actionLoading}
                      >
                        <Icon name="XCircle" size={14} className="mr-1.5" />
                        Отменить
                      </Button>
                    </>
                  )}
                  <Button 
                    onClick={() => handleDelete(deal.id)} 
                    size="sm" 
                    variant="destructive"
                    disabled={actionLoading}
                    className="ml-auto"
                  >
                    <Icon name="Trash2" size={14} className="mr-1.5" />
                    Удалить
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDeal} onOpenChange={() => setEditingDeal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактирование сделки #{editingDeal?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Название сделки"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <Label>Статус</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
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
              <Select value={editForm.step} onValueChange={(value) => setEditForm({ ...editForm, step: value })}>
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
              <Button onClick={() => setEditingDeal(null)} variant="outline" disabled={actionLoading}>
                Отмена
              </Button>
              <Button onClick={handleSaveEdit} disabled={actionLoading}>
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

      {/* Details Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
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
                  <p className="text-2xl font-bold text-green-400">{selectedDeal.price.toFixed(2)} USDT</p>
                </Card>
                
                <Card className="p-4 bg-orange-500/5 border-orange-500/20">
                  <p className="text-sm text-muted-foreground mb-2">💸 Комиссия</p>
                  <p className="text-2xl font-bold text-orange-400">{selectedDeal.commission.toFixed(2)} USDT</p>
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
    </div>
  );
};

export default AdminDealsSection;
