import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Referral {
  id: number;
  status: string;
  total_deposited: number;
  created_at: string;
  completed_at?: string;
  referred_username: string;
  bonus_earned: number;
}

interface ReferralsListProps {
  referrals: Referral[];
  loading: boolean;
}

export const ReferralsList = ({ referrals, loading }: ReferralsListProps) => {
  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <Icon name="CheckCircle2" size={12} className="mr-1" />
          Завершен
        </Badge>
      );
    }
    if (status === 'active') {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Icon name="Activity" size={12} className="mr-1" />
          Активен
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Icon name="Clock" size={12} className="mr-1" />
        Ожидает
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Icon name="Users" size={20} className="text-primary" />
        Ваши рефералы ({referrals.length})
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Icon name="Loader2" size={24} className="animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Загрузка рефералов...</p>
        </div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="Users" size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">У вас пока нет рефералов</p>
          <p className="text-sm text-muted-foreground mt-1">
            Поделитесь своим реферальным кодом, чтобы начать зарабатывать
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-sm">Пользователь</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Статус</th>
                <th className="text-right py-3 px-4 font-semibold text-sm">Пополнено</th>
                <th className="text-right py-3 px-4 font-semibold text-sm">Заработано</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Дата</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr key={referral.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon name="User" size={16} className="text-primary" />
                      </div>
                      <span className="font-medium">{referral.referred_username}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(referral.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold">{referral.total_deposited.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground ml-1">USDT</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-green-500">{referral.bonus_earned.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground ml-1">USDT</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
