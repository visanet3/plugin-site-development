import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import DealCard from './deals/DealCard';
import DealEditDialog from './deals/DealEditDialog';
import DealDetailsDialog from './deals/DealDetailsDialog';
import { getStatusBadge, getStepBadge } from './deals/dealsUtils';

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
            <DealCard
              key={deal.id}
              deal={deal}
              actionLoading={actionLoading}
              onViewDetails={setSelectedDeal}
              onEdit={handleEdit}
              onForceComplete={handleForceComplete}
              onCancel={handleCancelDeal}
              onDelete={handleDelete}
              getStatusBadge={getStatusBadge}
              getStepBadge={getStepBadge}
            />
          ))
        )}
      </div>

      <DealEditDialog
        editingDeal={editingDeal}
        editForm={editForm}
        actionLoading={actionLoading}
        onClose={() => setEditingDeal(null)}
        onFormChange={setEditForm}
        onSave={handleSaveEdit}
      />

      <DealDetailsDialog
        selectedDeal={selectedDeal}
        onClose={() => setSelectedDeal(null)}
        getStatusBadge={getStatusBadge}
        getStepBadge={getStepBadge}
      />
    </div>
  );
};

export default AdminDealsSection;
