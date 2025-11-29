import { Badge } from '@/components/ui/badge';

export const getStatusBadge = (status: string) => {
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

export const getStepBadge = (step: string) => {
  const stepMap: Record<string, string> = {
    created: 'Создана',
    buyer_paid: 'Покупатель оплатил',
    seller_sent: 'Продавец отправил',
    completed: 'Завершена'
  };
  return <Badge variant="outline" className="text-xs">{stepMap[step] || step}</Badge>;
};
