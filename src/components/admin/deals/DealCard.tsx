import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface DealCardProps {
  deal: any;
  actionLoading: boolean;
  onViewDetails: (deal: any) => void;
  onEdit: (deal: any) => void;
  onForceComplete: (dealId: number) => void;
  onCancel: (dealId: number) => void;
  onDelete: (dealId: number) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getStepBadge: (step: string) => JSX.Element;
}

const DealCard = ({
  deal,
  actionLoading,
  onViewDetails,
  onEdit,
  onForceComplete,
  onCancel,
  onDelete,
  getStatusBadge,
  getStepBadge
}: DealCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
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
            <p className="text-2xl font-bold text-primary">{Number(deal.price || 0).toFixed(2)} USDT</p>
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
            onClick={() => onViewDetails(deal)} 
            size="sm" 
            variant="outline"
          >
            <Icon name="Eye" size={14} className="mr-1.5" />
            Подробнее
          </Button>
          <Button 
            onClick={() => onEdit(deal)} 
            size="sm" 
            variant="outline"
          >
            <Icon name="Edit" size={14} className="mr-1.5" />
            Редактировать
          </Button>
          {(deal.status === 'in_progress' || deal.status === 'dispute') && (
            <>
              <Button 
                onClick={() => onForceComplete(deal.id)} 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading}
              >
                <Icon name="CheckCircle" size={14} className="mr-1.5" />
                Завершить
              </Button>
              <Button 
                onClick={() => onCancel(deal.id)} 
                size="sm" 
                className="bg-orange-600 hover:bg-orange-700"
                disabled={actionLoading}
              >
                <Icon name="XCircle" size={14} className="mr-1.5" />
                Отменить
              </Button>
            </>
          )}
          <Button 
            onClick={() => onDelete(deal.id)} 
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
  );
};

export default DealCard;
